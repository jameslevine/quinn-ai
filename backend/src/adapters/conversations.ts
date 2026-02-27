import { v4 as uuidv4 } from "uuid";
import {
  dynamodb,
  TABLE_NAME,
  KEY_PREFIXES,
  GSI,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "./dynamodb";

// Types
export interface ChatMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: "email" | "call" | "payment" | "food" | "appointment" | "other";
  title: string;
  description: string;
  confidence: number;
  parameters?: Record<string, unknown>;
}

export interface Conversation {
  conversationId: string;
  userId: string;
  title?: string;
  summary?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface PaginatedConversations {
  conversations: Conversation[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface PaginatedMessages {
  messages: ChatMessage[];
  lastEvaluatedKey?: Record<string, unknown>;
}

// Create PK and SK for conversation
const createConversationPK = (userId: string) => `${KEY_PREFIXES.USER}${userId}`;
const createConversationSK = (conversationId: string) =>
  `${KEY_PREFIXES.CONVERSATION}${conversationId}`;
const createMessageSK = (conversationId: string, messageId: string) =>
  `${KEY_PREFIXES.CONVERSATION}${conversationId}#${KEY_PREFIXES.MESSAGE}${messageId}`;

// Create a new conversation
export const createDbConversation = async (
  userId: string,
  title?: string
): Promise<Conversation> => {
  const conversationId = uuidv4();
  const now = new Date().toISOString();

  const conversation: Conversation & { pk: string; sk: string; gsi1pk: string; gsi1sk: string } = {
    pk: createConversationPK(userId),
    sk: createConversationSK(conversationId),
    gsi1pk: `${KEY_PREFIXES.USER}${userId}#CONVERSATIONS`,
    gsi1sk: now,
    conversationId,
    userId,
    title: title || "New Conversation",
    messageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLE_NAME,
    Item: conversation,
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return {
      conversationId,
      userId,
      title: conversation.title,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

// Get conversation by ID
export const getDbConversationById = async (
  userId: string,
  conversationId: string
): Promise<Conversation | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createConversationPK(userId),
      sk: createConversationSK(conversationId),
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    if (!response.Item) return null;

    return {
      conversationId: response.Item.conversationId,
      userId: response.Item.userId,
      title: response.Item.title,
      summary: response.Item.summary,
      messageCount: response.Item.messageCount,
      createdAt: response.Item.createdAt,
      updatedAt: response.Item.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

// Get all conversations for a user
export const getDbConversationsByUserId = async (
  userId: string,
  limit: number = 20,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<PaginatedConversations> => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: GSI.GSI1,
    KeyConditionExpression: "gsi1pk = :gsi1pk",
    ExpressionAttributeValues: {
      ":gsi1pk": `${KEY_PREFIXES.USER}${userId}#CONVERSATIONS`,
    },
    ScanIndexForward: false, // Most recent first
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    const conversations = (response.Items || []).map((item) => ({
      conversationId: item.conversationId,
      userId: item.userId,
      title: item.title,
      summary: item.summary,
      messageCount: item.messageCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      conversations,
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

// Update conversation title
export const updateDbConversationTitle = async (
  userId: string,
  conversationId: string,
  title: string
): Promise<Conversation | null> => {
  const now = new Date().toISOString();

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createConversationPK(userId),
      sk: createConversationSK(conversationId),
    },
    UpdateExpression: "SET #title = :title, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#title": "title",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":title": title,
      ":updatedAt": now,
    },
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    if (!response.Attributes) return null;

    return {
      conversationId: response.Attributes.conversationId,
      userId: response.Attributes.userId,
      title: response.Attributes.title,
      summary: response.Attributes.summary,
      messageCount: response.Attributes.messageCount,
      createdAt: response.Attributes.createdAt,
      updatedAt: response.Attributes.updatedAt,
    };
  } catch (error) {
    console.error("Error updating conversation title:", error);
    throw error;
  }
};

// Update conversation summary
export const updateDbConversationSummary = async (
  userId: string,
  conversationId: string,
  summary: string
): Promise<void> => {
  const now = new Date().toISOString();

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createConversationPK(userId),
      sk: createConversationSK(conversationId),
    },
    UpdateExpression: "SET #summary = :summary, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#summary": "summary",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":summary": summary,
      ":updatedAt": now,
    },
  };

  try {
    await dynamodb.send(new UpdateCommand(params));
  } catch (error) {
    console.error("Error updating conversation summary:", error);
    throw error;
  }
};

// Delete conversation
export const deleteDbConversation = async (
  userId: string,
  conversationId: string
): Promise<void> => {
  // First, delete all messages in the conversation
  const messages = await getDbMessagesByConversationId(userId, conversationId, 1000);

  for (const message of messages.messages) {
    await deleteDbMessage(userId, conversationId, message.messageId);
  }

  // Then delete the conversation itself
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createConversationPK(userId),
      sk: createConversationSK(conversationId),
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

// Add message to conversation
export const addDbMessage = async (
  userId: string,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  suggestedActions?: SuggestedAction[]
): Promise<ChatMessage> => {
  const messageId = uuidv4();
  const now = new Date().toISOString();

  const message = {
    pk: createConversationPK(userId),
    sk: createMessageSK(conversationId, messageId),
    gsi1pk: `${KEY_PREFIXES.CONVERSATION}${conversationId}#MESSAGES`,
    gsi1sk: now,
    messageId,
    conversationId,
    userId,
    role,
    content,
    timestamp: now,
    ...(suggestedActions && suggestedActions.length > 0 && { suggestedActions }),
  };

  const params = {
    TableName: TABLE_NAME,
    Item: message,
  };

  try {
    await dynamodb.send(new PutCommand(params));

    // Update conversation message count and updatedAt
    await incrementDbConversationMessageCount(userId, conversationId);

    return {
      messageId,
      role,
      content,
      timestamp: now,
      suggestedActions,
    };
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

// Increment conversation message count
const incrementDbConversationMessageCount = async (
  userId: string,
  conversationId: string
): Promise<void> => {
  const now = new Date().toISOString();

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createConversationPK(userId),
      sk: createConversationSK(conversationId),
    },
    UpdateExpression:
      "SET #messageCount = if_not_exists(#messageCount, :zero) + :inc, #updatedAt = :updatedAt, gsi1sk = :updatedAt",
    ExpressionAttributeNames: {
      "#messageCount": "messageCount",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":inc": 1,
      ":zero": 0,
      ":updatedAt": now,
    },
  };

  try {
    await dynamodb.send(new UpdateCommand(params));
  } catch (error) {
    console.error("Error incrementing message count:", error);
    // Don't throw - this is a non-critical update
  }
};

// Get messages for a conversation
export const getDbMessagesByConversationId = async (
  _userId: string,
  conversationId: string,
  limit: number = 50,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<PaginatedMessages> => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: GSI.GSI1,
    KeyConditionExpression: "gsi1pk = :gsi1pk",
    ExpressionAttributeValues: {
      ":gsi1pk": `${KEY_PREFIXES.CONVERSATION}${conversationId}#MESSAGES`,
    },
    ScanIndexForward: true, // Oldest first for chat history
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    const messages = (response.Items || []).map((item) => ({
      messageId: item.messageId,
      role: item.role as "user" | "assistant",
      content: item.content,
      timestamp: item.timestamp,
      suggestedActions: item.suggestedActions,
    }));

    return {
      messages,
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

// Get recent messages for context (most recent first, then reversed)
export const getDbRecentMessages = async (
  _userId: string,
  conversationId: string,
  limit: number = 10
): Promise<ChatMessage[]> => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: GSI.GSI1,
    KeyConditionExpression: "gsi1pk = :gsi1pk",
    ExpressionAttributeValues: {
      ":gsi1pk": `${KEY_PREFIXES.CONVERSATION}${conversationId}#MESSAGES`,
    },
    ScanIndexForward: false, // Most recent first
    Limit: limit,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    const messages = (response.Items || [])
      .map((item) => ({
        messageId: item.messageId,
        role: item.role as "user" | "assistant",
        content: item.content,
        timestamp: item.timestamp,
        suggestedActions: item.suggestedActions,
      }))
      .reverse(); // Reverse to get chronological order

    return messages;
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    throw error;
  }
};

// Delete a message
const deleteDbMessage = async (
  userId: string,
  conversationId: string,
  messageId: string
): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createConversationPK(userId),
      sk: createMessageSK(conversationId, messageId),
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};

// Get conversation with messages
export const getDbConversationWithMessages = async (
  userId: string,
  conversationId: string,
  messageLimit: number = 50
): Promise<ConversationWithMessages | null> => {
  const conversation = await getDbConversationById(userId, conversationId);
  if (!conversation) return null;

  const { messages } = await getDbMessagesByConversationId(userId, conversationId, messageLimit);

  return {
    ...conversation,
    messages,
  };
};
