// Approval Types

import { ActionType, ActionPayload } from "./action";

export interface Approval {
  approvalId: string;
  userId: string;
  actionId: string;
  actionType: ActionType;
  status: ApprovalStatus;
  title: string;
  description: string;
  details: ApprovalDetails;
  requestedAt: string;
  expiresAt: string;
  respondedAt?: string;
  response?: ApprovalResponse;
  notificationsSent: NotificationRecord[];
  createdAt: string;
  updatedAt: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "auto_approved";

export interface ApprovalDetails {
  summary: string;
  changes?: string[];
  cost?: {
    amount: number;
    currency: string;
  };
  risks?: string[];
  alternatives?: string[];
}

export interface ApprovalResponse {
  decision: "approve" | "reject" | "edit";
  editedPayload?: ActionPayload;
  reason?: string;
  respondedVia: "app" | "email" | "sms" | "voice";
}

export interface NotificationRecord {
  channel: "push" | "email" | "sms";
  sentAt: string;
  status: "sent" | "delivered" | "failed";
}

export interface RespondToApprovalInput {
  decision: "approve" | "reject" | "edit";
  editedPayload?: ActionPayload;
  reason?: string;
}
