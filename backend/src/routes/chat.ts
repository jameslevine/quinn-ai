import { Router, Request, Response } from "express";
import Joi from "joi";
import {
  createDbConversation,
  getDbConversationById,
  getDbConversationsByUserId,
  getDbConversationWithMessages,
  updateDbConversationTitle,
  deleteDbConversation,
  addDbMessage,
  getDbMessagesByConversationId,
  getDbRecentMessages,
  SuggestedAction,
} from "../adapters/conversations";
import { getDbUserById } from "../adapters/users";
import { getDbActionsByUserId } from "../adapters/actions";
import { chat, chatWithFunctions, buildConversationContext, Message, UserContext } from "../lib/ai";
import { validateBody, validateParams, validateQuery } from "../middleware/validation";

export const router: Router = Router();

// Validation schemas
const createConversationSchema = Joi.object({
  title: Joi.string().max(100).optional(),
  message: Joi.string().max(10000).optional(),
});

const conversationIdParamsSchema = Joi.object({
  conversationId: Joi.string().uuid().required(),
});

const sendMessageSchema = Joi.object({
  content: Joi.string().max(10000).required(),
});

const updateTitleSchema = Joi.object({
  title: Joi.string().max(100).required(),
});

const paginationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  cursor: Joi.string().optional(),
});

// Helper to get user context for AI
const getUserContext = async (userId: string): Promise<UserContext> => {
  const user = await getDbUserById(userId);
  const { actions } = await getDbActionsByUserId(userId, 5);

  return {
    userId,
    name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : undefined,
    email: user?.email,
    preferences: user?.settings ? { settings: user.settings } : undefined,
    recentActions: actions.map((a) => ({
      type: a.type,
      title: a.title,
      status: a.status,
    })),
  };
};

// Helper to convert AI suggestions to conversation suggestions
const convertSuggestions = (
  suggestions?: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
    parameters: Record<string, unknown>;
  }>
): SuggestedAction[] | undefined => {
  if (!suggestions || suggestions.length === 0) return undefined;
  return suggestions.map((s) => ({
    type: s.type as SuggestedAction["type"],
    title: s.title,
    description: s.description,
    confidence: s.confidence,
    parameters: s.parameters,
  }));
};

// Create a new conversation
router.post(
  "/conversations",
  validateBody(createConversationSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { title, message } = req.body;

      // Create the conversation
      const conversation = await createDbConversation(userId, title);

      // If an initial message was provided, process it
      if (message) {
        // Add user message
        const userMessage = await addDbMessage(
          userId,
          conversation.conversationId,
          "user",
          message
        );

        // Get user context for AI
        const userContext = await getUserContext(userId);
        const systemPrompt = buildConversationContext(userContext);

        // Get AI response
        const messages: Message[] = [{ role: "user", content: message }];
        const aiResponse = await chatWithFunctions(messages, { systemPrompt });

        // Add AI response
        const assistantMessage = await addDbMessage(
          userId,
          conversation.conversationId,
          "assistant",
          aiResponse.content,
          convertSuggestions(aiResponse.suggestions)
        );

        return res.status(201).json({
          conversation,
          messages: [userMessage, assistantMessage],
        });
      }

      res.status(201).json({ conversation, messages: [] });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Error creating conversation" });
    }
  }
);

// List all conversations for user
router.get(
  "/conversations",
  validateQuery(paginationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const cursor = req.query.cursor as string | undefined;
      const lastEvaluatedKey = cursor
        ? JSON.parse(Buffer.from(cursor, "base64").toString())
        : undefined;

      const result = await getDbConversationsByUserId(userId, limit, lastEvaluatedKey);

      const nextCursor = result.lastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString("base64")
        : undefined;

      res.json({
        conversations: result.conversations,
        nextCursor,
      });
    } catch (error) {
      console.error("Error listing conversations:", error);
      res.status(500).json({ message: "Error listing conversations" });
    }
  }
);

// Get a specific conversation with messages
router.get(
  "/conversations/:conversationId",
  validateParams(conversationIdParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({ message: "Conversation ID required" });
      }
      const conversation = await getDbConversationWithMessages(userId, conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Error fetching conversation" });
    }
  }
);

// Update conversation title
router.patch(
  "/conversations/:conversationId",
  validateParams(conversationIdParamsSchema),
  validateBody(updateTitleSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({ message: "Conversation ID required" });
      }
      const { title } = req.body;

      const conversation = await updateDbConversationTitle(userId, conversationId, title);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Error updating conversation" });
    }
  }
);

// Delete a conversation
router.delete(
  "/conversations/:conversationId",
  validateParams(conversationIdParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({ message: "Conversation ID required" });
      }

      // Check if conversation exists
      const conversation = await getDbConversationById(userId, conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      await deleteDbConversation(userId, conversationId);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Error deleting conversation" });
    }
  }
);

// Send a message to a conversation
router.post(
  "/conversations/:conversationId/messages",
  validateParams(conversationIdParamsSchema),
  validateBody(sendMessageSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({ message: "Conversation ID required" });
      }
      const { content } = req.body;

      // Check if conversation exists
      const conversation = await getDbConversationById(userId, conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Add user message
      const userMessage = await addDbMessage(userId, conversationId, "user", content);

      // Get recent messages for context
      const recentMessages = await getDbRecentMessages(userId, conversationId, 10);

      // Get user context for AI
      const userContext = await getUserContext(userId);
      const systemPrompt = buildConversationContext(userContext, recentMessages);

      // Build messages array for AI
      const messages: Message[] = recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Get AI response
      const aiResponse = await chatWithFunctions(messages, { systemPrompt });

      // Add AI response
      const assistantMessage = await addDbMessage(
        userId,
        conversationId,
        "assistant",
        aiResponse.content,
        convertSuggestions(aiResponse.suggestions)
      );

      res.status(201).json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message" });
    }
  }
);

// Get messages for a conversation (with pagination)
router.get(
  "/conversations/:conversationId/messages",
  validateParams(conversationIdParamsSchema),
  validateQuery(paginationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({ message: "Conversation ID required" });
      }
      const limit = parseInt(req.query.limit as string) || 50;
      const cursor = req.query.cursor as string | undefined;
      const lastEvaluatedKey = cursor
        ? JSON.parse(Buffer.from(cursor, "base64").toString())
        : undefined;

      // Check if conversation exists
      const conversation = await getDbConversationById(userId, conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const result = await getDbMessagesByConversationId(
        userId,
        conversationId,
        limit,
        lastEvaluatedKey
      );

      const nextCursor = result.lastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString("base64")
        : undefined;

      res.json({
        messages: result.messages,
        nextCursor,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Error fetching messages" });
    }
  }
);

// Quick chat endpoint (no conversation persistence)
router.post("/quick", validateBody(sendMessageSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content } = req.body;

    // Get user context for AI
    const userContext = await getUserContext(userId);
    const systemPrompt = buildConversationContext(userContext);

    // Get AI response
    const messages: Message[] = [{ role: "user", content }];
    const aiResponse = await chat(messages, { systemPrompt });

    res.json({
      response: aiResponse.content,
      suggestions: aiResponse.suggestions,
    });
  } catch (error) {
    console.error("Error in quick chat:", error);
    res.status(500).json({ message: "Error processing message" });
  }
});
