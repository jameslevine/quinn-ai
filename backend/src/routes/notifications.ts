/**
 * Notification Routes - Device registration and preferences management
 */

import { Router, Request, Response } from "express";
import Joi from "joi";
import { validateBody } from "../middleware/validation";
import {
  registerDevice,
  unregisterDevice,
  getUserDevices,
  updateDeviceToken,
  getNotificationPreferences,
  saveNotificationPreferences,
  sendPushToUser,
  type Platform,
  type PushNotification,
} from "../lib/notifications";

export const router: Router = Router();

// Validation schemas
const registerDeviceSchema = Joi.object({
  token: Joi.string().required(),
  platform: Joi.string().valid("ios", "android", "web").required(),
});

const updateTokenSchema = Joi.object({
  oldToken: Joi.string().required(),
  newToken: Joi.string().required(),
});

const preferencesSchema = Joi.object({
  channels: Joi.object({
    push: Joi.boolean(),
    sms: Joi.boolean(),
    whatsapp: Joi.boolean(),
    email: Joi.boolean(),
  }),
  types: Joi.object({
    approvals: Joi.array().items(Joi.string().valid("push", "sms", "whatsapp", "email")),
    completions: Joi.array().items(Joi.string().valid("push", "sms", "whatsapp", "email")),
    reminders: Joi.array().items(Joi.string().valid("push", "sms", "whatsapp", "email")),
    alerts: Joi.array().items(Joi.string().valid("push", "sms", "whatsapp", "email")),
    dailyBriefing: Joi.array().items(Joi.string().valid("push", "sms", "whatsapp", "email")),
  }),
  quietHours: Joi.object({
    enabled: Joi.boolean(),
    start: Joi.string().pattern(/^\d{2}:\d{2}$/),
    end: Joi.string().pattern(/^\d{2}:\d{2}$/),
    timezone: Joi.string(),
  }),
  limits: Joi.object({
    maxPerHour: Joi.number().integer().min(1).max(100),
    maxPerDay: Joi.number().integer().min(1).max(500),
  }),
});

const testNotificationSchema = Joi.object({
  title: Joi.string().default("Test Notification"),
  body: Joi.string().default("This is a test notification from Quinn"),
});

/**
 * Register a device for push notifications
 * POST /notifications/devices
 */
router.post("/devices", validateBody(registerDeviceSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { token, platform } = req.body;

    const device = await registerDevice(userId, token, platform as Platform);

    res.status(201).json({
      message: "Device registered successfully",
      device: {
        token: device.token,
        platform: device.platform,
        createdAt: device.createdAt,
      },
    });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ message: "Error registering device" });
  }
});

/**
 * Get all registered devices for current user
 * GET /notifications/devices
 */
router.get("/devices", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const devices = await getUserDevices(userId);

    res.json({
      devices: devices.map((d) => ({
        token: d.token.substring(0, 20) + "...", // Truncate for security
        platform: d.platform,
        createdAt: d.createdAt,
        lastUsedAt: d.lastUsedAt,
      })),
    });
  } catch (error) {
    console.error("Error getting devices:", error);
    res.status(500).json({ message: "Error getting devices" });
  }
});

/**
 * Unregister a device
 * DELETE /notifications/devices/:token
 */
router.delete("/devices/:token", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    await unregisterDevice(userId, token);

    res.json({ message: "Device unregistered successfully" });
  } catch (error) {
    console.error("Error unregistering device:", error);
    res.status(500).json({ message: "Error unregistering device" });
  }
});

/**
 * Update device token (for token refresh)
 * PUT /notifications/devices/token
 */
router.put(
  "/devices/token",
  validateBody(updateTokenSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { oldToken, newToken } = req.body;

      const device = await updateDeviceToken(userId, oldToken, newToken);

      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      res.json({
        message: "Device token updated successfully",
        device: {
          token: device.token.substring(0, 20) + "...",
          platform: device.platform,
        },
      });
    } catch (error) {
      console.error("Error updating device token:", error);
      res.status(500).json({ message: "Error updating device token" });
    }
  }
);

/**
 * Get notification preferences
 * GET /notifications/preferences
 */
router.get("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const preferences = await getNotificationPreferences(userId);

    res.json(preferences);
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    res.status(500).json({ message: "Error getting notification preferences" });
  }
});

/**
 * Update notification preferences
 * PUT /notifications/preferences
 */
router.put("/preferences", validateBody(preferencesSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const preferences = await saveNotificationPreferences(userId, req.body);

    res.json({
      message: "Preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Error updating notification preferences" });
  }
});

/**
 * Send a test notification to current user
 * POST /notifications/test
 */
router.post("/test", validateBody(testNotificationSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, body } = req.body;

    const notification: PushNotification = {
      title: title || "Test Notification",
      body: body || "This is a test notification from Quinn",
      priority: "normal",
      type: "alert",
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    };

    const result = await sendPushToUser(userId, notification);

    if (result.sent === 0) {
      return res.status(400).json({
        message: "No devices registered for push notifications",
        result,
      });
    }

    res.json({
      message: "Test notification sent",
      result,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ message: "Error sending test notification" });
  }
});
