/**
 * Notifications Hook - Manage push notifications and preferences
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

// Types
type NotificationChannel = "push" | "sms" | "whatsapp" | "email";
type Platform = "ios" | "android" | "web";

interface Device {
  token: string;
  platform: Platform;
  createdAt: string;
  lastUsedAt: string;
}

interface NotificationPreferences {
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
    start: string;
    end: string;
    timezone: string;
  };
  limits: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

interface RegisterDeviceParams {
  token: string;
  platform: Platform;
}

interface UpdateTokenParams {
  oldToken: string;
  newToken: string;
}

interface TestNotificationParams {
  title?: string;
  body?: string;
}

// Query keys
const NOTIFICATION_KEYS = {
  devices: ["notifications", "devices"] as const,
  preferences: ["notifications", "preferences"] as const,
};

/**
 * Get registered devices
 */
export const useDevices = () => {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.devices,
    queryFn: async () => {
      const response = await api.get<{ devices: Device[] }>("/notifications/devices");
      return response.data?.devices || [];
    },
  });
};

/**
 * Register a device for push notifications
 */
export const useRegisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RegisterDeviceParams) => {
      const response = await api.post<{ message: string; device: Device }>(
        "/notifications/devices",
        params
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices });
    },
  });
};

/**
 * Unregister a device
 */
export const useUnregisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.delete<{ message: string }>(`/notifications/devices/${token}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices });
    },
  });
};

/**
 * Update device token (for token refresh)
 */
export const useUpdateDeviceToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateTokenParams) => {
      const response = await api.put<{ message: string; device: Device }>(
        "/notifications/devices/token",
        params
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices });
    },
  });
};

/**
 * Get notification preferences
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences,
    queryFn: async () => {
      const response = await api.get<NotificationPreferences>("/notifications/preferences");
      return response.data;
    },
  });
};

/**
 * Update notification preferences
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const response = await api.put<{ message: string; preferences: NotificationPreferences }>(
        "/notifications/preferences",
        preferences
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences });
    },
  });
};

/**
 * Send a test notification
 */
export const useSendTestNotification = () => {
  return useMutation({
    mutationFn: async (params?: TestNotificationParams) => {
      const response = await api.post<{
        message: string;
        result: { sent: number; failed: number };
      }>("/notifications/test", params || {});
      return response;
    },
  });
};

/**
 * Request notification permission (browser)
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
};

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = (): boolean => {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
};

/**
 * Get current notification permission
 */
export const getNotificationPermission = (): NotificationPermission | "unsupported" => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
};

/**
 * Detect platform
 */
export const detectPlatform = (): Platform => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "web";
};
