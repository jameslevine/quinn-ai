// User Types

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  timezone: string;
  locale: string;
  status: UserStatus;
  tier: UserTier;
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export type UserStatus = "active" | "inactive" | "suspended";

export type UserTier = "starter" | "pro" | "premium" | "family";

export interface UserPreferences {
  approvalModes: ApprovalModes;
  notificationChannels: NotificationChannel[];
  notificationPreferences: NotificationPreferences;
  autoApproveTimeout: number;
  spendingLimits: SpendingLimits;
  aiPreferences: AIPreferences;
}

export interface ApprovalModes {
  email_draft: ApprovalMode;
  email_send: ApprovalMode;
  phone_call: ApprovalMode;
  grocery_order: ApprovalMode;
  food_delivery: ApprovalMode;
  bill_payment: ApprovalMode;
  appointment_booking: ApprovalMode;
  travel_booking: ApprovalMode;
  gift_ordering: ApprovalMode;
}

export type ApprovalMode = "suggest_only" | "auto_with_review" | "full_auto";

export type NotificationChannel = "push" | "email" | "sms";

export interface NotificationPreferences {
  dailyBriefing: boolean;
  dailyBriefingTime: string;
  urgentApprovals: boolean;
  weeklyReport: boolean;
}

export interface SpendingLimits {
  perTransaction: number;
  daily: number;
  weekly: number;
  monthly: number;
}

export interface AIPreferences {
  preferredModel: string;
  responseStyle: "formal" | "casual" | "friendly";
  voiceId: string;
}
