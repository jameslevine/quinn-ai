# Quinn - System Architecture Overview

## Introduction

Quinn is an AI-powered personal assistant that executes tasks on behalf of users with human oversight and approval. This document provides a comprehensive overview of the system architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Web App    │  │ Mobile App  │  │  Voice/SMS  │  │  WhatsApp   │        │
│  │  (React)    │  │   (Expo)    │  │  (Twilio)   │  │  (Twilio)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CloudFront CDN                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway (REST)                              │   │
│  │                    + Cognito Authorizer                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Lambda (Express Monolith)                         │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │  Actions  │ │ Approvals │ │   Users   │ │Integrations│           │   │
│  │  │Controller │ │Controller │ │Controller │ │ Controller │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SERVICE LAYER                                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │ Approval │ │    AI    │ │  Action  │ │  Notif.  │ │  Audit   │ │   │
│  │  │  Engine  │ │  Brain   │ │ Executor │ │ Service  │ │ Service  │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      INTEGRATION LAYER                               │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│   │
│  │  │ Email  │ │ Voice  │ │Banking │ │  Food  │ │Calendar│ │ Travel ││   │
│  │  │Service │ │Service │ │Service │ │Service │ │Service │ │Service ││   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                       DynamoDB                               │   │   │
│  │  │  Users │ Actions │ Approvals │ Integrations │ Audit │ Config│   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │  │     S3      │  │   Secrets   │  │  Bedrock    │                │   │
│  │  │  (Storage)  │  │   Manager   │  │    (AI)     │                │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Client Layer

#### Web Application (React)

- **Technology**: React 18, TypeScript, Vite, MUI
- **Purpose**: Primary dashboard for managing actions, approvals, and settings
- **Hosting**: S3 + CloudFront with OAC

#### Mobile Application (Expo)

- **Technology**: Expo SDK, React Native, React Native Paper
- **Purpose**: On-the-go access, push notifications, quick approvals
- **Distribution**: App Store, Google Play

#### Voice/SMS Interface (Twilio)

- **Technology**: Twilio Voice, Twilio SMS
- **Purpose**: Phone-based interaction, quick approvals via text

### 2. API Layer

#### API Gateway

- **Type**: REST API
- **Authentication**: Cognito User Pool Authorizer
- **Features**: Rate limiting, request validation, CORS

#### Lambda (Express Monolith)

- **Runtime**: Node.js 20.x
- **Framework**: Express.js with TypeScript
- **Pattern**: Monolith Lambda for simplicity and cost efficiency

### 3. Service Layer

#### Approval Engine

The heart of Quinn - manages the approval workflow:

- Queues actions for user approval
- Handles approval modes (suggest, auto-review, full-auto)
- Manages timeouts and escalations
- Learns from user decisions

#### AI Brain

Orchestrates AI-powered decision making:

- Uses AWS Bedrock (Claude models)
- Context management for personalization
- Task planning and execution
- Learning from user feedback

#### Action Executor

Executes approved actions:

- Interfaces with integration services
- Handles retries and failures
- Reports execution status

#### Notification Service

Multi-channel notifications:

- Push notifications (mobile)
- Email notifications (SES)
- SMS notifications (Twilio)

#### Audit Service

Complete audit trail:

- Logs all actions and decisions
- Compliance and debugging
- Analytics and insights

### 4. Integration Layer

| Service  | Purpose          | Provider                |
| -------- | ---------------- | ----------------------- |
| Email    | Read/send emails | Gmail, Outlook          |
| Voice    | Phone calls      | Twilio                  |
| Banking  | Financial data   | TrueLayer, Plaid        |
| Spending | Payments         | Monzo, Revolut          |
| Food     | Ordering         | Deliveroo, Ocado        |
| Calendar | Scheduling       | Google, Outlook         |
| Travel   | Bookings         | Skyscanner, Booking.com |

### 5. Data Layer

#### DynamoDB Tables

- **Users**: User profiles and preferences
- **Actions**: All actions (pending, completed, failed)
- **Approvals**: Approval requests and responses
- **Integrations**: OAuth tokens and settings
- **Audit**: Complete audit trail
- **Config**: System configuration

#### S3 Buckets

- **Frontend**: Static web assets
- **Recordings**: Call recordings
- **Attachments**: Email attachments
- **Exports**: User data exports

#### Secrets Manager

- OAuth client secrets
- API keys
- Encryption keys

## Data Flow

### Action Lifecycle

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Trigger │────▶│   AI    │────▶│ Approval│────▶│ Execute │────▶│ Complete│
│         │     │  Brain  │     │  Queue  │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │               │
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            AUDIT LOG                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

1. **Trigger**: User request, scheduled task, or external event
2. **AI Brain**: Analyzes context, plans action, generates details
3. **Approval Queue**: Based on user preferences, may auto-approve or wait
4. **Execute**: Integration service performs the action
5. **Complete**: Status updated, user notified, audit logged

### Approval Modes

| Mode                 | Behavior                       | Use Case                  |
| -------------------- | ------------------------------ | ------------------------- |
| **Suggest Only**     | AI suggests, user must approve | High-risk actions         |
| **Auto with Review** | AI acts, user can undo         | Medium-risk actions       |
| **Full Auto**        | AI acts autonomously           | Low-risk, routine actions |

## Security Architecture

### Authentication

- **Cognito User Pools**: User authentication
- **JWT Tokens**: API authorization
- **MFA**: Optional two-factor authentication

### Authorization

- **IAM Roles**: Least privilege for Lambda
- **API Gateway**: Request validation
- **Row-level Security**: Users can only access their data

### Data Protection

- **Encryption at Rest**: DynamoDB, S3
- **Encryption in Transit**: TLS 1.3
- **Secrets Management**: AWS Secrets Manager

### Compliance

- **GDPR**: Data residency in EU (eu-west-2)
- **Data Portability**: Export user data
- **Right to Deletion**: Complete data removal

## Scalability

### Horizontal Scaling

- Lambda auto-scales with demand
- DynamoDB on-demand capacity
- CloudFront global distribution

### Performance Targets

- API response time: < 200ms (p95)
- Action execution: < 5s (simple), < 30s (complex)
- Notification delivery: < 1s

## Monitoring & Observability

### CloudWatch

- Lambda metrics and logs
- API Gateway metrics
- Custom dashboards

### Alerts

- Error rate thresholds
- Latency thresholds
- Cost anomalies

### Tracing

- X-Ray for distributed tracing
- Request correlation IDs

## Cost Optimization

### AWS Free Tier Usage

- Lambda: 1M requests/month
- DynamoDB: 25GB storage
- S3: 5GB storage
- CloudFront: 1TB transfer

### Pay-per-Use

- Bedrock: Token-based pricing
- Twilio: Per-call/SMS pricing
- SES: Per-email pricing

## Disaster Recovery

### Backup Strategy

- DynamoDB point-in-time recovery
- S3 versioning
- Cross-region replication (future)

### Recovery Targets

- RPO: 1 hour
- RTO: 4 hours

## Future Considerations

### Multi-Region

- Active-passive setup
- Data replication
- Regional failover

### Microservices

- Split monolith if needed
- Event-driven architecture
- Service mesh

### AI Enhancements

- Fine-tuned models
- Multi-modal capabilities
- Real-time learning
