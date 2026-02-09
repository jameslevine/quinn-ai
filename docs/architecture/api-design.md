# Quinn - API Design

## Overview

Quinn's API follows RESTful principles with JSON payloads. All endpoints are authenticated via AWS Cognito JWT tokens.

## Base URL

```
Development: https://api.dev.quinn.ai/v1
Production:  https://api.quinn.ai/v1
```

## Authentication

All API requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained through AWS Cognito authentication flow.

## Common Headers

```
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-Request-ID: <uuid>  (optional, for tracing)
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-02-09T12:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-02-09T12:00:00Z"
  }
}
```

### Pagination

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100,
    "hasMore": true,
    "nextCursor": "eyJsYXN0S2V5IjoiLi4uIn0="
  }
}
```

---

## API Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-09T12:00:00Z"
}
```

---

## Users API

### GET /users/me

Get current user profile.

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+44...",
    "timezone": "Europe/London",
    "locale": "en-GB",
    "status": "active",
    "tier": "pro",
    "onboardingCompleted": true,
    "createdAt": "2026-01-01T00:00:00Z",
    "lastLoginAt": "2026-02-09T12:00:00Z"
  }
}
```

### PATCH /users/me

Update current user profile.

**Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+44...",
  "timezone": "Europe/London",
  "locale": "en-GB"
}
```

### GET /users/me/preferences

Get user preferences.

**Response:**

```json
{
  "success": true,
  "data": {
    "approvalModes": {
      "email_draft": "suggest_only",
      "email_send": "suggest_only",
      "phone_call": "suggest_only",
      "grocery_order": "auto_with_review",
      "food_delivery": "auto_with_review",
      "bill_payment": "auto_with_review"
    },
    "notificationChannels": ["push", "email"],
    "notificationPreferences": {
      "dailyBriefing": true,
      "dailyBriefingTime": "08:00",
      "urgentApprovals": true,
      "weeklyReport": true
    },
    "autoApproveTimeout": 24,
    "spendingLimits": {
      "perTransaction": 100,
      "daily": 200,
      "weekly": 500,
      "monthly": 1500
    },
    "aiPreferences": {
      "preferredModel": "claude-3-haiku",
      "responseStyle": "friendly",
      "voiceId": "neutral-1"
    }
  }
}
```

### PATCH /users/me/preferences

Update user preferences.

**Request:**

```json
{
  "approvalModes": {
    "email_draft": "auto_with_review"
  },
  "notificationChannels": ["push", "email", "sms"]
}
```

---

## Actions API

### GET /actions

List user actions with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| type | string | Filter by action type |
| from | string | Start date (ISO) |
| to | string | End date (ISO) |
| limit | number | Items per page (default: 20) |
| cursor | string | Pagination cursor |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "actionId": "action_123",
      "actionType": "email_send",
      "status": "pending_approval",
      "title": "Reply to John Smith",
      "description": "Draft reply to meeting follow-up email",
      "approvalMode": "suggest_only",
      "createdAt": "2026-02-09T12:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "..."
  }
}
```

### GET /actions/:actionId

Get action details.

**Response:**

```json
{
  "success": true,
  "data": {
    "actionId": "action_123",
    "actionType": "email_send",
    "status": "pending_approval",
    "title": "Reply to John Smith",
    "description": "Draft reply to meeting follow-up email",
    "payload": {
      "to": "john@example.com",
      "subject": "Re: Meeting Follow-up",
      "body": "Hi John,\n\nThank you for..."
    },
    "approvalMode": "suggest_only",
    "approvalId": "approval_456",
    "createdAt": "2026-02-09T12:00:00Z",
    "updatedAt": "2026-02-09T12:00:00Z"
  }
}
```

### POST /actions

Create a new action (typically triggered by AI or user request).

**Request:**

```json
{
  "actionType": "email_send",
  "title": "Reply to John Smith",
  "description": "Draft reply to meeting follow-up email",
  "payload": {
    "to": "john@example.com",
    "subject": "Re: Meeting Follow-up",
    "body": "Hi John,\n\nThank you for..."
  }
}
```

### DELETE /actions/:actionId

Cancel an action (only if pending or scheduled).

---

## Approvals API

### GET /approvals

List pending approvals.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (default: pending) |
| limit | number | Items per page |
| cursor | string | Pagination cursor |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "approvalId": "approval_456",
      "actionId": "action_123",
      "actionType": "email_send",
      "status": "pending",
      "title": "Reply to John Smith",
      "description": "Draft reply to meeting follow-up email",
      "details": {
        "summary": "Send email reply to John Smith regarding meeting follow-up",
        "changes": ["New email will be sent"],
        "cost": null
      },
      "requestedAt": "2026-02-09T12:00:00Z",
      "expiresAt": "2026-02-10T12:00:00Z"
    }
  ]
}
```

### GET /approvals/:approvalId

Get approval details.

### POST /approvals/:approvalId/respond

Respond to an approval request.

**Request:**

```json
{
  "decision": "approve",
  "reason": "Looks good"
}
```

Or with edits:

```json
{
  "decision": "edit",
  "editedPayload": {
    "to": "john@example.com",
    "subject": "Re: Meeting Follow-up",
    "body": "Hi John,\n\nThank you for... [edited content]"
  }
}
```

Or rejection:

```json
{
  "decision": "reject",
  "reason": "Not the right time"
}
```

---

## Integrations API

### GET /integrations

List user integrations.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "provider": "gmail",
      "status": "connected",
      "connectedAt": "2026-01-15T10:00:00Z",
      "lastSyncAt": "2026-02-09T11:55:00Z",
      "syncStatus": "synced"
    },
    {
      "provider": "outlook",
      "status": "disconnected",
      "connectedAt": null
    }
  ]
}
```

### GET /integrations/:provider

Get integration details.

### POST /integrations/:provider/connect

Initiate OAuth connection.

**Response:**

```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "random_state_token"
  }
}
```

### POST /integrations/:provider/callback

Handle OAuth callback.

**Request:**

```json
{
  "code": "oauth_authorization_code",
  "state": "random_state_token"
}
```

### DELETE /integrations/:provider

Disconnect integration.

### POST /integrations/:provider/sync

Trigger manual sync.

---

## Email API (Phase 1)

### GET /emails

List cached emails.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| provider | string | gmail, outlook |
| category | string | primary, social, etc. |
| isRead | boolean | Filter by read status |
| limit | number | Items per page |
| cursor | string | Pagination cursor |

### GET /emails/:emailId

Get email details.

### POST /emails/:emailId/draft-reply

Generate AI draft reply.

**Request:**

```json
{
  "instructions": "Be polite and confirm the meeting",
  "tone": "professional"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "draftId": "draft_789",
    "subject": "Re: Meeting Request",
    "body": "Dear John,\n\nThank you for reaching out...",
    "actionId": "action_123"
  }
}
```

### POST /emails/:emailId/categorize

Manually categorize an email.

**Request:**

```json
{
  "category": "important"
}
```

### POST /emails/sync

Trigger email sync.

---

## Conversations API

### GET /conversations

List conversations.

### GET /conversations/:conversationId

Get conversation details.

### POST /conversations

Start a new conversation.

**Request:**

```json
{
  "channel": "app",
  "message": "Book me a table for dinner tonight"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123",
    "response": "I'd be happy to help you book a table for dinner tonight. What type of cuisine are you in the mood for, and how many people will be dining?",
    "suggestedActions": [
      {
        "type": "quick_reply",
        "label": "Italian",
        "value": "italian"
      },
      {
        "type": "quick_reply",
        "label": "Japanese",
        "value": "japanese"
      }
    ]
  }
}
```

### POST /conversations/:conversationId/messages

Send a message in a conversation.

**Request:**

```json
{
  "message": "Italian, for 2 people"
}
```

---

## Webhooks API

### POST /webhooks/twilio/voice

Handle Twilio voice webhooks.

### POST /webhooks/twilio/sms

Handle Twilio SMS webhooks.

### POST /webhooks/email/:provider

Handle email provider webhooks (push notifications).

---

## Audit API

### GET /audit

List audit logs.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| eventType | string | Filter by event type |
| from | string | Start date |
| to | string | End date |
| limit | number | Items per page |
| cursor | string | Pagination cursor |

---

## Error Codes

| Code              | HTTP Status | Description              |
| ----------------- | ----------- | ------------------------ |
| UNAUTHORIZED      | 401         | Invalid or missing token |
| FORBIDDEN         | 403         | Insufficient permissions |
| NOT_FOUND         | 404         | Resource not found       |
| VALIDATION_ERROR  | 400         | Invalid request payload  |
| RATE_LIMITED      | 429         | Too many requests        |
| INTEGRATION_ERROR | 502         | External service error   |
| INTERNAL_ERROR    | 500         | Internal server error    |

---

## Rate Limits

| Tier    | Requests/minute | Requests/day |
| ------- | --------------- | ------------ |
| Starter | 60              | 10,000       |
| Pro     | 120             | 50,000       |
| Premium | 300             | 100,000      |

Rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707480000
```

---

## Versioning

API versioning is done via URL path:

- `/v1/` - Current stable version
- `/v2/` - Future version (when needed)

Deprecation notices will be communicated via:

- Response header: `X-API-Deprecation: true`
- Email notifications to developers
- Documentation updates

---

## SDK Support

Official SDKs will be provided for:

- JavaScript/TypeScript (npm)
- React Native (Expo)
- Python (pip) - future

---

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:

- Development: https://api.dev.quinn.ai/v1/openapi.json
- Production: https://api.quinn.ai/v1/openapi.json
