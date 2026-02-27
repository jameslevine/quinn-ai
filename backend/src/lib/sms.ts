/**
 * SMS Service using AWS Pinpoint SMS Voice V2
 * Handles sending and receiving SMS messages
 */

import {
  PinpointSMSVoiceV2Client,
  SendTextMessageCommand,
} from "@aws-sdk/client-pinpoint-sms-voice-v2";
import { PinpointClient, PhoneNumberValidateCommand } from "@aws-sdk/client-pinpoint";
import { getDbUserByPhoneNumber, updateDbUserPhoneVerification } from "../adapters/users";
import { getDbPendingActionsByUserId, updateDbActionStatus } from "../adapters/actions";
import { chat, type Message } from "./ai";

// Initialize AWS clients
const pinpointSMSClient = new PinpointSMSVoiceV2Client({
  region: process.env.AWS_REGION || "eu-west-2",
});
const pinpointClient = new PinpointClient({ region: process.env.AWS_REGION || "eu-west-2" });

// Sender ID ARN for UK SMS
const SENDER_ID_ARN =
  process.env.SMS_SENDER_ID_ARN || "arn:aws:sms-voice:eu-west-2:563146874500:sender-id/QUINN/GB";

// SMS message types
export interface SMSMessage {
  to: string;
  message: string;
  messageType?: "TRANSACTIONAL" | "PROMOTIONAL";
}

export interface IncomingSMS {
  from: string;
  to: string;
  message: string;
  timestamp: string;
  messageId?: string;
}

export interface SMSResponse {
  messageId: string;
  status: "success" | "failed";
  error?: string;
}

// Approval keywords
const APPROVAL_KEYWORDS = {
  approve: ["yes", "y", "approve", "ok", "confirm", "1"],
  reject: ["no", "n", "reject", "cancel", "deny", "0"],
};

/**
 * Send SMS using AWS Pinpoint SMS Voice V2
 */
export async function sendSMS(params: SMSMessage): Promise<SMSResponse> {
  try {
    // Validate phone number format
    const phoneNumber = normalizePhoneNumber(params.to);

    // Send the message using Pinpoint SMS Voice V2
    const command = new SendTextMessageCommand({
      DestinationPhoneNumber: phoneNumber,
      MessageBody: params.message,
      MessageType: params.messageType || "TRANSACTIONAL",
      OriginationIdentity: SENDER_ID_ARN,
    });

    const response = await pinpointSMSClient.send(command);

    return {
      messageId: response.MessageId || "",
      status: "success",
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      messageId: "",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send SMS using Amazon Pinpoint SMS Voice V2 (alias for sendSMS)
 */
export async function sendSMSViaPinpoint(params: SMSMessage): Promise<SMSResponse> {
  return sendSMS(params);
}

/**
 * Validate phone number using Pinpoint
 */
export async function validatePhoneNumber(phoneNumber: string): Promise<{
  valid: boolean;
  phoneType?: string;
  carrier?: string;
  countryCode?: string;
}> {
  try {
    const command = new PhoneNumberValidateCommand({
      NumberValidateRequest: {
        PhoneNumber: phoneNumber,
      },
    });

    const response = await pinpointClient.send(command);
    const result = response.NumberValidateResponse;

    return {
      valid: result?.PhoneType !== "INVALID",
      phoneType: result?.PhoneType,
      carrier: result?.Carrier,
      countryCode: result?.CountryCodeIso2,
    };
  } catch (error) {
    console.error("Error validating phone number:", error);
    return { valid: false };
  }
}

/**
 * Handle incoming SMS message
 */
export async function handleIncomingSMS(incoming: IncomingSMS): Promise<string> {
  try {
    const phoneNumber = normalizePhoneNumber(incoming.from);
    const message = incoming.message.trim().toLowerCase();

    // Find user by phone number
    const user = await getDbUserByPhoneNumber(phoneNumber);

    if (!user) {
      return "Sorry, I don't recognize this phone number. Please register your number in the Quinn app first.";
    }

    // Check if this is an approval response
    if (isApprovalResponse(message)) {
      return await handleApprovalResponse(user.userId, message);
    }

    // Check if this is a verification code
    if (isVerificationCode(message)) {
      return await handleVerificationCode(user.userId, message);
    }

    // Otherwise, treat as a natural language request
    return await handleNaturalLanguageRequest(user.userId, message);
  } catch (error) {
    console.error("Error handling incoming SMS:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

/**
 * Check if message is an approval response
 */
function isApprovalResponse(message: string): boolean {
  const allKeywords = [...APPROVAL_KEYWORDS.approve, ...APPROVAL_KEYWORDS.reject];
  return allKeywords.includes(message);
}

/**
 * Handle approval response
 */
async function handleApprovalResponse(userId: string, message: string): Promise<string> {
  const isApproval = APPROVAL_KEYWORDS.approve.includes(message);

  // Get pending actions for user
  const pendingActions = await getDbPendingActionsByUserId(userId);

  if (pendingActions.length === 0) {
    return "You have no pending actions to approve.";
  }

  // Get the most recent pending action
  const action = pendingActions[0];

  if (!action) {
    return "You have no pending actions to approve.";
  }

  // Update action status
  const newStatus = isApproval ? "approved" : "rejected";
  await updateDbActionStatus(userId, action.actionId, newStatus);

  if (isApproval) {
    return `✅ Approved: ${action.title}\n\nI'll proceed with this action now.`;
  } else {
    return `❌ Rejected: ${action.title}\n\nThis action has been cancelled.`;
  }
}

/**
 * Check if message is a verification code
 */
function isVerificationCode(message: string): boolean {
  return /^\d{6}$/.test(message);
}

/**
 * Handle verification code
 */
async function handleVerificationCode(userId: string, code: string): Promise<string> {
  const verified = await updateDbUserPhoneVerification(userId, code);

  if (verified) {
    return "✅ Your phone number has been verified! You can now receive SMS notifications and approvals.";
  } else {
    return "❌ Invalid verification code. Please try again or request a new code from the app.";
  }
}

/**
 * Handle natural language request via SMS
 */
async function handleNaturalLanguageRequest(_userId: string, message: string): Promise<string> {
  try {
    // Create conversation context
    const messages: Message[] = [
      {
        role: "user",
        content: message,
      },
    ];

    // Get AI response
    const response = await chat(messages, {
      model: "haiku", // Use faster model for SMS
      maxTokens: 256, // Keep responses short for SMS
    });

    const content = response.content;

    // Truncate response if too long for SMS (160 chars per segment)
    if (content.length > 320) {
      return content.substring(0, 317) + "...";
    }

    return content;
  } catch (error) {
    console.error("Error processing natural language request:", error);
    return "Sorry, I couldn't process your request. Please try again.";
  }
}

/**
 * Send approval request via SMS
 */
export async function sendApprovalRequestSMS(
  phoneNumber: string,
  action: {
    actionId: string;
    title: string;
    description?: string;
    type: string;
    amount?: number;
    currency?: string;
  }
): Promise<SMSResponse> {
  let message = `🔔 Quinn Approval Request\n\n`;
  message += `${action.title}\n`;

  if (action.description) {
    message += `${action.description}\n`;
  }

  if (action.amount && action.currency) {
    message += `Amount: ${action.currency}${action.amount}\n`;
  }

  message += `\nReply YES to approve or NO to reject.`;

  return sendSMS({
    to: phoneNumber,
    message,
    messageType: "TRANSACTIONAL",
  });
}

/**
 * Send status update via SMS
 */
export async function sendStatusUpdateSMS(
  phoneNumber: string,
  update: {
    title: string;
    status: string;
    details?: string;
  }
): Promise<SMSResponse> {
  let message = `📋 Quinn Update\n\n`;
  message += `${update.title}\n`;
  message += `Status: ${update.status}\n`;

  if (update.details) {
    message += `\n${update.details}`;
  }

  return sendSMS({
    to: phoneNumber,
    message,
    messageType: "TRANSACTIONAL",
  });
}

/**
 * Send reminder via SMS
 */
export async function sendReminderSMS(
  phoneNumber: string,
  reminder: {
    title: string;
    time: string;
    location?: string;
  }
): Promise<SMSResponse> {
  let message = `⏰ Quinn Reminder\n\n`;
  message += `${reminder.title}\n`;
  message += `Time: ${reminder.time}\n`;

  if (reminder.location) {
    message += `Location: ${reminder.location}`;
  }

  return sendSMS({
    to: phoneNumber,
    message,
    messageType: "TRANSACTIONAL",
  });
}

/**
 * Send verification code via SMS
 */
export async function sendVerificationCodeSMS(
  phoneNumber: string,
  code: string
): Promise<SMSResponse> {
  const message = `Your Quinn verification code is: ${code}\n\nThis code expires in 10 minutes.`;

  return sendSMS({
    to: phoneNumber,
    message,
    messageType: "TRANSACTIONAL",
  });
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, "");

  // Ensure it starts with +
  if (!normalized.startsWith("+")) {
    // Assume UK number if no country code
    if (normalized.startsWith("0")) {
      normalized = "+44" + normalized.substring(1);
    } else {
      normalized = "+" + normalized;
    }
  }

  return normalized;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);

  // UK format
  if (normalized.startsWith("+44")) {
    const local = normalized.substring(3);
    return `+44 ${local.substring(0, 4)} ${local.substring(4)}`;
  }

  // US format
  if (normalized.startsWith("+1")) {
    const local = normalized.substring(2);
    return `+1 (${local.substring(0, 3)}) ${local.substring(3, 6)}-${local.substring(6)}`;
  }

  return normalized;
}
