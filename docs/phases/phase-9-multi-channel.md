# Phase 9: Multi-Channel Communication 📱

## Overview

Phase 9 enables users to interact with Quinn through multiple channels beyond the web app: SMS, WhatsApp, voice assistants, and a dedicated phone number to call Quinn directly.

**Status:** 📋 Planned  
**Estimated Duration:** 4-6 weeks

---

## Goals

1. Add SMS/text message interaction
2. Integrate WhatsApp Business API
3. Enable voice assistant integration (Alexa, Google Assistant)
4. Create dedicated phone number for calling Quinn
5. Implement push notifications
6. Build notification preferences system

---

## Features

### 9.1 SMS Integration

**Objective:** Users can text Quinn to make requests and receive updates

**Backend Components:**

```typescript
// backend/src/lib/sms.ts
interface SMSService {
  // Send SMS
  sendSMS(to: string, message: string): Promise<void>;

  // Handle incoming SMS
  handleIncoming(from: string, message: string): Promise<string>;

  // Send approval request
  sendApprovalRequest(to: string, action: Action): Promise<void>;

  // Process approval response
  processApprovalResponse(from: string, response: string): Promise<void>;
}
```

**Use Cases:**

- Quick requests: "Order my usual from Deliveroo"
- Approvals: Reply Y/N to approve actions
- Status updates: "Your order is on the way"
- Reminders: "Appointment tomorrow at 2pm"

**Tasks:**

- [ ] Set up Twilio SMS
- [ ] Create SMS webhook handler
- [ ] Implement message parsing
- [ ] Build approval via SMS
- [ ] Add conversation context
- [ ] Implement rate limiting

### 9.2 WhatsApp Integration

**Objective:** Users can chat with Quinn via WhatsApp

**Backend Components:**

```typescript
// backend/src/lib/whatsapp.ts
interface WhatsAppService {
  // Send message
  sendMessage(to: string, message: WhatsAppMessage): Promise<void>;

  // Send template message
  sendTemplate(to: string, template: string, params: Record<string, string>): Promise<void>;

  // Handle incoming message
  handleIncoming(message: IncomingMessage): Promise<void>;

  // Send rich media
  sendMedia(to: string, media: MediaMessage): Promise<void>;
}

interface WhatsAppMessage {
  type: "text" | "image" | "document" | "template" | "interactive";
  content: string | MediaContent | InteractiveContent;
}
```

**Features:**

- Rich messages with buttons
- Image/document sharing
- Quick reply buttons
- List messages for selections
- Location sharing

**Tasks:**

- [ ] Apply for WhatsApp Business API
- [ ] Set up Meta Business account
- [ ] Create message templates
- [ ] Implement webhook handler
- [ ] Build interactive messages
- [ ] Add media support

### 9.3 Voice Assistant Integration

**Objective:** Users can interact with Quinn via Alexa and Google Assistant

#### Alexa Skill

```typescript
// backend/src/lib/alexa.ts
interface AlexaSkill {
  // Handle intent
  handleIntent(intent: AlexaIntent): Promise<AlexaResponse>;

  // Account linking
  linkAccount(userId: string, alexaUserId: string): Promise<void>;
}

// Supported intents
type AlexaIntent =
  | "CheckApprovals"
  | "ApproveAction"
  | "RejectAction"
  | "GetStatus"
  | "MakeRequest";
```

#### Google Assistant Action

```typescript
// backend/src/lib/google-assistant.ts
interface GoogleAction {
  // Handle request
  handleRequest(request: GoogleRequest): Promise<GoogleResponse>;

  // Account linking
  linkAccount(userId: string, googleUserId: string): Promise<void>;
}
```

**Sample Interactions:**

- "Alexa, ask Quinn what's pending"
- "Hey Google, tell Quinn to order groceries"
- "Alexa, ask Quinn to approve the email"

**Tasks:**

- [ ] Create Alexa skill
- [ ] Implement account linking
- [ ] Build intent handlers
- [ ] Create Google Action
- [ ] Implement conversational flow
- [ ] Add multi-turn dialogs

### 9.4 Inbound Phone Calls

**Objective:** Users can call a dedicated number to talk to Quinn

**Backend Components:**

```typescript
// backend/src/lib/inbound-calls.ts
interface InboundCallService {
  // Handle incoming call
  handleIncoming(callSid: string, from: string): Promise<TwiML>;

  // Authenticate caller
  authenticateCaller(from: string): Promise<User | null>;

  // Process voice command
  processVoiceCommand(audio: AudioBuffer): Promise<Command>;

  // Generate response
  generateResponse(command: Command): Promise<AudioResponse>;
}
```

**Features:**

- Caller ID authentication
- Voice PIN for security
- Natural conversation
- Action approvals via voice
- Status updates

**Tasks:**

- [ ] Purchase dedicated phone number
- [ ] Implement caller authentication
- [ ] Build voice menu system
- [ ] Add speech recognition
- [ ] Implement voice responses
- [ ] Create call routing logic

### 9.5 Push Notifications

**Objective:** Send real-time notifications to users' devices

**Backend Components:**

```typescript
// backend/src/lib/notifications.ts
interface NotificationService {
  // Send push notification
  sendPush(userId: string, notification: PushNotification): Promise<void>;

  // Register device
  registerDevice(userId: string, token: string, platform: Platform): Promise<void>;

  // Unregister device
  unregisterDevice(userId: string, token: string): Promise<void>;

  // Send to all user devices
  sendToUser(userId: string, notification: PushNotification): Promise<void>;
}

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  actionButtons?: ActionButton[];
  priority: "high" | "normal" | "low";
}
```

**Notification Types:**

- Approval requests
- Action completions
- Reminders
- Alerts (budget, appointments)
- Daily briefings

**Tasks:**

- [ ] Set up Firebase Cloud Messaging
- [ ] Implement APNs for iOS
- [ ] Create notification service
- [ ] Build device registration
- [ ] Add notification preferences
- [ ] Implement notification grouping

### 9.6 Notification Preferences

**Objective:** Users control how and when they receive notifications

**Data Model:**

```typescript
interface NotificationPreferences {
  pk: string; // USER#<userId>
  sk: string; // PREFERENCES#NOTIFICATIONS
  userId: string;

  // Channel preferences
  channels: {
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };

  // Notification types
  types: {
    approvals: NotificationChannel[];
    completions: NotificationChannel[];
    reminders: NotificationChannel[];
    alerts: NotificationChannel[];
    dailyBriefing: NotificationChannel[];
  };

  // Quiet hours
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string;
  };

  // Frequency limits
  limits: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

type NotificationChannel = "push" | "sms" | "whatsapp" | "email";
```

**Tasks:**

- [ ] Create preferences UI
- [ ] Implement quiet hours
- [ ] Add frequency limiting
- [ ] Build channel routing
- [ ] Create preference sync

---

## API Endpoints

### SMS

```
POST   /webhooks/sms/incoming     # Twilio SMS webhook
POST   /webhooks/sms/status       # Delivery status
```

### WhatsApp

```
POST   /webhooks/whatsapp         # WhatsApp webhook
GET    /webhooks/whatsapp         # Webhook verification
```

### Voice Assistants

```
POST   /alexa                     # Alexa skill endpoint
POST   /google-assistant          # Google Action endpoint
```

### Notifications

```
POST   /notifications/register    # Register device
DELETE /notifications/unregister  # Unregister device
GET    /notifications/preferences # Get preferences
PUT    /notifications/preferences # Update preferences
POST   /notifications/test        # Send test notification
```

---

## Channel Comparison

| Feature    | SMS       | WhatsApp   | Alexa  | Google | Push    |
| ---------- | --------- | ---------- | ------ | ------ | ------- |
| Rich media | ❌        | ✅         | ❌     | ❌     | Limited |
| Buttons    | ❌        | ✅         | ❌     | ❌     | ✅      |
| Voice      | ❌        | ❌         | ✅     | ✅     | ❌      |
| Cost       | Per msg   | Free\*     | Free   | Free   | Free    |
| Reach      | Universal | App needed | Device | Device | App     |
| Real-time  | ✅        | ✅         | ✅     | ✅     | ✅      |

\*WhatsApp Business API has costs for template messages

---

## Technical Considerations

### Message Routing

```typescript
// Determine best channel for notification
function selectChannel(user: User, notification: Notification): NotificationChannel {
  const prefs = user.notificationPreferences;
  const type = notification.type;

  // Check quiet hours
  if (isQuietHours(prefs)) {
    return "email"; // Non-intrusive
  }

  // Check user preferences for this type
  const preferredChannels = prefs.types[type];

  // Return first available channel
  for (const channel of preferredChannels) {
    if (isChannelAvailable(user, channel)) {
      return channel;
    }
  }

  return "email"; // Fallback
}
```

### Security

- Verify webhook signatures
- Authenticate callers by phone number
- Implement voice PIN
- Rate limit per channel
- Encrypt sensitive data

### Reliability

- Queue messages for retry
- Handle delivery failures
- Implement fallback channels
- Monitor delivery rates

---

## Success Criteria

- [ ] SMS commands working
- [ ] WhatsApp integration live
- [ ] Alexa skill published
- [ ] Google Action published
- [ ] Push notifications working
- [ ] Notification preferences functional
- [ ] 95%+ delivery rate
- [ ] < 5 second response time

---

## Dependencies

- Twilio account (SMS)
- Meta Business account (WhatsApp)
- Amazon Developer account (Alexa)
- Google Cloud account (Assistant)
- Firebase project (Push)
- Apple Developer account (APNs)

---

## Risks & Mitigations

| Risk                          | Mitigation                          |
| ----------------------------- | ----------------------------------- |
| WhatsApp approval delays      | Start application early             |
| Voice assistant certification | Follow guidelines strictly          |
| Message delivery failures     | Implement fallback channels         |
| Cost overruns (SMS)           | Usage limits, prefer free channels  |
| Security vulnerabilities      | Webhook verification, rate limiting |
