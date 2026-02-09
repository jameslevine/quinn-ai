# Phase 2: Communication (Weeks 9-14)

## Overview

Phase 2 adds phone call capability and advanced email automation, enabling Quinn to make calls on behalf of users and automate email workflows.

## Goals

1. Integrate Twilio for voice calls
2. Implement voice synthesis with Amazon Polly
3. Build call scripting and execution engine
4. Add advanced email automation rules
5. Enable SMS-based interaction

---

## Week 9-10: Voice Infrastructure

### Objectives

- Set up Twilio account and phone numbers
- Integrate Amazon Polly for voice synthesis
- Implement speech-to-text with Amazon Transcribe
- Build call recording and storage pipeline

### Deliverables

#### 2.1 Twilio Integration

```typescript
interface TwilioService {
  // Phone number management
  provisionNumber(userId: string): Promise<PhoneNumber>;

  // Outbound calls
  initiateCall(params: CallParams): Promise<Call>;

  // Call control
  endCall(callSid: string): Promise<void>;
  transferCall(callSid: string, to: string): Promise<void>;

  // Webhooks
  handleStatusCallback(event: TwilioEvent): Promise<void>;
}
```

**Tasks:**

- [ ] Set up Twilio account
- [ ] Provision phone numbers
- [ ] Configure webhooks
- [ ] Implement call initiation
- [ ] Add call status tracking

#### 2.2 Voice Synthesis (Amazon Polly)

```typescript
interface VoiceSynthesisService {
  // Text to speech
  synthesize(text: string, voiceId: string): Promise<AudioStream>;

  // SSML support
  synthesizeSSML(ssml: string, voiceId: string): Promise<AudioStream>;

  // Voice options
  listVoices(): Promise<Voice[]>;
}
```

**Tasks:**

- [ ] Integrate Amazon Polly
- [ ] Implement voice selection
- [ ] Add SSML support for natural speech
- [ ] Cache common phrases
- [ ] Configure voice settings per user

#### 2.3 Speech Recognition (Amazon Transcribe)

```typescript
interface SpeechRecognitionService {
  // Real-time transcription
  startTranscription(audioStream: AudioStream): Promise<TranscriptionSession>;

  // Post-call transcription
  transcribeRecording(recordingUrl: string): Promise<Transcript>;
}
```

**Tasks:**

- [ ] Integrate Amazon Transcribe
- [ ] Implement real-time transcription
- [ ] Add post-call transcription
- [ ] Store transcripts in DynamoDB

#### 2.4 Call Recording Pipeline

```typescript
interface CallRecordingService {
  // Recording management
  startRecording(callSid: string): Promise<void>;
  stopRecording(callSid: string): Promise<string>; // returns URL

  // Storage
  storeRecording(recordingUrl: string, userId: string): Promise<string>;

  // Retrieval
  getRecording(recordingId: string): Promise<Recording>;
}
```

**Tasks:**

- [ ] Configure Twilio recording
- [ ] Set up S3 bucket for recordings
- [ ] Implement secure storage
- [ ] Add retention policies
- [ ] Create playback endpoint

---

## Week 11-12: Phone Call Execution

### Objectives

- Build call scripting engine
- Implement real-time call handling
- Create post-call processing
- Add call approval workflow

### Deliverables

#### 2.5 Call Scripting Engine

```typescript
interface CallScript {
  scriptId: string;
  name: string;
  purpose: string;
  steps: CallScriptStep[];
  fallbacks: FallbackHandler[];
  successCriteria: SuccessCriteria;
}

interface CallScriptStep {
  stepId: string;
  type: "speak" | "listen" | "dtmf" | "transfer" | "hangup";
  content?: string;
  expectedResponses?: ExpectedResponse[];
  timeout?: number;
  nextStep?: string;
}
```

**Tasks:**

- [ ] Design script schema
- [ ] Build script interpreter
- [ ] Implement step execution
- [ ] Add branching logic
- [ ] Create script templates

#### 2.6 Real-Time Call Handler

```typescript
interface CallHandler {
  // Call lifecycle
  onCallStarted(call: Call): Promise<void>;
  onSpeechDetected(call: Call, speech: string): Promise<CallAction>;
  onDTMFReceived(call: Call, digits: string): Promise<CallAction>;
  onCallEnded(call: Call): Promise<void>;

  // AI integration
  generateResponse(context: CallContext, input: string): Promise<string>;
}
```

**Tasks:**

- [ ] Implement WebSocket handler
- [ ] Build conversation state machine
- [ ] Integrate AI for responses
- [ ] Add error recovery
- [ ] Implement call logging

#### 2.7 Call Types

| Call Type           | Description                | Script Template     |
| ------------------- | -------------------------- | ------------------- |
| Appointment Booking | Book doctor, dentist, etc. | appointment_booking |
| Customer Service    | Handle support calls       | customer_service    |
| Bill Negotiation    | Negotiate rates            | bill_negotiation    |
| Reservation         | Restaurant, hotel          | reservation         |
| Follow-up           | Check order status         | follow_up           |

**Tasks:**

- [ ] Create appointment booking script
- [ ] Create customer service script
- [ ] Create bill negotiation script
- [ ] Create reservation script
- [ ] Test with real calls

#### 2.8 Call Approval Workflow

```typescript
interface CallApproval {
  approvalId: string;
  callType: CallType;
  recipient: {
    name: string;
    phone: string;
    organization?: string;
  };
  purpose: string;
  script: CallScript;
  estimatedDuration: number;
  userInstructions?: string;
}
```

**Tasks:**

- [ ] Create call approval UI
- [ ] Show script preview
- [ ] Allow user modifications
- [ ] Implement call scheduling
- [ ] Add post-call review

---

## Week 13-14: Email Automation

### Objectives

- Build automation rule engine
- Implement follow-up automation
- Add unsubscribe automation
- Create email templates

### Deliverables

#### 2.9 Email Automation Rules

```typescript
interface EmailAutomationRule {
  ruleId: string;
  userId: string;
  name: string;
  enabled: boolean;
  trigger: EmailTrigger;
  conditions: EmailCondition[];
  actions: EmailAction[];
  approvalMode: ApprovalMode;
}

type EmailTrigger =
  | { type: "new_email" }
  | { type: "no_response"; days: number }
  | { type: "scheduled"; cron: string };

type EmailAction =
  | { type: "reply"; template: string }
  | { type: "forward"; to: string }
  | { type: "label"; label: string }
  | { type: "archive" }
  | { type: "unsubscribe" };
```

**Tasks:**

- [ ] Design rule schema
- [ ] Build rule engine
- [ ] Implement triggers
- [ ] Implement actions
- [ ] Create rule management UI

#### 2.10 Follow-Up Automation

```typescript
interface FollowUpRule {
  ruleId: string;
  name: string;
  conditions: {
    noResponseDays: number;
    emailCategories?: EmailCategory[];
    senderDomains?: string[];
  };
  action: {
    template: string;
    maxFollowUps: number;
    intervalDays: number;
  };
}
```

**Tasks:**

- [ ] Implement follow-up detection
- [ ] Create follow-up templates
- [ ] Build scheduling system
- [ ] Add follow-up tracking
- [ ] Implement max follow-up limits

#### 2.11 Unsubscribe Automation

```typescript
interface UnsubscribeService {
  // Detection
  detectUnsubscribeLink(email: Email): Promise<string | null>;

  // Execution
  unsubscribe(email: Email): Promise<UnsubscribeResult>;

  // Tracking
  getUnsubscribeHistory(userId: string): Promise<UnsubscribeRecord[]>;
}
```

**Tasks:**

- [ ] Detect unsubscribe links
- [ ] Implement automated unsubscribe
- [ ] Track unsubscribe history
- [ ] Add bulk unsubscribe
- [ ] Create unsubscribe suggestions

#### 2.12 SMS Interaction

```typescript
interface SMSService {
  // Sending
  sendSMS(to: string, message: string): Promise<void>;

  // Receiving
  handleIncomingSMS(from: string, message: string): Promise<string>;

  // Approval via SMS
  sendApprovalRequest(userId: string, approval: Approval): Promise<void>;
  processApprovalResponse(from: string, response: string): Promise<void>;
}
```

**Tasks:**

- [ ] Configure Twilio SMS
- [ ] Implement SMS sending
- [ ] Build SMS command parser
- [ ] Add approval via SMS
- [ ] Create SMS templates

---

## API Endpoints

### Voice API

```
POST   /calls                    # Initiate call
GET    /calls                    # List calls
GET    /calls/:callId            # Get call details
POST   /calls/:callId/end        # End call
GET    /calls/:callId/recording  # Get recording
GET    /calls/:callId/transcript # Get transcript
```

### Automation API

```
GET    /automations              # List rules
POST   /automations              # Create rule
GET    /automations/:ruleId      # Get rule
PATCH  /automations/:ruleId      # Update rule
DELETE /automations/:ruleId      # Delete rule
POST   /automations/:ruleId/test # Test rule
```

---

## Success Criteria

- [ ] Twilio integration working
- [ ] Voice synthesis natural sounding
- [ ] Call scripts executing correctly
- [ ] Call recordings stored and accessible
- [ ] Transcription accurate
- [ ] Email automation rules working
- [ ] Follow-up automation functional
- [ ] SMS interaction working

---

## Risk Mitigation

| Risk                 | Mitigation                         |
| -------------------- | ---------------------------------- |
| Call quality issues  | Start with simple scripts, iterate |
| AI response delays   | Pre-generate common responses      |
| Transcription errors | Use post-call review               |
| Automation mistakes  | Require approval for new rules     |

---

## Next Phase Preview

**Phase 3: Money (Weeks 15-20)**

- Open Banking integration
- Budget tracking and management
- Spending account integration
- Bill payment automation
