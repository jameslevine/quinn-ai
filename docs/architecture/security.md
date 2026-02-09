# Quinn - Security Architecture

## Overview

Security is paramount for Quinn as it handles sensitive user data, financial information, and performs actions on behalf of users. This document outlines the security architecture, controls, and best practices.

## Security Principles

1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Minimal permissions required for each component
3. **Zero Trust** - Verify every request, trust nothing by default
4. **Data Minimization** - Collect and store only necessary data
5. **Transparency** - Users can see all actions and data

---

## Authentication

### AWS Cognito

Quinn uses AWS Cognito for user authentication:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Cognito   │────▶│  API GW     │
│  (App/Web)  │     │  User Pool  │     │  Authorizer │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │    JWT      │            │
       │            │   Token     │            │
       │            └─────────────┘            │
       │                   │                   │
       └───────────────────┴───────────────────┘
```

### Authentication Flow

1. **Sign Up**
   - Email verification required
   - Password requirements: 12+ chars, mixed case, numbers, symbols
   - Optional phone verification

2. **Sign In**
   - Email/password authentication
   - Optional MFA (TOTP or SMS)
   - Session tokens with configurable expiry

3. **Token Management**
   - Access token: 1 hour expiry
   - Refresh token: 30 days expiry
   - ID token: Contains user claims

### Multi-Factor Authentication (MFA)

```typescript
interface MFAConfig {
  enabled: boolean;
  methods: ("totp" | "sms")[];
  preferredMethod: "totp" | "sms";
  backupCodes: string[]; // encrypted
}
```

- TOTP (Time-based One-Time Password) - Recommended
- SMS - Fallback option
- Backup codes for recovery

---

## Authorization

### API Gateway Authorization

```yaml
# API Gateway Authorizer Configuration
Type: COGNITO_USER_POOLS
IdentitySource: method.request.header.Authorization
AuthorizationScopes:
  - email
  - openid
  - profile
```

### Role-Based Access Control (RBAC)

| Role    | Permissions                             |
| ------- | --------------------------------------- |
| User    | Access own data, manage own actions     |
| Admin   | User permissions + system configuration |
| Support | Read-only access for troubleshooting    |

### Resource-Level Authorization

All data access is scoped to the authenticated user:

```typescript
// Every query includes user ID from JWT
const getUserActions = async (userId: string) => {
  return dynamodb.query({
    TableName: "quinn-main",
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
    },
  });
};
```

---

## Data Protection

### Encryption at Rest

| Service         | Encryption             |
| --------------- | ---------------------- |
| DynamoDB        | AWS managed keys (SSE) |
| S3              | SSE-S3 or SSE-KMS      |
| Secrets Manager | AWS KMS                |
| CloudWatch Logs | AWS KMS                |

### Encryption in Transit

- TLS 1.3 for all API communications
- Certificate pinning for mobile apps (optional)
- HTTPS-only endpoints

### Application-Level Encryption

Sensitive fields are encrypted at the application level:

```typescript
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";

const kms = new KMSClient({ region: "eu-west-2" });

export const encryptField = async (plaintext: string): Promise<EncryptedField> => {
  const command = new EncryptCommand({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: Buffer.from(plaintext),
  });
  const response = await kms.send(command);
  return {
    encrypted: true,
    keyId: process.env.KMS_KEY_ID!,
    ciphertext: Buffer.from(response.CiphertextBlob!).toString("base64"),
  };
};

export const decryptField = async (field: EncryptedField): Promise<string> => {
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(field.ciphertext, "base64"),
  });
  const response = await kms.send(command);
  return Buffer.from(response.Plaintext!).toString("utf-8");
};
```

### Encrypted Fields

| Entity      | Field        | Reason            |
| ----------- | ------------ | ----------------- |
| Integration | accessToken  | OAuth credentials |
| Integration | refreshToken | OAuth credentials |
| User        | phone        | PII               |

---

## Secrets Management

### AWS Secrets Manager

All secrets are stored in AWS Secrets Manager:

```typescript
interface SecretsConfig {
  // OAuth Client Secrets
  "quinn/oauth/gmail": {
    clientId: string;
    clientSecret: string;
  };
  "quinn/oauth/outlook": {
    clientId: string;
    clientSecret: string;
  };
  // API Keys
  "quinn/api/twilio": {
    accountSid: string;
    authToken: string;
  };
  // Encryption Keys
  "quinn/encryption/kms-key-id": string;
}
```

### Secret Rotation

- OAuth secrets: Manual rotation with notification
- API keys: Automatic rotation where supported
- Encryption keys: Annual rotation with re-encryption

---

## Network Security

### VPC Configuration (Future)

For enhanced security, Lambda can be deployed in a VPC:

```
┌─────────────────────────────────────────────────────────────┐
│                          VPC                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Private Subnet                      │   │
│  │  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │   Lambda    │  │  DynamoDB   │                   │   │
│  │  │             │  │  Endpoint   │                   │   │
│  │  └─────────────┘  └─────────────┘                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  NAT Gateway                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### API Gateway Security

- WAF (Web Application Firewall) integration
- Rate limiting per user/IP
- Request validation
- CORS configuration

```yaml
# WAF Rules
Rules:
  - Name: RateLimitRule
    Priority: 1
    Action: Block
    Statement:
      RateBasedStatement:
        Limit: 1000
        AggregateKeyType: IP
  - Name: SQLInjectionRule
    Priority: 2
    Action: Block
    Statement:
      SqliMatchStatement:
        FieldToMatch:
          Body: {}
```

---

## Input Validation

### Request Validation

All API inputs are validated using Joi:

```typescript
import Joi from "joi";

export const createActionSchema = Joi.object({
  actionType: Joi.string()
    .valid("email_draft", "email_send", "phone_call", "grocery_order", "food_delivery")
    .required(),
  title: Joi.string().max(200).required(),
  description: Joi.string().max(1000),
  payload: Joi.object().required(),
});

export const validateBody = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: error.details.map((d) => d.message),
        },
      });
    }
    next();
  };
};
```

### Output Sanitization

- Remove sensitive fields from responses
- Sanitize HTML/script content
- Limit response sizes

---

## Audit Logging

### Audit Events

All security-relevant events are logged:

```typescript
type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.failed_login"
  | "auth.mfa_enabled"
  | "auth.mfa_disabled"
  | "auth.password_changed"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "action.created"
  | "action.approved"
  | "action.rejected"
  | "action.executed"
  | "integration.connected"
  | "integration.disconnected"
  | "settings.updated"
  | "data.exported"
  | "data.deleted";
```

### Audit Log Structure

```typescript
interface AuditLog {
  auditId: string;
  userId: string;
  eventType: AuditEventType;
  timestamp: string;
  actor: {
    type: "user" | "system" | "ai";
    id: string;
    ipAddress?: string;
    userAgent?: string;
  };
  resource: {
    type: string;
    id: string;
  };
  action: string;
  outcome: "success" | "failure";
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata: Record<string, unknown>;
}
```

### Log Retention

- Audit logs: 90 days in DynamoDB
- CloudWatch logs: 30 days
- Long-term archive: S3 Glacier (1 year)

---

## Third-Party Integration Security

### OAuth Security

```typescript
interface OAuthSecurityConfig {
  // State parameter for CSRF protection
  stateValidation: true;
  // PKCE for mobile apps
  pkceEnabled: true;
  // Scope minimization
  requestedScopes: string[];
  // Token storage
  tokenEncryption: true;
}
```

### Token Handling

1. **Storage**: Encrypted in DynamoDB
2. **Refresh**: Automatic token refresh before expiry
3. **Revocation**: Immediate revocation on disconnect
4. **Scope**: Request minimum required scopes

### Webhook Verification

```typescript
// Twilio webhook signature verification
import { validateRequest } from "twilio";

export const verifyTwilioWebhook = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers["x-twilio-signature"] as string;
  const url = `${process.env.API_URL}${req.originalUrl}`;

  if (!validateRequest(process.env.TWILIO_AUTH_TOKEN!, signature, url, req.body)) {
    return res.status(403).json({ error: "Invalid signature" });
  }
  next();
};
```

---

## Financial Security

### Spending Controls

```typescript
interface SpendingControls {
  // Hard limits - cannot be exceeded
  hardLimits: {
    perTransaction: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  // Soft limits - require approval
  approvalThresholds: {
    requireApprovalAbove: number;
  };
  // Category limits
  categoryLimits: Record<string, number>;
  // Emergency stop
  pauseAllSpending: boolean;
}
```

### Transaction Verification

1. **Pre-authorization**: Check limits before action
2. **Double-entry**: Log both debit and credit
3. **Reconciliation**: Daily balance verification
4. **Alerts**: Real-time spending notifications

### Read-Only Banking Access

- Main bank accounts: Read-only via Open Banking
- Spending account: Write access only to dedicated account
- No direct access to user's primary funds

---

## Compliance

### GDPR Compliance

| Requirement            | Implementation                        |
| ---------------------- | ------------------------------------- |
| Right to Access        | Data export API                       |
| Right to Rectification | Profile update API                    |
| Right to Erasure       | Account deletion with data purge      |
| Data Portability       | JSON export of all user data          |
| Consent                | Explicit consent for each integration |
| Data Minimization      | Only collect necessary data           |

### Data Residency

- Primary region: eu-west-2 (London)
- All user data stored in EU
- No cross-region data transfer without consent

### Data Export

```typescript
interface DataExport {
  user: UserProfile;
  preferences: UserPreferences;
  actions: Action[];
  approvals: Approval[];
  integrations: Integration[]; // tokens redacted
  auditLogs: AuditLog[];
  exportedAt: string;
  format: "json";
}
```

### Account Deletion

```typescript
const deleteUserAccount = async (userId: string): Promise<void> => {
  // 1. Revoke all integration tokens
  await revokeAllIntegrations(userId);

  // 2. Cancel pending actions
  await cancelPendingActions(userId);

  // 3. Delete all user data
  await deleteUserData(userId);

  // 4. Log deletion event
  await logAuditEvent({
    eventType: "user.deleted",
    userId,
    actor: { type: "user", id: userId },
  });

  // 5. Delete Cognito user
  await deleteCognitoUser(userId);
};
```

---

## Incident Response

### Security Incident Classification

| Severity | Description                    | Response Time |
| -------- | ------------------------------ | ------------- |
| Critical | Data breach, system compromise | Immediate     |
| High     | Unauthorized access attempt    | 1 hour        |
| Medium   | Suspicious activity            | 4 hours       |
| Low      | Policy violation               | 24 hours      |

### Incident Response Process

1. **Detection**: Automated alerts + manual reports
2. **Containment**: Isolate affected systems
3. **Investigation**: Root cause analysis
4. **Remediation**: Fix vulnerability
5. **Recovery**: Restore normal operations
6. **Post-mortem**: Document lessons learned

### Security Contacts

- Security issues: security@quinn.ai
- Bug bounty: bugbounty@quinn.ai
- Compliance: compliance@quinn.ai

---

## Security Checklist

### Development

- [ ] Input validation on all endpoints
- [ ] Output sanitization
- [ ] Parameterized queries (N/A for DynamoDB)
- [ ] Secure dependencies (npm audit)
- [ ] No secrets in code
- [ ] Security headers configured

### Deployment

- [ ] HTTPS only
- [ ] WAF enabled
- [ ] Rate limiting configured
- [ ] Logging enabled
- [ ] Monitoring alerts set up
- [ ] Backup verification

### Operations

- [ ] Regular security audits
- [ ] Penetration testing (annual)
- [ ] Dependency updates
- [ ] Access review (quarterly)
- [ ] Incident response drills

---

## Security Roadmap

### Phase 1 (MVP)

- [x] Cognito authentication
- [x] JWT authorization
- [x] Input validation
- [x] Audit logging
- [x] Encryption at rest

### Phase 2

- [ ] MFA enforcement option
- [ ] WAF integration
- [ ] Enhanced monitoring
- [ ] Security headers

### Phase 3

- [ ] VPC deployment
- [ ] SOC 2 certification
- [ ] Penetration testing
- [ ] Bug bounty program
