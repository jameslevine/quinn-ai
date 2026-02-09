# Quinn - Data Model

## Overview

Quinn uses DynamoDB as its primary database, following a single-table design pattern for efficient querying and cost optimization. This document describes the data model, access patterns, and table design.

## DynamoDB Table Design

### Primary Table: `quinn-main`

| Attribute   | Type   | Description            |
| ----------- | ------ | ---------------------- |
| `pk`        | String | Partition Key          |
| `sk`        | String | Sort Key               |
| `gsi1pk`    | String | GSI1 Partition Key     |
| `gsi1sk`    | String | GSI1 Sort Key          |
| `gsi2pk`    | String | GSI2 Partition Key     |
| `gsi2sk`    | String | GSI2 Sort Key          |
| `type`      | String | Entity type            |
| `data`      | Map    | Entity-specific data   |
| `createdAt` | String | ISO timestamp          |
| `updatedAt` | String | ISO timestamp          |
| `ttl`       | Number | TTL for expiring items |

### Global Secondary Indexes

| Index | Partition Key | Sort Key | Purpose                 |
| ----- | ------------- | -------- | ----------------------- |
| GSI1  | `gsi1pk`      | `gsi1sk` | Query by status, type   |
| GSI2  | `gsi2pk`      | `gsi2sk` | Query by date, category |

---

## Entity Definitions

### User Entity

```typescript
interface User {
  pk: `USER#${userId}`;
  sk: "PROFILE";
  gsi1pk: `EMAIL#${email}`;
  gsi1sk: `USER#${userId}`;
  type: "USER";
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    timezone: string;
    locale: string;
    status: "active" | "inactive" | "suspended";
    tier: "starter" | "pro" | "premium" | "family";
    onboardingCompleted: boolean;
    createdAt: string;
    lastLoginAt: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Access Patterns:**

- Get user by ID: `pk = USER#<userId>, sk = PROFILE`
- Get user by email: `GSI1: gsi1pk = EMAIL#<email>`

---

### User Preferences Entity

```typescript
interface UserPreferences {
  pk: `USER#${userId}`;
  sk: "PREFERENCES";
  type: "USER_PREFERENCES";
  data: {
    approvalModes: {
      email_draft: ApprovalMode;
      email_send: ApprovalMode;
      phone_call: ApprovalMode;
      grocery_order: ApprovalMode;
      food_delivery: ApprovalMode;
      bill_payment: ApprovalMode;
      appointment_booking: ApprovalMode;
      travel_booking: ApprovalMode;
      gift_ordering: ApprovalMode;
    };
    notificationChannels: ("push" | "email" | "sms")[];
    notificationPreferences: {
      dailyBriefing: boolean;
      dailyBriefingTime: string; // HH:mm
      urgentApprovals: boolean;
      weeklyReport: boolean;
    };
    autoApproveTimeout: number; // hours
    spendingLimits: {
      perTransaction: number;
      daily: number;
      weekly: number;
      monthly: number;
    };
    aiPreferences: {
      preferredModel: string;
      responseStyle: "formal" | "casual" | "friendly";
      voiceId: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

type ApprovalMode = "suggest_only" | "auto_with_review" | "full_auto";
```

**Access Patterns:**

- Get preferences: `pk = USER#<userId>, sk = PREFERENCES`

---

### Action Entity

```typescript
interface Action {
  pk: `USER#${userId}`;
  sk: `ACTION#${actionId}`;
  gsi1pk: `STATUS#${status}`;
  gsi1sk: `${createdAt}#${actionId}`;
  gsi2pk: `USER#${userId}#TYPE#${actionType}`;
  gsi2sk: `${createdAt}#${actionId}`;
  type: "ACTION";
  data: {
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
  };
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

type ActionType =
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

type ActionStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "scheduled"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled";

interface ActionPayload {
  [key: string]: unknown;
}

interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}
```

**Access Patterns:**

- Get action by ID: `pk = USER#<userId>, sk = ACTION#<actionId>`
- List user actions: `pk = USER#<userId>, sk begins_with ACTION#`
- List pending actions: `GSI1: gsi1pk = STATUS#pending_approval`
- List actions by type: `GSI2: gsi2pk = USER#<userId>#TYPE#<type>`

---

### Approval Entity

```typescript
interface Approval {
  pk: `USER#${userId}`;
  sk: `APPROVAL#${approvalId}`;
  gsi1pk: `APPROVAL_STATUS#${status}`;
  gsi1sk: `${expiresAt}#${approvalId}`;
  type: "APPROVAL";
  data: {
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
  };
  createdAt: string;
  updatedAt: string;
  ttl: number;
}

type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "auto_approved";

interface ApprovalDetails {
  summary: string;
  changes?: string[];
  cost?: {
    amount: number;
    currency: string;
  };
  risks?: string[];
  alternatives?: string[];
}

interface ApprovalResponse {
  decision: "approve" | "reject" | "edit";
  editedPayload?: ActionPayload;
  reason?: string;
  respondedVia: "app" | "email" | "sms" | "voice";
}

interface NotificationRecord {
  channel: "push" | "email" | "sms";
  sentAt: string;
  status: "sent" | "delivered" | "failed";
}
```

**Access Patterns:**

- Get approval by ID: `pk = USER#<userId>, sk = APPROVAL#<approvalId>`
- List user approvals: `pk = USER#<userId>, sk begins_with APPROVAL#`
- List pending approvals: `GSI1: gsi1pk = APPROVAL_STATUS#pending`
- List expiring approvals: `GSI1: gsi1pk = APPROVAL_STATUS#pending, gsi1sk < <now>`

---

### Integration Entity

```typescript
interface Integration {
  pk: `USER#${userId}`;
  sk: `INTEGRATION#${provider}`;
  gsi1pk: `PROVIDER#${provider}`;
  gsi1sk: `USER#${userId}`;
  type: "INTEGRATION";
  data: {
    userId: string;
    provider: IntegrationProvider;
    status: "connected" | "disconnected" | "expired" | "error";
    credentials: {
      accessToken: string; // encrypted
      refreshToken?: string; // encrypted
      expiresAt: string;
      scope: string[];
    };
    settings: Record<string, unknown>;
    lastSyncAt?: string;
    syncStatus?: "syncing" | "synced" | "error";
    errorMessage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

type IntegrationProvider =
  | "gmail"
  | "outlook"
  | "google_calendar"
  | "outlook_calendar"
  | "twilio"
  | "truelayer"
  | "plaid"
  | "monzo"
  | "revolut"
  | "deliveroo"
  | "uber_eats"
  | "just_eat"
  | "ocado"
  | "tesco"
  | "amazon_fresh";
```

**Access Patterns:**

- Get integration: `pk = USER#<userId>, sk = INTEGRATION#<provider>`
- List user integrations: `pk = USER#<userId>, sk begins_with INTEGRATION#`
- List users by provider: `GSI1: gsi1pk = PROVIDER#<provider>`

---

### Audit Entity

```typescript
interface AuditLog {
  pk: `USER#${userId}`;
  sk: `AUDIT#${timestamp}#${auditId}`;
  gsi1pk: `AUDIT_TYPE#${eventType}`;
  gsi1sk: `${timestamp}#${auditId}`;
  type: "AUDIT";
  data: {
    auditId: string;
    userId: string;
    eventType: AuditEventType;
    entityType: string;
    entityId: string;
    action: string;
    actor: {
      type: "user" | "system" | "ai";
      id: string;
    };
    changes?: {
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    };
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      requestId: string;
    };
  };
  createdAt: string;
  ttl: number; // 90 days retention
}

type AuditEventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "action.created"
  | "action.approved"
  | "action.rejected"
  | "action.executed"
  | "action.failed"
  | "integration.connected"
  | "integration.disconnected"
  | "approval.requested"
  | "approval.responded"
  | "settings.updated";
```

**Access Patterns:**

- List user audit logs: `pk = USER#<userId>, sk begins_with AUDIT#`
- List audit by type: `GSI1: gsi1pk = AUDIT_TYPE#<type>`

---

### Email Entity (Cached)

```typescript
interface CachedEmail {
  pk: `USER#${userId}`;
  sk: `EMAIL#${provider}#${emailId}`;
  gsi1pk: `USER#${userId}#EMAIL_CATEGORY#${category}`;
  gsi1sk: `${receivedAt}#${emailId}`;
  type: "EMAIL";
  data: {
    emailId: string;
    provider: "gmail" | "outlook";
    externalId: string;
    threadId: string;
    from: EmailAddress;
    to: EmailAddress[];
    cc?: EmailAddress[];
    subject: string;
    snippet: string;
    bodyPreview: string;
    category: EmailCategory;
    labels: string[];
    isRead: boolean;
    isStarred: boolean;
    hasAttachments: boolean;
    receivedAt: string;
    aiAnalysis?: {
      sentiment: "positive" | "neutral" | "negative";
      priority: "high" | "medium" | "low";
      suggestedAction?: string;
      suggestedReply?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  ttl: number; // 7 days cache
}

interface EmailAddress {
  email: string;
  name?: string;
}

type EmailCategory =
  | "primary"
  | "social"
  | "promotions"
  | "updates"
  | "forums"
  | "spam"
  | "important"
  | "action_required";
```

**Access Patterns:**

- Get email: `pk = USER#<userId>, sk = EMAIL#<provider>#<emailId>`
- List emails by category: `GSI1: gsi1pk = USER#<userId>#EMAIL_CATEGORY#<category>`

---

### Conversation Entity (AI Context)

```typescript
interface Conversation {
  pk: `USER#${userId}`;
  sk: `CONVERSATION#${conversationId}`;
  type: "CONVERSATION";
  data: {
    conversationId: string;
    userId: string;
    channel: "app" | "voice" | "sms" | "whatsapp";
    status: "active" | "completed" | "abandoned";
    messages: ConversationMessage[];
    context: {
      intent?: string;
      entities?: Record<string, unknown>;
      relatedActions?: string[];
    };
    startedAt: string;
    lastMessageAt: string;
    completedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
  ttl: number; // 24 hours for active, 7 days for completed
}

interface ConversationMessage {
  messageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

**Access Patterns:**

- Get conversation: `pk = USER#<userId>, sk = CONVERSATION#<conversationId>`
- List user conversations: `pk = USER#<userId>, sk begins_with CONVERSATION#`

---

## Data Access Patterns Summary

| Pattern                 | Key Condition                                 | Index |
| ----------------------- | --------------------------------------------- | ----- |
| Get user by ID          | `pk = USER#<id>, sk = PROFILE`                | Main  |
| Get user by email       | `gsi1pk = EMAIL#<email>`                      | GSI1  |
| Get user preferences    | `pk = USER#<id>, sk = PREFERENCES`            | Main  |
| List user actions       | `pk = USER#<id>, sk begins_with ACTION#`      | Main  |
| List pending actions    | `gsi1pk = STATUS#pending_approval`            | GSI1  |
| List actions by type    | `gsi2pk = USER#<id>#TYPE#<type>`              | GSI2  |
| Get approval            | `pk = USER#<id>, sk = APPROVAL#<id>`          | Main  |
| List pending approvals  | `gsi1pk = APPROVAL_STATUS#pending`            | GSI1  |
| Get integration         | `pk = USER#<id>, sk = INTEGRATION#<provider>` | Main  |
| List user integrations  | `pk = USER#<id>, sk begins_with INTEGRATION#` | Main  |
| List audit logs         | `pk = USER#<id>, sk begins_with AUDIT#`       | Main  |
| List emails by category | `gsi1pk = USER#<id>#EMAIL_CATEGORY#<cat>`     | GSI1  |

---

## Data Encryption

### Sensitive Fields

The following fields are encrypted at the application level using AWS KMS:

- `Integration.credentials.accessToken`
- `Integration.credentials.refreshToken`
- `User.data.phone` (if stored)

### Encryption Strategy

```typescript
interface EncryptedField {
  encrypted: true;
  keyId: string; // KMS key ID
  ciphertext: string; // Base64 encoded
}
```

---

## TTL Strategy

| Entity       | TTL                      | Reason                        |
| ------------ | ------------------------ | ----------------------------- |
| Approval     | 72 hours                 | Auto-expire pending approvals |
| Audit        | 90 days                  | Compliance retention          |
| CachedEmail  | 7 days                   | Reduce storage costs          |
| Conversation | 24h active, 7d completed | Context management            |

---

## Capacity Planning

### Estimated Item Sizes

| Entity          | Avg Size | Max Size |
| --------------- | -------- | -------- |
| User            | 1 KB     | 2 KB     |
| UserPreferences | 2 KB     | 5 KB     |
| Action          | 2 KB     | 10 KB    |
| Approval        | 3 KB     | 10 KB    |
| Integration     | 1 KB     | 3 KB     |
| AuditLog        | 1 KB     | 5 KB     |
| CachedEmail     | 2 KB     | 10 KB    |
| Conversation    | 5 KB     | 50 KB    |

### Capacity Mode

- **Development**: On-demand (pay per request)
- **Production**: On-demand with auto-scaling

---

## Backup & Recovery

### Point-in-Time Recovery (PITR)

- Enabled for production
- 35-day recovery window
- Continuous backups

### On-Demand Backups

- Weekly full backups
- Retained for 90 days
- Cross-region copy for DR

---

## Migration Strategy

### Schema Versioning

```typescript
interface EntityBase {
  schemaVersion: number;
  // ... other fields
}
```

### Migration Process

1. Add new fields with defaults
2. Backfill existing items
3. Update application code
4. Remove deprecated fields (if any)
