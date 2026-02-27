import { Router, Request, Response } from "express";
import Joi from "joi";
import {
  suggestActions,
  createActionFromNL,
  generateEmailDraft,
  generateEmailReply,
  Message,
  UserContext,
} from "../lib/ai";
import { createDbAction } from "../adapters/actions";
import { getDbUserById } from "../adapters/users";
import { getDbActionsByUserId } from "../adapters/actions";
import { validateBody } from "../middleware/validation";

export const router: Router = Router();

// Validation schemas
const suggestActionsSchema = Joi.object({
  conversationHistory: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid("user", "assistant").required(),
        content: Joi.string().required(),
      })
    )
    .min(1)
    .required(),
});

const createActionNLSchema = Joi.object({
  request: Joi.string().max(1000).required(),
  autoCreate: Joi.boolean().optional().default(false),
});

const draftEmailSchema = Joi.object({
  prompt: Joi.string().max(2000).required(),
  tone: Joi.string().valid("formal", "casual", "friendly", "professional").optional(),
});

const replyEmailSchema = Joi.object({
  originalEmail: Joi.object({
    from: Joi.string().required(),
    subject: Joi.string().required(),
    body: Joi.string().required(),
  }).required(),
  instructions: Joi.string().max(1000).required(),
  tone: Joi.string().valid("formal", "casual", "friendly", "professional").optional(),
});

const improveEmailSchema = Joi.object({
  draft: Joi.object({
    to: Joi.string().required(),
    subject: Joi.string().required(),
    body: Joi.string().required(),
  }).required(),
  feedback: Joi.string().max(500).required(),
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

// Suggest actions based on conversation
router.post(
  "/suggest-actions",
  validateBody(suggestActionsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationHistory } = req.body;

      const messages: Message[] = conversationHistory.map(
        (m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role,
          content: m.content,
        })
      );

      const suggestions = await suggestActions(messages);

      res.json({ suggestions });
    } catch (error) {
      console.error("Error suggesting actions:", error);
      res.status(500).json({ message: "Error suggesting actions" });
    }
  }
);

// Create action from natural language
router.post(
  "/create-action",
  validateBody(createActionNLSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { request, autoCreate } = req.body;

      // Parse the natural language request
      const parsedAction = await createActionFromNL(request);

      // If autoCreate is true, create the action immediately
      if (autoCreate) {
        const action = await createDbAction(
          userId,
          parsedAction.type as "email" | "call" | "payment" | "food" | "appointment" | "other",
          parsedAction.title,
          parsedAction.description,
          parsedAction.details,
          parsedAction.amount,
          parsedAction.currency
        );

        return res.status(201).json({
          action,
          parsed: parsedAction,
        });
      }

      // Otherwise, return the parsed action for user confirmation
      res.json({
        parsed: parsedAction,
        message: "Action parsed successfully. Set autoCreate=true to create immediately.",
      });
    } catch (error) {
      console.error("Error creating action from NL:", error);
      res.status(500).json({ message: "Error processing request" });
    }
  }
);

// Generate email draft
router.post("/email/draft", validateBody(draftEmailSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { prompt, tone } = req.body;

    // Get user context
    const userContext = await getUserContext(userId);

    // Generate draft
    const draft = await generateEmailDraft(
      tone ? `${prompt}\n\nTone: ${tone}` : prompt,
      userContext
    );

    res.json({ draft });
  } catch (error) {
    console.error("Error generating email draft:", error);
    res.status(500).json({ message: "Error generating email draft" });
  }
});

// Generate email reply
router.post("/email/reply", validateBody(replyEmailSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { originalEmail, instructions, tone } = req.body;

    // Get user context
    const userContext = await getUserContext(userId);

    // Generate reply
    const draft = await generateEmailReply(
      originalEmail,
      tone ? `${instructions}\n\nTone: ${tone}` : instructions,
      userContext
    );

    res.json({ draft });
  } catch (error) {
    console.error("Error generating email reply:", error);
    res.status(500).json({ message: "Error generating email reply" });
  }
});

// Improve email draft
router.post(
  "/email/improve",
  validateBody(improveEmailSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { draft, feedback } = req.body;

      // Get user context
      const userContext = await getUserContext(userId);

      // Generate improved draft
      const prompt = `Please improve this email draft based on the feedback:

Current Draft:
To: ${draft.to}
Subject: ${draft.subject}
Body:
${draft.body}

Feedback: ${feedback}

Please provide an improved version.`;

      const improvedDraft = await generateEmailDraft(prompt, userContext);

      // Keep the original recipient if not changed
      if (!improvedDraft.to) {
        improvedDraft.to = draft.to;
      }

      res.json({ draft: improvedDraft });
    } catch (error) {
      console.error("Error improving email draft:", error);
      res.status(500).json({ message: "Error improving email draft" });
    }
  }
);
