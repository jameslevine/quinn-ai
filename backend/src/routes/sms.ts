/**
 * SMS Routes - Webhook handlers for incoming SMS via AWS SNS/Pinpoint
 */

import { Router, Request, Response } from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validation";
import {
  handleIncomingSMS,
  sendVerificationCodeSMS,
  validatePhoneNumber,
  formatPhoneNumber,
} from "../lib/sms";
import {
  updateDbUserPhoneNumber,
  getDbUserById,
  updateDbUserPhoneVerification,
} from "../adapters/users";
import { dynamodb, TABLE_NAME } from "../adapters/dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  PinpointSMSVoiceV2Client,
  DescribeVerifiedDestinationNumbersCommand,
} from "@aws-sdk/client-pinpoint-sms-voice-v2";

// Initialize Pinpoint SMS Voice V2 client
const pinpointSMSClient = new PinpointSMSVoiceV2Client({
  region: process.env.AWS_REGION || "eu-west-2",
});

export const router: Router = Router();

// Validation schemas
const snsNotificationSchema = Joi.object({
  Type: Joi.string().valid("Notification", "SubscriptionConfirmation", "UnsubscribeConfirmation"),
  MessageId: Joi.string(),
  TopicArn: Joi.string(),
  Subject: Joi.string().optional(),
  Message: Joi.string(),
  Timestamp: Joi.string(),
  SignatureVersion: Joi.string(),
  Signature: Joi.string(),
  SigningCertURL: Joi.string(),
  SubscribeURL: Joi.string().optional(),
  UnsubscribeURL: Joi.string().optional(),
}).unknown(true);

const registerPhoneSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required(),
});

const verifyPhoneSchema = Joi.object({
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required(),
});

/**
 * SNS Webhook - Receives incoming SMS notifications from AWS SNS
 * POST /sms/webhook/sns
 */
router.post(
  "/webhook/sns",
  validateBody(snsNotificationSchema),
  async (req: Request, res: Response) => {
    try {
      const notification = req.body;

      // Handle subscription confirmation
      if (notification.Type === "SubscriptionConfirmation") {
        // In production, you would verify the signature and confirm the subscription
        // by making a GET request to the SubscribeURL
        console.log("SNS Subscription Confirmation received:", notification.SubscribeURL);
        return res.status(200).json({ message: "Subscription confirmation received" });
      }

      // Handle unsubscribe confirmation
      if (notification.Type === "UnsubscribeConfirmation") {
        console.log("SNS Unsubscribe Confirmation received");
        return res.status(200).json({ message: "Unsubscribe confirmation received" });
      }

      // Handle notification (incoming SMS)
      if (notification.Type === "Notification") {
        const message = JSON.parse(notification.Message);

        // Extract SMS details from the notification
        const incomingSMS = {
          from: message.originationNumber || message.from,
          to: message.destinationNumber || message.to,
          message: message.messageBody || message.body || message.message,
          timestamp: notification.Timestamp,
          messageId: notification.MessageId,
        };

        // Process the incoming SMS
        const response = await handleIncomingSMS(incomingSMS);

        // The response will be sent back via the SMS service
        console.log("SMS processed, response:", response);

        return res.status(200).json({ message: "SMS processed", response });
      }

      return res.status(400).json({ message: "Unknown notification type" });
    } catch (error) {
      console.error("Error processing SNS webhook:", error);
      return res.status(500).json({ message: "Error processing webhook" });
    }
  }
);

/**
 * Pinpoint Webhook - Receives incoming SMS notifications from Amazon Pinpoint
 * POST /sms/webhook/pinpoint
 */
router.post("/webhook/pinpoint", async (req: Request, res: Response) => {
  try {
    const event = req.body;

    // Pinpoint sends events in a different format
    if (event.eventType === "SMS.RECEIVED") {
      const incomingSMS = {
        from: event.originationNumber,
        to: event.destinationNumber,
        message: event.messageBody,
        timestamp: event.eventTimestamp || new Date().toISOString(),
        messageId: event.messageId,
      };

      const response = await handleIncomingSMS(incomingSMS);
      console.log("Pinpoint SMS processed, response:", response);

      return res.status(200).json({ message: "SMS processed", response });
    }

    // Handle delivery status events
    if (event.eventType?.startsWith("SMS.")) {
      console.log("Pinpoint SMS event:", event.eventType, event);
      return res.status(200).json({ message: "Event received" });
    }

    return res.status(200).json({ message: "Event acknowledged" });
  } catch (error) {
    console.error("Error processing Pinpoint webhook:", error);
    return res.status(500).json({ message: "Error processing webhook" });
  }
});

/**
 * Register phone number for SMS notifications
 * POST /sms/register
 */
router.post("/register", validateBody(registerPhoneSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { phoneNumber } = req.body;

    // Validate phone number
    const validation = await validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      return res.status(400).json({
        message: "Invalid phone number",
        details: validation,
      });
    }

    // Update user with phone number and generate verification code
    const user = await updateDbUserPhoneNumber(userId, phoneNumber);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send verification code
    if (user.phoneVerificationCode) {
      await sendVerificationCodeSMS(phoneNumber, user.phoneVerificationCode);
    }

    res.json({
      message: "Verification code sent",
      phoneNumber: formatPhoneNumber(phoneNumber),
      phoneType: validation.phoneType,
      carrier: validation.carrier,
    });
  } catch (error) {
    console.error("Error registering phone number:", error);
    res.status(500).json({ message: "Error registering phone number" });
  }
});

/**
 * Verify phone number with code
 * POST /sms/verify
 */
router.post("/verify", validateBody(verifyPhoneSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { code } = req.body;

    // Get user to check if they have a pending verification
    const user = await getDbUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ message: "No phone number registered" });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ message: "Phone number already verified" });
    }

    // Verify the code
    const verified = await updateDbUserPhoneVerification(userId, code);

    if (!verified) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    res.json({
      message: "Phone number verified successfully",
      phoneNumber: formatPhoneNumber(user.phoneNumber),
    });
  } catch (error) {
    console.error("Error verifying phone number:", error);
    res.status(500).json({ message: "Error verifying phone number" });
  }
});

/**
 * Resend verification code
 * POST /sms/resend-verification
 */
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user
    const user = await getDbUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ message: "No phone number registered" });
    }

    if (user.phoneVerified) {
      return res.status(400).json({ message: "Phone number already verified" });
    }

    // Generate new verification code
    const updatedUser = await updateDbUserPhoneNumber(userId, user.phoneNumber);
    if (!updatedUser?.phoneVerificationCode) {
      return res.status(500).json({ message: "Error generating verification code" });
    }

    // Send new verification code
    await sendVerificationCodeSMS(user.phoneNumber, updatedUser.phoneVerificationCode);

    res.json({
      message: "Verification code resent",
      phoneNumber: formatPhoneNumber(user.phoneNumber),
    });
  } catch (error) {
    console.error("Error resending verification code:", error);
    res.status(500).json({ message: "Error resending verification code" });
  }
});

/**
 * Get SMS status for current user
 * GET /sms/status
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await getDbUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      phoneNumber: user.phoneNumber ? formatPhoneNumber(user.phoneNumber) : null,
      phoneVerified: user.phoneVerified || false,
      smsEnabled: user.settings?.notifications?.sms || false,
    });
  } catch (error) {
    console.error("Error getting SMS status:", error);
    res.status(500).json({ message: "Error getting SMS status" });
  }
});

/**
 * Get AWS verified destination numbers (sandbox mode)
 * GET /sms/verified-numbers
 */
router.get("/verified-numbers", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get verified destination numbers from AWS Pinpoint SMS Voice V2
    const command = new DescribeVerifiedDestinationNumbersCommand({});
    const response = await pinpointSMSClient.send(command);

    const verifiedNumbers =
      response.VerifiedDestinationNumbers?.map((num) => ({
        phoneNumber: num.DestinationPhoneNumber,
        formattedPhoneNumber: formatPhoneNumber(num.DestinationPhoneNumber || ""),
        status: num.Status,
        verifiedAt: num.CreatedTimestamp?.toISOString(),
      })) || [];

    res.json({
      verifiedNumbers,
      sandboxMode: true, // AWS accounts start in sandbox mode
    });
  } catch (error) {
    console.error("Error getting verified numbers:", error);
    res.status(500).json({ message: "Error getting verified numbers" });
  }
});

/**
 * Unregister phone number
 * DELETE /sms/unregister
 */
router.delete("/unregister", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: "PROFILE",
      },
      UpdateExpression:
        "REMOVE #phoneNumber, #phoneVerified, #phoneVerificationCode, #phoneVerificationExpiry, #gsi2pk SET #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#phoneNumber": "phoneNumber",
        "#phoneVerified": "phoneVerified",
        "#phoneVerificationCode": "phoneVerificationCode",
        "#phoneVerificationExpiry": "phoneVerificationExpiry",
        "#gsi2pk": "gsi2pk",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":updatedAt": new Date().toISOString(),
      },
    };

    await dynamodb.send(new UpdateCommand(params));

    res.json({ message: "Phone number unregistered" });
  } catch (error) {
    console.error("Error unregistering phone number:", error);
    res.status(500).json({ message: "Error unregistering phone number" });
  }
});
