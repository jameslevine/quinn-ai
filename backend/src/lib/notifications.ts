/**
 * Push Notification Service
 * Handles sending push notifications via AWS SNS Platform Applications
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  SNSClient,
  CreatePlatformEndpointCommand,
  PublishCommand,
  DeleteEndpointCommand,
  GetEndpointAttributesCommand,
  SetEndpointAttributesCommand,
} from "@aws-sdk/client-sns";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION || "eu-west-2" });

const TABLE_NAME = process.env.DYNAMODB_TABLE || "quinn-dev";

// SNS Platform Application ARNs (configured in AWS)
const PLATFORM_ARNS = {
  ios: process.env.SNS_PLATFORM_ARN_IOS || "",
  android: process.env.SNS_PLATFORM_ARN_ANDROID || "",
  web: process.env.SNS_PLATFORM_ARN_WEB || "", // For web push via FCM
};

// Types
export type NotificationChannel = "push" | "sms" | "whatsapp" | "email";
export type NotificationType =
  | "approval_request"
  | "action_completed"
  | "reminder"
  | "alert"
  | "daily_briefing";
export type Platform = "ios" | "android" | "web";

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionButtons?: ActionButton[];
  priority: "high" | "normal" | "low";
  type: NotificationType;
}

export interface ActionButton {
  id: string;
  title: string;
  action: string;
}

export interface DeviceToken {
  userId: string;
  token: string;
  platform: Platform;
  endpointArn?: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  types: {
    approvals: NotificationChannel[];
    completions: NotificationChannel[];
    reminders: NotificationChannel[];
    alerts: NotificationChannel[];
    dailyBriefing: NotificationChannel[];
  };
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string;
  };
  limits: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

// Default preferences
const DEFAULT_PREFERENCES: Omit<NotificationPreferences, "userId"> = {
  channels: {
    push: true,
    sms: false,
    whatsapp: false,
    email: true,
  },
  types: {
    approvals: ["push", "email"],
    completions: ["push"],
    reminders: ["push", "email"],
    alerts: ["push", "sms", "email"],
    dailyBriefing: ["email"],
  },
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "08:00",
    timezone: "Europe/London",
  },
  limits: {
    maxPerHour: 10,
    maxPerDay: 50,
  },
};

// ============ Device Registration ============

/**
 * Register a device for push notifications
 */
export async function registerDevice(
  userId: string,
  token: string,
  platform: Platform
): Promise<DeviceToken> {
  const now = new Date().toISOString();

  // Create SNS platform endpoint
  let endpointArn: string | undefined;
  const platformArn = PLATFORM_ARNS[platform];

  if (platformArn) {
    try {
      const response = await snsClient.send(
        new CreatePlatformEndpointCommand({
          PlatformApplicationArn: platformArn,
          Token: token,
          CustomUserData: userId,
        })
      );
      endpointArn = response.EndpointArn;
    } catch (error) {
      console.error("Error creating SNS endpoint:", error);
      // Continue without endpoint - can retry later
    }
  }

  const device: DeviceToken = {
    userId,
    token,
    platform,
    endpointArn,
    createdAt: now,
    lastUsedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `DEVICE#${token}`,
        ...device,
      },
    })
  );

  return device;
}

/**
 * Unregister a device from push notifications
 */
export async function unregisterDevice(userId: string, token: string): Promise<void> {
  // Get the device to find the endpoint ARN
  const devices = await getUserDevices(userId);
  const device = devices.find((d) => d.token === token);

  // Delete SNS endpoint if exists
  if (device?.endpointArn) {
    try {
      await snsClient.send(
        new DeleteEndpointCommand({
          EndpointArn: device.endpointArn,
        })
      );
    } catch (error) {
      console.error("Error deleting SNS endpoint:", error);
    }
  }

  // Delete from DynamoDB
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `DEVICE#${token}`,
      },
    })
  );
}

/**
 * Get all registered devices for a user
 */
export async function getUserDevices(userId: string): Promise<DeviceToken[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "DEVICE#",
      },
    })
  );

  return (result.Items || []) as DeviceToken[];
}

/**
 * Update device token (for token refresh)
 */
export async function updateDeviceToken(
  userId: string,
  oldToken: string,
  newToken: string
): Promise<DeviceToken | null> {
  const devices = await getUserDevices(userId);
  const device = devices.find((d) => d.token === oldToken);

  if (!device) {
    return null;
  }

  // Update SNS endpoint with new token
  if (device.endpointArn) {
    try {
      await snsClient.send(
        new SetEndpointAttributesCommand({
          EndpointArn: device.endpointArn,
          Attributes: {
            Token: newToken,
            Enabled: "true",
          },
        })
      );
    } catch (error) {
      console.error("Error updating SNS endpoint:", error);
    }
  }

  // Delete old record and create new one
  await unregisterDevice(userId, oldToken);
  return registerDevice(userId, newToken, device.platform);
}

// ============ Notification Preferences ============

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND sk = :sk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "PREFERENCES#NOTIFICATIONS",
      },
    })
  );

  if (result.Items && result.Items.length > 0) {
    return result.Items[0] as NotificationPreferences;
  }

  // Return default preferences
  return {
    userId,
    ...DEFAULT_PREFERENCES,
  };
}

/**
 * Save notification preferences for a user
 */
export async function saveNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences(userId);
  const updated = {
    ...current,
    ...preferences,
    userId,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: "PREFERENCES#NOTIFICATIONS",
        ...updated,
      },
    })
  );

  return updated;
}

// ============ Send Notifications ============

/**
 * Send push notification to a specific device
 */
export async function sendPushToDevice(
  endpointArn: string,
  notification: PushNotification
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format message for different platforms
    const message = formatPushMessage(notification);

    const response = await snsClient.send(
      new PublishCommand({
        TargetArn: endpointArn,
        Message: JSON.stringify(message),
        MessageStructure: "json",
      })
    );

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error("Error sending push notification:", error);

    // Check if endpoint is disabled
    if (error instanceof Error && error.name === "EndpointDisabledException") {
      // Mark endpoint as disabled in DB
      return {
        success: false,
        error: "Endpoint disabled",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send push notification to all user devices
 */
export async function sendPushToUser(
  userId: string,
  notification: PushNotification
): Promise<{ sent: number; failed: number }> {
  const devices = await getUserDevices(userId);
  let sent = 0;
  let failed = 0;

  for (const device of devices) {
    if (device.endpointArn) {
      const result = await sendPushToDevice(device.endpointArn, notification);
      if (result.success) {
        sent++;
        // Update last used timestamp
        await updateDeviceLastUsed(userId, device.token);
      } else {
        failed++;
        // If endpoint is disabled, remove the device
        if (result.error === "Endpoint disabled") {
          await unregisterDevice(userId, device.token);
        }
      }
    }
  }

  return { sent, failed };
}

/**
 * Update device last used timestamp
 */
async function updateDeviceLastUsed(userId: string, token: string): Promise<void> {
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: `USER#${userId}`,
          sk: `DEVICE#${token}`,
        },
        UpdateExpression: "SET lastUsedAt = :now",
        ExpressionAttributeValues: {
          ":now": new Date().toISOString(),
        },
      })
    );
  } catch (error) {
    console.error("Error updating device last used:", error);
  }
}

/**
 * Format push message for different platforms
 */
function formatPushMessage(notification: PushNotification): Record<string, string> {
  // APNS (iOS) format
  const apns = {
    aps: {
      alert: {
        title: notification.title,
        body: notification.body,
      },
      sound: "default",
      badge: 1,
      "content-available": 1,
    },
    data: notification.data || {},
    type: notification.type,
  };

  // FCM (Android/Web) format
  const fcm = {
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: {
      ...notification.data,
      type: notification.type,
    },
    android: {
      priority: notification.priority === "high" ? "high" : "normal",
    },
  };

  return {
    default: notification.body,
    APNS: JSON.stringify(apns),
    APNS_SANDBOX: JSON.stringify(apns),
    GCM: JSON.stringify(fcm),
  };
}

// ============ Notification Routing ============

/**
 * Send notification through appropriate channels based on user preferences
 */
export async function sendNotification(
  userId: string,
  notification: PushNotification
): Promise<{ channels: Record<NotificationChannel, boolean> }> {
  const preferences = await getNotificationPreferences(userId);
  const results: Record<NotificationChannel, boolean> = {
    push: false,
    sms: false,
    whatsapp: false,
    email: false,
  };

  // Check quiet hours
  if (isQuietHours(preferences)) {
    // Only send high priority notifications during quiet hours
    if (notification.priority !== "high") {
      return { channels: results };
    }
  }

  // Get preferred channels for this notification type
  const typeKey = mapNotificationTypeToPreferenceKey(notification.type);
  const preferredChannels = preferences.types[typeKey] || [];

  // Send via each preferred channel
  for (const channel of preferredChannels) {
    if (!preferences.channels[channel]) {
      continue; // Channel disabled
    }

    switch (channel) {
      case "push":
        const pushResult = await sendPushToUser(userId, notification);
        results.push = pushResult.sent > 0;
        break;

      case "sms":
        // SMS handled by sms.ts
        results.sms = false; // Will be implemented via sms.ts
        break;

      case "email":
        // Email handled by gmail.ts
        results.email = false; // Will be implemented via gmail.ts
        break;

      case "whatsapp":
        // WhatsApp not yet implemented
        results.whatsapp = false;
        break;
    }
  }

  return { channels: results };
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const timezone = preferences.quietHours.timezone || "Europe/London";

  // Get current time in user's timezone
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const currentTime = formatter.format(now);

  const start = preferences.quietHours.start;
  const end = preferences.quietHours.end;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
}

/**
 * Map notification type to preference key
 */
function mapNotificationTypeToPreferenceKey(
  type: NotificationType
): keyof NotificationPreferences["types"] {
  switch (type) {
    case "approval_request":
      return "approvals";
    case "action_completed":
      return "completions";
    case "reminder":
      return "reminders";
    case "alert":
      return "alerts";
    case "daily_briefing":
      return "dailyBriefing";
    default:
      return "alerts";
  }
}

/**
 * Check if endpoint is still valid
 */
export async function checkEndpointStatus(
  endpointArn: string
): Promise<{ enabled: boolean; token?: string }> {
  try {
    const response = await snsClient.send(
      new GetEndpointAttributesCommand({
        EndpointArn: endpointArn,
      })
    );

    return {
      enabled: response.Attributes?.Enabled === "true",
      token: response.Attributes?.Token,
    };
  } catch (error) {
    console.error("Error checking endpoint status:", error);
    return { enabled: false };
  }
}
