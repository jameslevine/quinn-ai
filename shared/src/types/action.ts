// Action Types

import { ApprovalMode } from "./user";

export interface Action {
  actionId: string;
  userId: string;
  actionType: ActionType;
  status: ActionStatus;
  title: string;
  description: string;
  payload: ActionPayload;
  result?: ActionResult;
  approvalMode: ApprovalMode;
  approvalId?: string;
  scheduledAt?: string;
  executedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type ActionType =
  | "email_draft"
  | "email_send"
  | "email_categorize"
  | "phone_call"
  | "grocery_order"
  | "food_delivery"
  | "bill_payment"
  | "appointment_booking"
  | "travel_booking"
  | "gift_ordering"
  | "calendar_event"
  | "reminder";

export type ActionStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "scheduled"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled";

export interface ActionPayload {
  [key: string]: unknown;
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface CreateActionInput {
  actionType: ActionType;
  title: string;
  description?: string;
  payload: ActionPayload;
  scheduledAt?: string;
}
