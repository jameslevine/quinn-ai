/**
 * Amazon Connect Lambda Handler for AI-Powered Conversations
 *
 * This Lambda function is invoked by Amazon Connect contact flows to handle
 * real-time AI conversations during phone calls.
 *
 * Contact Flow Setup:
 * 1. Use "Get customer input" block with Amazon Lex or speech recognition
 * 2. Invoke this Lambda with the transcribed speech
 * 3. Use "Play prompt" to speak the AI response
 * 4. Loop back to step 1 until shouldEndCall is true
 */

import { handleVoiceConversation } from "../lib/lex";
import { updateDbCallStatus, updateDbCallOutcome, getDbCallByContactId } from "../adapters/calls";
import { generateSpeechToS3 } from "../lib/connect";

// Types for Connect Lambda events
interface ConnectLambdaEvent {
  Details: {
    ContactData: {
      ContactId: string;
      Channel: string;
      InitiationMethod: string;
      Attributes: Record<string, string>;
      CustomerEndpoint?: {
        Address: string;
        Type: string;
      };
      SystemEndpoint?: {
        Address: string;
        Type: string;
      };
    };
    Parameters: Record<string, string>;
  };
  Name: string;
}

interface ConnectLambdaResponse {
  response: string;
  shouldEndCall: string;
  audioUrl?: string;
  [key: string]: string | undefined;
}

// Main handler for Connect Lambda invocation
export const handler = async (event: ConnectLambdaEvent): Promise<ConnectLambdaResponse> => {
  console.log("[Connect Conversation] Received event:", JSON.stringify(event, null, 2));

  const { ContactData, Parameters } = event.Details;
  const contactId = ContactData.ContactId;
  const attributes = ContactData.Attributes;

  // Get the speech input from parameters (set by "Get customer input" block)
  const speechInput = Parameters.speechInput || Parameters.utterance || "";

  // Merge attributes with parameters for session state
  const sessionAttributes: Record<string, string> = {
    ...attributes,
    contactId,
    // Map call-specific attributes
    userId: attributes.userId || "unknown",
    callId: attributes.callId || contactId,
    callPurpose: attributes.callPurpose || attributes.purpose || "General inquiry",
    intentType: attributes.intentType || attributes.scriptType || "GeneralInquiry",
    userName: attributes.userName || attributes.user_name || "the caller",
    businessName: attributes.businessName || attributes.business_name || "",
    preferredDate: attributes.preferredDate || attributes.preferred_date || "",
  };

  try {
    // Handle the conversation
    const result = await handleVoiceConversation(speechInput, sessionAttributes);

    console.log("[Connect Conversation] AI Response:", result.response);
    console.log("[Connect Conversation] Should End Call:", result.shouldEndCall);

    // If call should end, update the call record
    if (result.shouldEndCall) {
      try {
        const call = await getDbCallByContactId(contactId);
        if (call) {
          await updateDbCallStatus(call.userId, call.callId, "completed", undefined, "completed");

          // Parse and save outcome if available
          if (result.sessionAttributes.callOutcome) {
            const outcome = JSON.parse(result.sessionAttributes.callOutcome);
            await updateDbCallOutcome(call.userId, call.callId, outcome);
          }
        }
      } catch (dbError) {
        console.error("[Connect Conversation] Error updating call record:", dbError);
      }
    }

    // Optionally generate audio URL for the response
    // This can be used with "Play prompt" block in Connect
    let audioUrl: string | undefined;
    if (Parameters.generateAudio === "true") {
      try {
        const audioKey = `conversations/${contactId}/${Date.now()}.mp3`;
        audioUrl = await generateSpeechToS3(result.response, audioKey, "Amy");
      } catch (audioError) {
        console.error("[Connect Conversation] Error generating audio:", audioError);
      }
    }

    // Return response for Connect contact flow
    // All values must be strings for Connect attributes
    const response: ConnectLambdaResponse = {
      response: result.response,
      shouldEndCall: result.shouldEndCall ? "true" : "false",
      audioUrl,
      // Pass through updated session attributes
      ...Object.fromEntries(
        Object.entries(result.sessionAttributes).map(([k, v]) => [k, String(v)])
      ),
    };

    return response;
  } catch (error) {
    console.error("[Connect Conversation] Error:", error);

    // Return error response
    return {
      response:
        "I apologize, but I'm having technical difficulties. Please hold while I transfer you to a human agent.",
      shouldEndCall: "true",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Handler for initial call setup - called when call starts
export const initializeCall = async (event: ConnectLambdaEvent): Promise<ConnectLambdaResponse> => {
  console.log("[Connect Initialize] Received event:", JSON.stringify(event, null, 2));

  const { ContactData, Parameters } = event.Details;
  const contactId = ContactData.ContactId;
  const attributes = ContactData.Attributes;

  // Build initial greeting based on call type
  const intentType = attributes.intentType || attributes.scriptType || "GeneralInquiry";
  const userName = attributes.userName || attributes.user_name || "my client";
  const businessName = attributes.businessName || attributes.business_name || "your business";
  const callPurpose = attributes.callPurpose || attributes.purpose || "";

  let greeting: string;

  switch (intentType) {
    case "AppointmentBooking":
    case "appointment_booking":
      greeting = `Hello, I'm Quinn, an AI assistant calling on behalf of ${userName}. I'd like to book an appointment please.`;
      break;

    case "CustomerService":
    case "customer_service":
      greeting = `Hello, I'm Quinn, an AI assistant calling on behalf of ${userName}. I'm calling about a customer service matter.`;
      break;

    case "BillNegotiation":
    case "bill_negotiation":
      greeting = `Hello, I'm Quinn, an AI assistant calling on behalf of ${userName}. I'd like to discuss the account and see if there are any promotions available.`;
      break;

    case "OrderFollowup":
    case "order_followup":
      greeting = `Hello, I'm Quinn, an AI assistant calling on behalf of ${userName}. I'm calling to check on an order status.`;
      break;

    default:
      greeting = `Hello, I'm Quinn, an AI assistant calling on behalf of ${userName}. ${callPurpose || "How can I help you today?"}`;
  }

  // Initialize session attributes
  const sessionAttributes: Record<string, string> = {
    contactId,
    userId: attributes.userId || "unknown",
    callId: attributes.callId || contactId,
    callPurpose: callPurpose || "General inquiry",
    intentType,
    userName,
    businessName,
    conversationContext: JSON.stringify({
      userId: attributes.userId || "unknown",
      callId: attributes.callId || contactId,
      intentType,
      slots: {
        userName,
        businessName,
        preferredDate: attributes.preferredDate,
      },
      conversationHistory: [
        {
          role: "assistant",
          content: greeting,
        },
      ],
      callPurpose: callPurpose || "General inquiry",
      businessContext: businessName,
    }),
  };

  // Generate audio for greeting if requested
  let audioUrl: string | undefined;
  if (Parameters.generateAudio === "true") {
    try {
      const audioKey = `conversations/${contactId}/greeting.mp3`;
      audioUrl = await generateSpeechToS3(greeting, audioKey, "Amy");
    } catch (audioError) {
      console.error("[Connect Initialize] Error generating audio:", audioError);
    }
  }

  return {
    response: greeting,
    shouldEndCall: "false",
    audioUrl,
    ...sessionAttributes,
  };
};

// Handler for call end - called when call terminates
export const finalizeCall = async (event: ConnectLambdaEvent): Promise<ConnectLambdaResponse> => {
  console.log("[Connect Finalize] Received event:", JSON.stringify(event, null, 2));

  const { ContactData } = event.Details;
  const contactId = ContactData.ContactId;
  const attributes = ContactData.Attributes;

  try {
    // Update call record to completed
    const call = await getDbCallByContactId(contactId);
    if (call) {
      await updateDbCallStatus(call.userId, call.callId, "completed", undefined, "completed");

      // Parse and save outcome if available
      if (attributes.callOutcome) {
        try {
          const outcome = JSON.parse(attributes.callOutcome);
          await updateDbCallOutcome(call.userId, call.callId, outcome);
        } catch (parseError) {
          console.error("[Connect Finalize] Error parsing outcome:", parseError);
        }
      }
    }

    return {
      response: "Call finalized successfully",
      shouldEndCall: "true",
    };
  } catch (error) {
    console.error("[Connect Finalize] Error:", error);
    return {
      response: "Error finalizing call",
      shouldEndCall: "true",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
