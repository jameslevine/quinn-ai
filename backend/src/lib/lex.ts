import { chat, type Message } from "./ai";

// Note: Lex SDK packages would need to be installed for full Lex integration
// For now, we use direct AI conversation without Lex bot management

// Intent types for different call scenarios
export type IntentType =
  | "AppointmentBooking"
  | "CustomerService"
  | "BillNegotiation"
  | "OrderFollowup"
  | "GeneralInquiry"
  | "FallbackIntent";

// Slot types for gathering information
export interface ConversationSlots {
  userName?: string;
  preferredDate?: string;
  preferredTime?: string;
  businessName?: string;
  accountNumber?: string;
  issueDescription?: string;
  orderNumber?: string;
  inquiryTopic?: string;
}

// Conversation context for AI enhancement
export interface ConversationContext {
  userId: string;
  callId: string;
  intentType: IntentType;
  slots: ConversationSlots;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  callPurpose: string;
  businessContext?: string;
}

// Process user input and generate AI-enhanced response
export const processConversation = async (
  userInput: string,
  context: ConversationContext
): Promise<{
  response: string;
  shouldEndCall: boolean;
  updatedSlots: ConversationSlots;
  outcome?: {
    success: boolean;
    summary: string;
    appointmentBooked?: {
      date: string;
      time: string;
      confirmationNumber?: string;
    };
  };
}> => {
  // Add user input to conversation history
  context.conversationHistory.push({
    role: "user",
    content: userInput,
  });

  // Build system prompt based on intent type
  const systemPrompt = buildSystemPrompt(context);

  // Convert conversation history to Message format
  const messages: Message[] = context.conversationHistory.slice(0, -1).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // Add the current user input
  messages.push({
    role: "user",
    content: userInput,
  });

  // Generate AI response using the chat function
  const chatResponse = await chat(messages, {
    systemPrompt,
    maxTokens: 150, // Keep responses concise for phone calls
    temperature: 0.7,
    model: "haiku", // Use faster model for real-time conversation
  });

  const aiResponse = chatResponse.content;

  // Parse the AI response for any extracted information
  const parsed = parseAIResponse(aiResponse, context);

  // Update slots with any extracted information
  const updatedSlots = {
    ...context.slots,
    ...parsed.extractedSlots,
  };

  // Add assistant response to history
  context.conversationHistory.push({
    role: "assistant",
    content: parsed.response,
  });

  return {
    response: parsed.response,
    shouldEndCall: parsed.shouldEndCall,
    updatedSlots,
    outcome: parsed.outcome,
  };
};

// Build system prompt based on call context
const buildSystemPrompt = (context: ConversationContext): string => {
  const basePrompt = `You are Quinn, an AI assistant making a phone call on behalf of ${context.slots.userName || "the user"}. 
You are speaking with a real person at a business. Be polite, professional, and concise.
Keep your responses short and natural for a phone conversation (1-3 sentences max).
Do not use emojis or special characters.`;

  const intentPrompts: Record<IntentType, string> = {
    AppointmentBooking: `
Your goal is to book an appointment.
- Ask for available times on ${context.slots.preferredDate || "a convenient date"}
- Confirm the appointment details
- Get a confirmation number if possible
- Thank them and end the call politely

If they ask who you're calling for, say you're calling on behalf of ${context.slots.userName || "your client"}.`,

    CustomerService: `
Your goal is to resolve a customer service issue.
- Explain the issue: ${context.slots.issueDescription || context.callPurpose}
- Listen to their response and follow their instructions
- Ask clarifying questions if needed
- Confirm any resolution or next steps
- Thank them and end the call politely`,

    BillNegotiation: `
Your goal is to negotiate a better rate or discount.
- Mention that ${context.slots.userName || "the customer"} has been a loyal customer
- Ask about any current promotions or loyalty discounts
- Politely negotiate for a better rate
- Confirm any new pricing or changes
- Thank them and end the call politely`,

    OrderFollowup: `
Your goal is to check on an order status.
- Reference order number: ${context.slots.orderNumber || "the recent order"}
- Ask for the current status and expected delivery
- Note any tracking information
- Thank them and end the call politely`,

    GeneralInquiry: `
Your goal is to get information about: ${context.callPurpose}
- Ask your questions clearly
- Listen to their responses
- Ask follow-up questions if needed
- Thank them and end the call politely`,

    FallbackIntent: `
You're having a general conversation. Be helpful and try to understand what the person is saying.
If you're confused, politely ask them to repeat or clarify.`,
  };

  return `${basePrompt}

${intentPrompts[context.intentType] || intentPrompts.GeneralInquiry}

Current conversation context:
- Business: ${context.businessContext || "Unknown"}
- Purpose: ${context.callPurpose}
- Information gathered so far: ${JSON.stringify(context.slots)}

IMPORTANT: 
- If the call objective has been achieved (appointment booked, issue resolved, etc.), end your response with [CALL_COMPLETE]
- If you need to extract specific information (date, time, confirmation number), include it in your response naturally
- If the person seems confused or asks who you are, explain you're an AI assistant calling on behalf of ${context.slots.userName || "your client"}`;
};

// Parse AI response for extracted information and call status
const parseAIResponse = (
  aiResponse: string,
  context: ConversationContext
): {
  response: string;
  extractedSlots: Partial<ConversationSlots>;
  shouldEndCall: boolean;
  outcome?: {
    success: boolean;
    summary: string;
    appointmentBooked?: {
      date: string;
      time: string;
      confirmationNumber?: string;
    };
  };
} => {
  let response = aiResponse;
  let shouldEndCall = false;
  const extractedSlots: Partial<ConversationSlots> = {};
  let outcome:
    | {
        success: boolean;
        summary: string;
        appointmentBooked?: {
          date: string;
          time: string;
          confirmationNumber?: string;
        };
      }
    | undefined;

  // Check for call completion marker
  if (response.includes("[CALL_COMPLETE]")) {
    shouldEndCall = true;
    response = response.replace("[CALL_COMPLETE]", "").trim();

    // Generate outcome based on conversation
    outcome = {
      success: true,
      summary: generateOutcomeSummary(context),
    };

    // Extract appointment details if applicable
    if (context.intentType === "AppointmentBooking") {
      const appointmentDetails = extractAppointmentDetails(context.conversationHistory);
      if (appointmentDetails) {
        outcome.appointmentBooked = appointmentDetails;
      }
    }
  }

  // Extract dates mentioned in conversation
  const datePattern =
    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi;
  const dates = response.match(datePattern);
  if (dates && dates.length > 0) {
    extractedSlots.preferredDate = dates[0];
  }

  // Extract times mentioned
  const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/g;
  const times = response.match(timePattern);
  if (times && times.length > 0) {
    extractedSlots.preferredTime = times[0];
  }

  // Extract confirmation numbers
  const confirmPattern = /(?:confirmation|reference|booking)\s*(?:number|#|:)?\s*([A-Z0-9-]+)/i;
  const confirmMatch = response.match(confirmPattern);
  if (confirmMatch && confirmMatch[1]) {
    // Store in context for outcome
    console.log(`Extracted confirmation number: ${confirmMatch[1]}`);
  }

  return {
    response,
    extractedSlots,
    shouldEndCall,
    outcome,
  };
};

// Generate outcome summary from conversation
const generateOutcomeSummary = (context: ConversationContext): string => {
  const lastMessages = context.conversationHistory.slice(-4);
  const summary = lastMessages
    .map((m) => `${m.role === "user" ? "Them" : "Quinn"}: ${m.content}`)
    .join("\n");

  return `Call completed. ${context.intentType} conversation summary:\n${summary}`;
};

// Extract appointment details from conversation history
const extractAppointmentDetails = (
  history: Array<{ role: string; content: string }>
): { date: string; time: string; confirmationNumber?: string } | null => {
  const fullConversation = history.map((m) => m.content).join(" ");

  // Try to extract date
  const datePattern =
    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi;
  const dates = fullConversation.match(datePattern);

  // Try to extract time
  const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/g;
  const times = fullConversation.match(timePattern);

  // Try to extract confirmation number
  const confirmPattern = /(?:confirmation|reference|booking)\s*(?:number|#|:)?\s*([A-Z0-9-]+)/i;
  const confirmMatch = fullConversation.match(confirmPattern);

  if (dates && dates.length > 0 && times && times.length > 0) {
    return {
      date: dates[dates.length - 1] || "",
      time: times[times.length - 1] || "",
      confirmationNumber: confirmMatch?.[1],
    };
  }

  return null;
};

// Lex fulfillment handler - called by Lambda when Lex needs to process an intent
export const handleLexFulfillment = async (event: {
  sessionState: {
    intent: {
      name: string;
      slots: Record<string, { value: { interpretedValue: string } }>;
    };
    sessionAttributes?: Record<string, string>;
  };
  inputTranscript: string;
  bot: {
    id: string;
    name: string;
    localeId: string;
  };
}): Promise<{
  sessionState: {
    dialogAction: {
      type: "Close" | "ElicitSlot" | "ElicitIntent" | "Delegate";
      slotToElicit?: string;
    };
    intent: {
      name: string;
      state: "Fulfilled" | "Failed" | "InProgress";
      slots: Record<string, unknown>;
    };
    sessionAttributes?: Record<string, string>;
  };
  messages?: Array<{
    contentType: "PlainText" | "SSML";
    content: string;
  }>;
}> => {
  const { sessionState, inputTranscript } = event;
  const intentName = sessionState.intent.name as IntentType;
  const sessionAttributes = sessionState.sessionAttributes || {};

  // Get or initialize conversation context from session
  let context: ConversationContext;
  if (sessionAttributes.conversationContext) {
    context = JSON.parse(sessionAttributes.conversationContext);
  } else {
    context = {
      userId: sessionAttributes.userId || "unknown",
      callId: sessionAttributes.callId || "unknown",
      intentType: intentName,
      slots: {},
      conversationHistory: [],
      callPurpose: sessionAttributes.callPurpose || "General inquiry",
      businessContext: sessionAttributes.businessName,
    };
  }

  // Extract slots from Lex
  const lexSlots = sessionState.intent.slots;
  for (const [key, value] of Object.entries(lexSlots)) {
    if (value?.value?.interpretedValue) {
      (context.slots as Record<string, string>)[key] = value.value.interpretedValue;
    }
  }

  // Process the conversation with AI
  const result = await processConversation(inputTranscript, context);

  // Update session attributes
  sessionAttributes.conversationContext = JSON.stringify({
    ...context,
    slots: result.updatedSlots,
  });

  if (result.outcome) {
    sessionAttributes.callOutcome = JSON.stringify(result.outcome);
  }

  // Determine dialog action
  const dialogAction: {
    type: "Close" | "ElicitSlot" | "ElicitIntent" | "Delegate";
    slotToElicit?: string;
  } = result.shouldEndCall ? { type: "Close" } : { type: "Delegate" };

  return {
    sessionState: {
      dialogAction,
      intent: {
        name: intentName,
        state: result.shouldEndCall ? "Fulfilled" : "InProgress",
        slots: sessionState.intent.slots,
      },
      sessionAttributes,
    },
    messages: [
      {
        contentType: "PlainText",
        content: result.response,
      },
    ],
  };
};

// Direct conversation handler - processes speech input and generates AI response
// This can be called from Amazon Connect contact flow via Lambda
export const handleVoiceConversation = async (
  speechInput: string,
  sessionAttributes: Record<string, string>
): Promise<{
  response: string;
  shouldEndCall: boolean;
  sessionAttributes: Record<string, string>;
}> => {
  // Get or initialize conversation context from session
  let context: ConversationContext;
  if (sessionAttributes.conversationContext) {
    context = JSON.parse(sessionAttributes.conversationContext);
  } else {
    context = {
      userId: sessionAttributes.userId || "unknown",
      callId: sessionAttributes.callId || "unknown",
      intentType: (sessionAttributes.intentType as IntentType) || "GeneralInquiry",
      slots: {
        userName: sessionAttributes.userName,
        preferredDate: sessionAttributes.preferredDate,
        businessName: sessionAttributes.businessName,
      },
      conversationHistory: [],
      callPurpose: sessionAttributes.callPurpose || "General inquiry",
      businessContext: sessionAttributes.businessName,
    };
  }

  // Process the conversation with AI
  const result = await processConversation(speechInput, context);

  // Update session attributes
  const updatedAttributes: Record<string, string> = {
    ...sessionAttributes,
    conversationContext: JSON.stringify({
      ...context,
      slots: result.updatedSlots,
      conversationHistory: context.conversationHistory,
    }),
  };

  if (result.outcome) {
    updatedAttributes.callOutcome = JSON.stringify(result.outcome);
  }

  return {
    response: result.response,
    shouldEndCall: result.shouldEndCall,
    sessionAttributes: updatedAttributes,
  };
};
