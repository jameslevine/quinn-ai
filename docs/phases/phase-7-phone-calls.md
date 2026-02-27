# Phase 7: Phone Calls 📞

## Overview

Phase 7 adds the ability for Quinn to make phone calls on the user's behalf. This is a key differentiator - Quinn can actually call businesses, book appointments, and handle customer service calls.

**Status:** 📋 Planned  
**Estimated Duration:** 4-6 weeks

---

## Goals

1. Integrate Twilio for voice calls
2. Implement voice synthesis (text-to-speech)
3. Build call scripting system
4. Add call recording and transcription
5. Create call approval workflow
6. Enable real-time call monitoring

---

## Features

### 7.1 Twilio Integration

**Objective:** Connect to Twilio for making and receiving calls

**Backend Components:**

```typescript
// backend/src/lib/twilio.ts
interface TwilioService {
  // Make outbound call
  makeCall(to: string, script: CallScript): Promise<Call>;

  // Handle incoming call
  handleIncoming(callSid: string): Promise<TwiML>;

  // Get call status
  getCallStatus(callSid: string): Promise<CallStatus>;

  // End call
  endCall(callSid: string): Promise<void>;

  // Get recording
  getRecording(callSid: string): Promise<Recording>;
}
```

**Tasks:**

- [ ] Create Twilio account and get credentials
- [ ] Purchase phone number(s)
- [ ] Create Twilio service library
- [ ] Implement outbound calling
- [ ] Set up webhook handlers
- [ ] Implement call status tracking
- [ ] Add error handling and retries

### 7.2 Voice Synthesis

**Objective:** Generate natural-sounding speech for calls

**Options:**

1. **Twilio TTS** - Built-in, simple
2. **Amazon Polly** - High quality, AWS native
3. **ElevenLabs** - Most natural, premium
4. **OpenAI TTS** - Good quality, easy integration

**Backend Components:**

```typescript
// backend/src/lib/voice.ts
interface VoiceService {
  // Generate speech from text
  synthesize(text: string, voice: VoiceConfig): Promise<AudioBuffer>;

  // Stream speech
  streamSpeech(text: string, voice: VoiceConfig): AsyncGenerator<AudioChunk>;

  // Get available voices
  getVoices(): Promise<Voice[]>;
}

interface VoiceConfig {
  provider: "twilio" | "polly" | "elevenlabs" | "openai";
  voiceId: string;
  speed: number;
  pitch: number;
}
```

**Tasks:**

- [ ] Evaluate TTS providers
- [ ] Implement primary TTS integration
- [ ] Add voice selection options
- [ ] Implement SSML support
- [ ] Add caching for common phrases
- [ ] Create voice preview feature

### 7.3 Call Scripting

**Objective:** Create dynamic scripts for different call types

**Backend Components:**

```typescript
// backend/src/lib/call-scripts.ts
interface CallScript {
  scriptId: string;
  type: CallType;
  steps: ScriptStep[];
  variables: Record<string, string>;
  fallbacks: FallbackHandler[];
}

interface ScriptStep {
  stepId: string;
  action: "speak" | "listen" | "dtmf" | "transfer" | "hangup";
  content?: string;
  timeout?: number;
  nextStep?: string;
  conditions?: Condition[];
}

// Script types
type CallType =
  | "appointment_booking"
  | "customer_service"
  | "bill_negotiation"
  | "order_followup"
  | "general_inquiry";
```

**Script Templates:**

```typescript
// Appointment booking script
const appointmentScript: CallScript = {
  type: "appointment_booking",
  steps: [
    {
      action: "speak",
      content: "Hello, I'm calling on behalf of {{userName}} to book an appointment.",
    },
    { action: "listen", timeout: 10 },
    {
      action: "speak",
      content: "We're looking for an appointment on {{preferredDate}} if possible.",
    },
    // ... more steps
  ],
};
```

**Tasks:**

- [ ] Design script schema
- [ ] Create script templates for common calls
- [ ] Implement script engine
- [ ] Add variable substitution
- [ ] Create script builder UI
- [ ] Implement conditional logic

### 7.4 Speech Recognition

**Objective:** Understand responses during calls

**Backend Components:**

```typescript
// backend/src/lib/speech.ts
interface SpeechService {
  // Transcribe audio
  transcribe(audio: AudioBuffer): Promise<Transcription>;

  // Real-time transcription
  streamTranscribe(audioStream: Stream): AsyncGenerator<TranscriptionChunk>;

  // Analyze intent
  analyzeIntent(transcription: string): Promise<Intent>;
}
```

**Tasks:**

- [ ] Integrate Twilio speech recognition
- [ ] Add real-time transcription
- [ ] Implement intent detection
- [ ] Add keyword spotting
- [ ] Create response handling logic

### 7.5 Call Recording & Transcription

**Objective:** Record calls and provide transcripts

**Backend Components:**

```typescript
// backend/src/adapters/calls.ts
interface CallAdapter {
  saveCall(userId: string, call: CallRecord): Promise<void>;
  getCall(userId: string, callId: string): Promise<CallRecord>;
  getUserCalls(userId: string): Promise<CallRecord[]>;
  saveTranscript(callId: string, transcript: Transcript): Promise<void>;
}

interface CallRecord {
  callId: string;
  userId: string;
  direction: "outbound" | "inbound";
  to: string;
  from: string;
  status: CallStatus;
  duration: number;
  recordingUrl?: string;
  transcript?: Transcript;
  script?: CallScript;
  outcome?: CallOutcome;
  createdAt: string;
}
```

**Tasks:**

- [ ] Enable call recording in Twilio
- [ ] Store recordings in S3
- [ ] Implement transcription pipeline
- [ ] Create call history UI
- [ ] Add transcript search
- [ ] Implement call playback

### 7.6 Call Approval Workflow

**Objective:** User approves calls before they're made

**Flow:**

1. AI determines a call is needed
2. Creates call action with script preview
3. User reviews and approves/modifies
4. Quinn makes the call
5. User can monitor in real-time
6. Call summary provided after

**Frontend Components:**

```typescript
// Call approval UI
interface CallApproval {
  callId: string;
  purpose: string;
  recipient: string;
  script: CallScript;
  estimatedDuration: number;
  scheduledTime?: string;
}
```

**Tasks:**

- [ ] Create call action type
- [ ] Build call preview UI
- [ ] Implement script editing
- [ ] Add scheduling options
- [ ] Create real-time monitoring UI
- [ ] Build call summary view

---

## API Endpoints

### Calls

```
POST   /calls                     # Initiate call (creates action)
GET    /calls                     # List call history
GET    /calls/:callId             # Get call details
GET    /calls/:callId/recording   # Get recording
GET    /calls/:callId/transcript  # Get transcript
DELETE /calls/:callId             # Cancel scheduled call
```

### Scripts

```
GET    /calls/scripts             # List script templates
GET    /calls/scripts/:type       # Get script template
POST   /calls/scripts/preview     # Preview script with variables
```

### Webhooks (Twilio)

```
POST   /webhooks/twilio/voice     # Voice webhook
POST   /webhooks/twilio/status    # Status callback
POST   /webhooks/twilio/recording # Recording callback
```

---

## Data Models

### CallRecord

```typescript
interface CallRecord {
  pk: string; // USER#<userId>
  sk: string; // CALL#<callId>
  callId: string;
  twilioSid: string;
  userId: string;
  direction: "outbound" | "inbound";
  to: string;
  from: string;
  purpose: string;
  scriptType: CallType;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  duration?: number;
  recordingUrl?: string;
  transcriptUrl?: string;
  outcome?: CallOutcome;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CallOutcome

```typescript
interface CallOutcome {
  success: boolean;
  summary: string;
  appointmentBooked?: {
    date: string;
    time: string;
    confirmationNumber?: string;
  };
  followUpRequired: boolean;
  followUpNotes?: string;
}
```

---

## Call Types & Scripts

### 1. Appointment Booking

- Doctor/dentist appointments
- Car service scheduling
- Haircut appointments
- Restaurant reservations

### 2. Customer Service

- Order status inquiries
- Return/refund requests
- Account questions
- Technical support

### 3. Bill Negotiation

- Internet/cable bills
- Insurance rates
- Subscription cancellations
- Fee disputes

### 4. Order Follow-up

- Delivery status
- Missing items
- Order modifications

---

## Technical Considerations

### Twilio Configuration

- Use Twilio Programmable Voice
- Enable call recording
- Set up status callbacks
- Configure speech recognition

### Voice Quality

- Use neural TTS voices
- Implement SSML for natural pauses
- Add filler words for realism
- Handle interruptions gracefully

### Compliance

- Inform recipients call may be recorded
- Follow local regulations
- Implement opt-out mechanisms
- Store consent records

### Cost Management

- Track call minutes per user
- Implement call duration limits
- Use efficient TTS caching
- Monitor Twilio costs

---

## Success Criteria

- [ ] Successfully make outbound calls
- [ ] Natural-sounding voice synthesis
- [ ] Accurate speech recognition
- [ ] Call recordings accessible
- [ ] Transcripts generated automatically
- [ ] User can monitor calls in real-time
- [ ] 80%+ success rate for appointment bookings

---

## Dependencies

- Twilio account with phone number
- TTS provider (Polly/ElevenLabs)
- S3 bucket for recordings
- Increased Lambda timeout (15 min)
- WebSocket support for real-time updates

---

## Risks & Mitigations

| Risk                      | Mitigation                        |
| ------------------------- | --------------------------------- |
| Poor voice quality        | Use premium TTS, test extensively |
| Speech recognition errors | Add confirmation steps, fallbacks |
| Compliance issues         | Legal review, consent mechanisms  |
| High costs                | Usage limits, efficient caching   |
| Call failures             | Retry logic, human fallback       |
