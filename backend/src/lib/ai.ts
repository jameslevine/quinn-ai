import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "eu-west-2",
});

// Model IDs
const CLAUDE_SONNET_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0";
const CLAUDE_HAIKU_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

// Types
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: "sonnet" | "haiku";
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface SuggestedAction {
  type: "email" | "call" | "payment" | "food" | "appointment" | "other";
  title: string;
  description: string;
  confidence: number;
  parameters: Record<string, unknown>;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  tone?: string;
}

export interface UserContext {
  userId: string;
  name?: string;
  email?: string;
  preferences?: Record<string, unknown>;
  recentActions?: Array<{
    type: string;
    title: string;
    status: string;
  }>;
}

// Default system prompt for Quinn
const QUINN_SYSTEM_PROMPT = `You are Quinn, an intelligent AI personal assistant. You help users manage their daily tasks, emails, appointments, finances, and more.

Your capabilities include:
- Managing and creating actions/tasks
- Drafting and sending emails
- Scheduling appointments
- Tracking finances and budgets
- Ordering food
- Managing life admin tasks

Guidelines:
- Be helpful, concise, and friendly
- Ask clarifying questions when needed
- Suggest relevant actions based on the conversation
- Always confirm before taking actions that have real-world effects
- Respect user privacy and security

When you want to suggest creating an action, format it as:
[ACTION_SUGGESTION]
{
  "type": "email|call|payment|food|appointment|other",
  "title": "Short title",
  "description": "What needs to be done",
  "confidence": 0.0-1.0
}
[/ACTION_SUGGESTION]

When you want to draft an email, format it as:
[EMAIL_DRAFT]
{
  "to": "recipient@email.com",
  "subject": "Email subject",
  "body": "Email body content",
  "tone": "formal|casual|friendly|professional"
}
[/EMAIL_DRAFT]`;

// Function calling prompt addition
const FUNCTION_CALLING_PROMPT = `

You have access to the following functions. When appropriate, use them by outputting the function call in the specified format:

1. create_action - Create a new action/task for the user
   Parameters: type (email|call|payment|food|appointment|other), title, description, details?, amount?, currency?
   
2. draft_email - Draft an email for the user
   Parameters: to, subject, body, tone (formal|casual|friendly|professional)?

3. suggest_actions - Suggest relevant actions based on the conversation
   Parameters: actions (array of {type, title, description, confidence, parameters})

To call a function, output:
[FUNCTION_CALL]
{
  "name": "function_name",
  "arguments": { ... }
}
[/FUNCTION_CALL]`;

// Get model ID based on option
const getModelId = (model: "sonnet" | "haiku" = "sonnet"): string => {
  return model === "haiku" ? CLAUDE_HAIKU_MODEL_ID : CLAUDE_SONNET_MODEL_ID;
};

// Format messages for Claude API
const formatMessagesForClaude = (messages: Message[]): Array<{ role: string; content: string }> => {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};

// Parse function calls from response
export const parseFunctionCall = (response: string): FunctionCall | null => {
  const functionCallMatch = response.match(/\[FUNCTION_CALL\]([\s\S]*?)\[\/FUNCTION_CALL\]/);
  if (functionCallMatch && functionCallMatch[1]) {
    try {
      const parsed = JSON.parse(functionCallMatch[1].trim());
      return {
        name: parsed.name,
        arguments: parsed.arguments,
      };
    } catch {
      return null;
    }
  }
  return null;
};

// Parse action suggestions from response
export const parseActionSuggestions = (response: string): SuggestedAction[] => {
  const suggestions: SuggestedAction[] = [];
  const regex = /\[ACTION_SUGGESTION\]([\s\S]*?)\[\/ACTION_SUGGESTION\]/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    try {
      if (!match[1]) continue;
      const parsed = JSON.parse(match[1].trim());
      suggestions.push({
        type: parsed.type,
        title: parsed.title,
        description: parsed.description,
        confidence: parsed.confidence || 0.8,
        parameters: parsed.parameters || {},
      });
    } catch {
      // Skip invalid JSON
    }
  }

  return suggestions;
};

// Parse email draft from response
export const parseEmailDraft = (response: string): EmailDraft | null => {
  const emailMatch = response.match(/\[EMAIL_DRAFT\]([\s\S]*?)\[\/EMAIL_DRAFT\]/);
  if (emailMatch && emailMatch[1]) {
    try {
      const parsed = JSON.parse(emailMatch[1].trim());
      return {
        to: parsed.to,
        subject: parsed.subject,
        body: parsed.body,
        tone: parsed.tone,
      };
    } catch {
      return null;
    }
  }
  return null;
};

// Clean response by removing function call markers
export const cleanResponse = (response: string): string => {
  return response
    .replace(/\[FUNCTION_CALL\][\s\S]*?\[\/FUNCTION_CALL\]/g, "")
    .replace(/\[ACTION_SUGGESTION\][\s\S]*?\[\/ACTION_SUGGESTION\]/g, "")
    .replace(/\[EMAIL_DRAFT\][\s\S]*?\[\/EMAIL_DRAFT\]/g, "")
    .trim();
};

// Chat completion using Bedrock
export const chat = async (
  messages: Message[],
  options: ChatOptions = {}
): Promise<{ content: string; functionCall?: FunctionCall; suggestions?: SuggestedAction[] }> => {
  const {
    model = "sonnet",
    temperature = 0.7,
    maxTokens = 1024,
    systemPrompt = QUINN_SYSTEM_PROMPT,
  } = options;

  const modelId = getModelId(model);
  const formattedMessages = formatMessagesForClaude(messages);

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: formattedMessages,
  };

  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const content = responseBody.content[0]?.text || "";
    const functionCall = parseFunctionCall(content);
    const suggestions = parseActionSuggestions(content);

    return {
      content: cleanResponse(content),
      functionCall: functionCall || undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  } catch (error) {
    console.error("Error in Bedrock chat completion:", error);
    throw error;
  }
};

// Chat with function calling enabled
export const chatWithFunctions = async (
  messages: Message[],
  options: ChatOptions = {}
): Promise<{ content: string; functionCall?: FunctionCall; suggestions?: SuggestedAction[] }> => {
  const systemPrompt = (options.systemPrompt || QUINN_SYSTEM_PROMPT) + FUNCTION_CALLING_PROMPT;

  return chat(messages, {
    ...options,
    systemPrompt,
  });
};

// Streaming chat using Bedrock
export async function* streamChat(
  messages: Message[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = "sonnet",
    temperature = 0.7,
    maxTokens = 1024,
    systemPrompt = QUINN_SYSTEM_PROMPT,
  } = options;

  const modelId = getModelId(model);
  const formattedMessages = formatMessagesForClaude(messages);

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: formattedMessages,
  };

  try {
    const command = new InvokeModelWithResponseStreamCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
          if (chunk.type === "content_block_delta" && chunk.delta?.text) {
            yield chunk.delta.text;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in Bedrock streaming chat:", error);
    throw error;
  }
}

// Generate email draft
export const generateEmailDraft = async (
  prompt: string,
  context?: UserContext,
  options: ChatOptions = {}
): Promise<EmailDraft> => {
  const systemPrompt = `You are Quinn, an AI assistant helping to draft emails. 
${context?.name ? `The user's name is ${context.name}.` : ""}
${context?.email ? `The user's email is ${context.email}.` : ""}

When drafting emails:
- Match the requested tone
- Be clear and professional
- Keep it concise unless asked otherwise

Always respond with an email draft in this exact format:
[EMAIL_DRAFT]
{
  "to": "recipient@email.com",
  "subject": "Email subject",
  "body": "Email body content",
  "tone": "formal|casual|friendly|professional"
}
[/EMAIL_DRAFT]`;

  const messages: Message[] = [{ role: "user", content: prompt }];

  const response = await chat(messages, {
    ...options,
    systemPrompt,
    model: "haiku", // Use faster model for drafts
  });

  const draft = parseEmailDraft(response.content);
  if (!draft) {
    // If parsing failed, try to extract from plain response
    return {
      to: "",
      subject: "Draft Email",
      body: response.content,
      tone: "professional",
    };
  }

  return draft;
};

// Generate email reply
export const generateEmailReply = async (
  originalEmail: { from: string; subject: string; body: string },
  instructions: string,
  context?: UserContext,
  options: ChatOptions = {}
): Promise<EmailDraft> => {
  const prompt = `Please draft a reply to this email:

From: ${originalEmail.from}
Subject: ${originalEmail.subject}
Body:
${originalEmail.body}

Instructions for the reply: ${instructions}`;

  return generateEmailDraft(prompt, context, options);
};

// Suggest actions based on conversation
export const suggestActions = async (
  conversationHistory: Message[],
  options: ChatOptions = {}
): Promise<SuggestedAction[]> => {
  const systemPrompt = `You are Quinn, an AI assistant. Based on the conversation, suggest relevant actions the user might want to take.

For each suggestion, output:
[ACTION_SUGGESTION]
{
  "type": "email|call|payment|food|appointment|other",
  "title": "Short descriptive title",
  "description": "What this action will do",
  "confidence": 0.0-1.0 (how confident you are this is relevant),
  "parameters": {} (any relevant parameters)
}
[/ACTION_SUGGESTION]

Only suggest actions that are clearly relevant to the conversation. Provide 1-3 suggestions maximum.`;

  const messages: Message[] = [
    ...conversationHistory,
    {
      role: "user",
      content: "Based on our conversation, what actions would you suggest I take?",
    },
  ];

  const response = await chat(messages, {
    ...options,
    systemPrompt,
    model: "haiku", // Use faster model for suggestions
  });

  return response.suggestions || [];
};

// Create action from natural language
export const createActionFromNL = async (
  request: string,
  options: ChatOptions = {}
): Promise<{
  type: string;
  title: string;
  description: string;
  details?: string;
  amount?: number;
  currency?: string;
}> => {
  const systemPrompt = `You are Quinn, an AI assistant. Convert the user's natural language request into a structured action.

Respond with ONLY a JSON object in this format:
{
  "type": "email|call|payment|food|appointment|other",
  "title": "Short title for the action",
  "description": "Detailed description of what needs to be done",
  "details": "Additional context if needed",
  "amount": null or number if this involves money,
  "currency": "GBP" or other currency code if amount is set
}`;

  const messages: Message[] = [{ role: "user", content: request }];

  const response = await chat(messages, {
    ...options,
    systemPrompt,
    model: "haiku",
    temperature: 0.3, // Lower temperature for more consistent parsing
  });

  try {
    // Try to parse the response as JSON
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If parsing fails, create a basic action
  }

  return {
    type: "other",
    title: request.slice(0, 50),
    description: request,
  };
};

// Build context for conversation
export const buildConversationContext = (
  userContext: UserContext,
  _recentMessages: Message[] = []
): string => {
  let context = QUINN_SYSTEM_PROMPT;

  if (userContext.name) {
    context += `\n\nUser Information:
- Name: ${userContext.name}
- Email: ${userContext.email || "Not provided"}`;
  }

  if (userContext.preferences && Object.keys(userContext.preferences).length > 0) {
    context += `\n- Preferences: ${JSON.stringify(userContext.preferences)}`;
  }

  if (userContext.recentActions && userContext.recentActions.length > 0) {
    context += `\n\nRecent Actions:`;
    userContext.recentActions.slice(0, 5).forEach((action) => {
      context += `\n- ${action.title} (${action.type}) - ${action.status}`;
    });
  }

  return context;
};
