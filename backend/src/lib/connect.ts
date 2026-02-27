import {
  ConnectClient,
  StartOutboundVoiceContactCommand,
  StopContactCommand,
  GetContactAttributesCommand,
  DescribeContactCommand,
} from "@aws-sdk/client-connect";
import {
  PollyClient,
  SynthesizeSpeechCommand,
  Engine,
  OutputFormat,
  VoiceId,
} from "@aws-sdk/client-polly";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize AWS clients
const region = process.env.AWS_REGION || "eu-west-2";

const connectClient = new ConnectClient({ region });
const pollyClient = new PollyClient({ region });
const transcribeClient = new TranscribeClient({ region });
const s3Client = new S3Client({ region });

// Environment variables
const CONNECT_INSTANCE_ID = process.env.CONNECT_INSTANCE_ID;
const CONNECT_CONTACT_FLOW_ARN = process.env.CONNECT_CONTACT_FLOW_ID; // This is actually the ARN
// Extract Contact Flow ID from ARN (format: arn:aws:connect:region:account:instance/instance-id/contact-flow/flow-id)
const CONNECT_CONTACT_FLOW_ID = CONNECT_CONTACT_FLOW_ARN?.split("/").pop();
const CONNECT_QUEUE_ARN = process.env.CONNECT_QUEUE_ARN;
// Extract Queue ID from ARN (format: arn:aws:connect:region:account:instance/instance-id/queue/queue-id)
const CONNECT_QUEUE_ID = CONNECT_QUEUE_ARN?.split("/").pop();
const CONNECT_SOURCE_PHONE_NUMBER = process.env.CONNECT_SOURCE_PHONE_NUMBER;
const RECORDINGS_BUCKET = process.env.RECORDINGS_BUCKET || "quinn-recordings";

// Types
export type CallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "completed"
  | "busy"
  | "failed"
  | "no-answer"
  | "canceled";

export type CallType =
  | "appointment_booking"
  | "customer_service"
  | "bill_negotiation"
  | "order_followup"
  | "general_inquiry";

export interface CallScript {
  scriptId: string;
  type: CallType;
  name: string;
  description: string;
  steps: ScriptStep[];
  variables: Record<string, string>;
}

export interface ScriptStep {
  stepId: string;
  action: "speak" | "listen" | "gather" | "record" | "pause" | "hangup";
  content?: string;
  voice?: VoiceId;
  language?: string;
  timeout?: number;
  numDigits?: number;
  finishOnKey?: string;
  nextStep?: string;
  conditions?: StepCondition[];
}

export interface StepCondition {
  type: "digits" | "speech" | "timeout";
  value?: string;
  contains?: string;
  nextStep: string;
}

export interface CallOptions {
  to: string;
  from?: string;
  script?: CallScript;
  attributes?: Record<string, string>;
  timeout?: number;
}

export interface CallResult {
  contactId: string;
  status: CallStatus;
  to: string;
  from: string;
  startTime?: Date;
}

export interface VoiceSynthesisOptions {
  text: string;
  voice?: VoiceId;
  engine?: Engine;
  outputFormat?: OutputFormat;
}

export interface TranscriptionResult {
  jobName: string;
  status: string;
  transcriptUri?: string;
  transcript?: string;
}

// Generate a full call message from script
const generateCallMessage = (script: CallScript): string => {
  // Combine all speak steps into a single message
  const messages: string[] = [];

  for (const step of script.steps) {
    if (step.content && (step.action === "speak" || step.action === "hangup")) {
      const processedContent = substituteVariables(step.content, script.variables);
      messages.push(processedContent);
    }
  }

  // Join with pauses
  return messages.join(" ... ");
};

// Make an outbound call using Amazon Connect
export const makeCall = async (options: CallOptions): Promise<CallResult> => {
  if (!CONNECT_INSTANCE_ID || !CONNECT_CONTACT_FLOW_ID) {
    throw new Error(
      "Amazon Connect not configured. Set CONNECT_INSTANCE_ID and CONNECT_CONTACT_FLOW_ID."
    );
  }

  const sourcePhoneNumber = options.from || CONNECT_SOURCE_PHONE_NUMBER;
  if (!sourcePhoneNumber) {
    throw new Error(
      "No source phone number configured. Set CONNECT_SOURCE_PHONE_NUMBER or provide 'from' option."
    );
  }

  // Prepare contact attributes from script variables
  const attributes: Record<string, string> = {
    ...options.attributes,
  };

  if (options.script) {
    attributes.scriptId = options.script.scriptId;
    attributes.scriptType = options.script.type;
    // Generate the full message from the script
    attributes.message = generateCallMessage(options.script);
    // Add script variables as attributes
    Object.entries(options.script.variables).forEach(([key, value]) => {
      attributes[`var_${key}`] = value;
    });
  } else {
    // Default message if no script
    attributes.message =
      "Hello, this is Quinn, your AI assistant. Thank you for your time. Goodbye.";
  }

  try {
    const command = new StartOutboundVoiceContactCommand({
      InstanceId: CONNECT_INSTANCE_ID,
      ContactFlowId: CONNECT_CONTACT_FLOW_ID,
      DestinationPhoneNumber: options.to,
      SourcePhoneNumber: sourcePhoneNumber,
      QueueId: CONNECT_QUEUE_ID,
      Attributes: attributes,
    });

    const response = await connectClient.send(command);

    return {
      contactId: response.ContactId || "",
      status: "queued",
      to: options.to,
      from: sourcePhoneNumber,
      startTime: new Date(),
    };
  } catch (error) {
    console.error("Error making call:", error);
    throw error;
  }
};

// Get call/contact status
export const getCallStatus = async (contactId: string): Promise<CallResult> => {
  if (!CONNECT_INSTANCE_ID) {
    throw new Error("Amazon Connect not configured");
  }

  try {
    const command = new DescribeContactCommand({
      InstanceId: CONNECT_INSTANCE_ID,
      ContactId: contactId,
    });

    const response = await connectClient.send(command);
    const contact = response.Contact;

    // Map Connect contact state to our CallStatus
    let status: CallStatus = "queued";
    if (contact?.AgentInfo) {
      status = "in-progress";
    }
    if (contact?.DisconnectTimestamp) {
      status = "completed";
    }

    return {
      contactId,
      status,
      to: contact?.InitialContactId || "",
      from: "",
      startTime: contact?.InitiationTimestamp,
    };
  } catch (error) {
    console.error("Error fetching call status:", error);
    throw error;
  }
};

// End a call
export const endCall = async (contactId: string): Promise<void> => {
  if (!CONNECT_INSTANCE_ID) {
    throw new Error("Amazon Connect not configured");
  }

  try {
    const command = new StopContactCommand({
      InstanceId: CONNECT_INSTANCE_ID,
      ContactId: contactId,
    });

    await connectClient.send(command);
  } catch (error) {
    console.error("Error ending call:", error);
    throw error;
  }
};

// Get contact attributes
export const getContactAttributes = async (contactId: string): Promise<Record<string, string>> => {
  if (!CONNECT_INSTANCE_ID) {
    throw new Error("Amazon Connect not configured");
  }

  try {
    const command = new GetContactAttributesCommand({
      InstanceId: CONNECT_INSTANCE_ID,
      InitialContactId: contactId,
    });

    const response = await connectClient.send(command);
    return response.Attributes || {};
  } catch (error) {
    console.error("Error fetching contact attributes:", error);
    throw error;
  }
};

// Synthesize speech using Amazon Polly
export const synthesizeSpeech = async (
  options: VoiceSynthesisOptions
): Promise<{ audioStream: Uint8Array; contentType: string }> => {
  const command = new SynthesizeSpeechCommand({
    Text: options.text,
    VoiceId: options.voice || "Amy",
    Engine: options.engine || "neural",
    OutputFormat: options.outputFormat || "mp3",
  });

  try {
    const response = await pollyClient.send(command);

    if (!response.AudioStream) {
      throw new Error("No audio stream returned from Polly");
    }

    // Convert stream to Uint8Array
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const audioStream = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      audioStream.set(chunk, offset);
      offset += chunk.length;
    }

    return {
      audioStream,
      contentType: response.ContentType || "audio/mpeg",
    };
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw error;
  }
};

// Generate speech and save to S3
export const generateSpeechToS3 = async (
  text: string,
  key: string,
  voice: VoiceId = "Amy"
): Promise<string> => {
  const { audioStream, contentType } = await synthesizeSpeech({
    text,
    voice,
    engine: "neural",
    outputFormat: "mp3",
  });

  const putCommand = new PutObjectCommand({
    Bucket: RECORDINGS_BUCKET,
    Key: key,
    Body: audioStream,
    ContentType: contentType,
  });

  await s3Client.send(putCommand);

  // Generate presigned URL for access
  const getCommand = new GetObjectCommand({
    Bucket: RECORDINGS_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
  return url;
};

// Start transcription job
export const startTranscription = async (audioUri: string, jobName: string): Promise<string> => {
  const command = new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    LanguageCode: "en-GB",
    MediaFormat: "mp3",
    Media: {
      MediaFileUri: audioUri,
    },
    OutputBucketName: RECORDINGS_BUCKET,
    OutputKey: `transcripts/${jobName}.json`,
  });

  try {
    await transcribeClient.send(command);
    return jobName;
  } catch (error) {
    console.error("Error starting transcription:", error);
    throw error;
  }
};

// Get transcription result
export const getTranscription = async (jobName: string): Promise<TranscriptionResult> => {
  const command = new GetTranscriptionJobCommand({
    TranscriptionJobName: jobName,
  });

  try {
    const response = await transcribeClient.send(command);
    const job = response.TranscriptionJob;

    return {
      jobName,
      status: job?.TranscriptionJobStatus || "UNKNOWN",
      transcriptUri: job?.Transcript?.TranscriptFileUri,
    };
  } catch (error) {
    console.error("Error getting transcription:", error);
    throw error;
  }
};

// Pre-built script templates
export const SCRIPT_TEMPLATES: Record<CallType, Omit<CallScript, "scriptId" | "variables">> = {
  appointment_booking: {
    type: "appointment_booking",
    name: "Appointment Booking",
    description: "Book an appointment with a business",
    steps: [
      {
        stepId: "intro",
        action: "speak",
        content:
          "Hello, I'm calling on behalf of {{userName}}. I'd like to book an appointment please.",
        voice: "Amy",
        nextStep: "listen_response",
      },
      {
        stepId: "listen_response",
        action: "listen",
        content: "I'm listening.",
        timeout: 10,
        nextStep: "request_date",
      },
      {
        stepId: "request_date",
        action: "speak",
        content:
          "We're looking for an appointment on {{preferredDate}} if possible. What times do you have available?",
        voice: "Amy",
        nextStep: "listen_times",
      },
      {
        stepId: "listen_times",
        action: "listen",
        timeout: 15,
        nextStep: "confirm",
      },
      {
        stepId: "confirm",
        action: "speak",
        content:
          "That sounds perfect. Could you please confirm the appointment details and provide a confirmation number?",
        voice: "Amy",
        nextStep: "listen_confirmation",
      },
      {
        stepId: "listen_confirmation",
        action: "listen",
        timeout: 20,
        nextStep: "thank_you",
      },
      {
        stepId: "thank_you",
        action: "hangup",
        content: "Thank you so much for your help. Have a great day!",
        voice: "Amy",
      },
    ],
  },

  customer_service: {
    type: "customer_service",
    name: "Customer Service Inquiry",
    description: "Handle customer service inquiries",
    steps: [
      {
        stepId: "intro",
        action: "speak",
        content:
          "Hello, I'm calling on behalf of {{userName}} regarding account number {{accountNumber}}.",
        voice: "Amy",
        nextStep: "state_issue",
      },
      {
        stepId: "state_issue",
        action: "speak",
        content: "{{issueDescription}}",
        voice: "Amy",
        nextStep: "listen_response",
      },
      {
        stepId: "listen_response",
        action: "listen",
        timeout: 30,
        nextStep: "follow_up",
      },
      {
        stepId: "follow_up",
        action: "speak",
        content: "I understand. Is there anything else I need to do to resolve this?",
        voice: "Amy",
        nextStep: "listen_final",
      },
      {
        stepId: "listen_final",
        action: "listen",
        timeout: 20,
        nextStep: "thank_you",
      },
      {
        stepId: "thank_you",
        action: "hangup",
        content: "Thank you for your assistance. Goodbye.",
        voice: "Amy",
      },
    ],
  },

  bill_negotiation: {
    type: "bill_negotiation",
    name: "Bill Negotiation",
    description: "Negotiate bills or request discounts",
    steps: [
      {
        stepId: "intro",
        action: "speak",
        content:
          "Hello, I'm calling on behalf of {{userName}} regarding their account. I'd like to discuss the current billing and see if there are any promotions or discounts available.",
        voice: "Amy",
        nextStep: "listen_response",
      },
      {
        stepId: "listen_response",
        action: "listen",
        timeout: 20,
        nextStep: "negotiate",
      },
      {
        stepId: "negotiate",
        action: "speak",
        content:
          "I see. {{userName}} has been a loyal customer for {{customerDuration}}. Are there any loyalty discounts or current promotions that could be applied to reduce the monthly bill?",
        voice: "Amy",
        nextStep: "listen_offer",
      },
      {
        stepId: "listen_offer",
        action: "listen",
        timeout: 30,
        nextStep: "respond_offer",
      },
      {
        stepId: "respond_offer",
        action: "speak",
        content: "That's helpful. Could you please confirm what the new monthly rate would be?",
        voice: "Amy",
        nextStep: "listen_confirmation",
      },
      {
        stepId: "listen_confirmation",
        action: "listen",
        timeout: 20,
        nextStep: "thank_you",
      },
      {
        stepId: "thank_you",
        action: "hangup",
        content: "Thank you for your help today. Have a great day!",
        voice: "Amy",
      },
    ],
  },

  order_followup: {
    type: "order_followup",
    name: "Order Follow-up",
    description: "Follow up on an order status",
    steps: [
      {
        stepId: "intro",
        action: "speak",
        content:
          "Hello, I'm calling on behalf of {{userName}} to check on the status of order number {{orderNumber}}.",
        voice: "Amy",
        nextStep: "listen_status",
      },
      {
        stepId: "listen_status",
        action: "listen",
        timeout: 20,
        nextStep: "follow_up",
      },
      {
        stepId: "follow_up",
        action: "speak",
        content: "Thank you. When can we expect the delivery?",
        voice: "Amy",
        nextStep: "listen_delivery",
      },
      {
        stepId: "listen_delivery",
        action: "listen",
        timeout: 15,
        nextStep: "thank_you",
      },
      {
        stepId: "thank_you",
        action: "hangup",
        content: "Perfect, thank you for the update. Goodbye.",
        voice: "Amy",
      },
    ],
  },

  general_inquiry: {
    type: "general_inquiry",
    name: "General Inquiry",
    description: "Make a general inquiry call",
    steps: [
      {
        stepId: "intro",
        action: "speak",
        content: "Hello, I'm calling on behalf of {{userName}}. {{inquiryMessage}}",
        voice: "Amy",
        nextStep: "listen_response",
      },
      {
        stepId: "listen_response",
        action: "listen",
        timeout: 30,
        nextStep: "follow_up",
      },
      {
        stepId: "follow_up",
        action: "speak",
        content: "I see. Is there anything else I should know?",
        voice: "Amy",
        nextStep: "listen_final",
      },
      {
        stepId: "listen_final",
        action: "listen",
        timeout: 20,
        nextStep: "thank_you",
      },
      {
        stepId: "thank_you",
        action: "hangup",
        content: "Thank you for your time. Goodbye.",
        voice: "Amy",
      },
    ],
  },
};

// Create a script from template
export const createScriptFromTemplate = (
  type: CallType,
  variables: Record<string, string>
): CallScript => {
  const template = SCRIPT_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown script type: ${type}`);
  }

  return {
    ...template,
    scriptId: `script_${Date.now()}`,
    variables,
  };
};

// Substitute variables in content
export const substituteVariables = (content: string, variables: Record<string, string>): string => {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
};

// Generate all speech prompts for a script and save to S3
export const generateScriptAudio = async (script: CallScript): Promise<Record<string, string>> => {
  const audioUrls: Record<string, string> = {};

  for (const step of script.steps) {
    if (step.content && (step.action === "speak" || step.action === "hangup")) {
      const processedContent = substituteVariables(step.content, script.variables);
      const key = `scripts/${script.scriptId}/${step.stepId}.mp3`;
      const url = await generateSpeechToS3(processedContent, key, step.voice || "Amy");
      audioUrls[step.stepId] = url;
    }
  }

  return audioUrls;
};

// Available Polly voices for UK English
export const AVAILABLE_VOICES: { id: VoiceId; name: string; gender: string }[] = [
  { id: "Amy", name: "Amy", gender: "Female" },
  { id: "Emma", name: "Emma", gender: "Female" },
  { id: "Brian", name: "Brian", gender: "Male" },
  { id: "Arthur", name: "Arthur", gender: "Male" },
];
