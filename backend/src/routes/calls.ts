import { Router, Request, Response } from "express";
import Joi from "joi";
import {
  createDbCall,
  getDbCallById,
  getDbCallsByUserId,
  updateDbCallStatus,
  updateDbCallOutcome,
  deleteDbCall,
  getDbPendingCalls,
  type CallOutcome,
} from "../adapters/calls";
import {
  makeCall,
  getCallStatus,
  endCall,
  synthesizeSpeech,
  createScriptFromTemplate,
  SCRIPT_TEMPLATES,
  AVAILABLE_VOICES,
  CallType,
} from "../lib/connect";
import { validateBody, validateParams, validateQuery } from "../middleware/validation";

export const router: Router = Router();

// Validation schemas
const createCallSchema = Joi.object({
  to: Joi.string().required(),
  purpose: Joi.string().required(),
  scriptType: Joi.string()
    .valid(
      "appointment_booking",
      "customer_service",
      "bill_negotiation",
      "order_followup",
      "general_inquiry"
    )
    .required(),
  variables: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  scheduledAt: Joi.string().isoDate().optional(),
  notes: Joi.string().max(1000).optional(),
});

const callIdParamsSchema = Joi.object({
  callId: Joi.string().uuid().required(),
});

const approveCallSchema = Joi.object({
  approved: Joi.boolean().required(),
});

const updateOutcomeSchema = Joi.object({
  success: Joi.boolean().required(),
  summary: Joi.string().required(),
  appointmentBooked: Joi.object({
    date: Joi.string().required(),
    time: Joi.string().required(),
    confirmationNumber: Joi.string().optional(),
  }).optional(),
  followUpRequired: Joi.boolean().required(),
  followUpNotes: Joi.string().optional(),
});

const paginationQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
  cursor: Joi.string().optional(),
});

const synthesizeSpeechSchema = Joi.object({
  text: Joi.string().max(3000).required(),
  voice: Joi.string().optional(),
});

// Create a new call request
router.post("/", validateBody(createCallSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { to, purpose, scriptType, variables, scheduledAt, notes } = req.body;

    // Create script from template with variables
    const script = createScriptFromTemplate(scriptType as CallType, variables || {});

    const call = await createDbCall(userId, {
      to,
      purpose,
      scriptType,
      script,
      scheduledAt,
      notes,
    });

    res.status(201).json(call);
  } catch (error) {
    console.error("Error creating call:", error);
    res.status(500).json({ message: "Error creating call" });
  }
});

// List all calls for user
router.get("/", validateQuery(paginationQuerySchema), async (req: Request, res: Response) => {
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

    const result = await getDbCallsByUserId(userId, limit, lastEvaluatedKey);

    const nextCursor = result.lastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString("base64")
      : undefined;

    res.json({
      calls: result.calls,
      nextCursor,
    });
  } catch (error) {
    console.error("Error listing calls:", error);
    res.status(500).json({ message: "Error listing calls" });
  }
});

// Get pending calls (for approval)
router.get("/pending", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const calls = await getDbPendingCalls(userId);
    res.json({ calls });
  } catch (error) {
    console.error("Error fetching pending calls:", error);
    res.status(500).json({ message: "Error fetching pending calls" });
  }
});

// Get a specific call
router.get("/:callId", validateParams(callIdParamsSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { callId } = req.params;
    if (!callId) {
      return res.status(400).json({ message: "Call ID required" });
    }

    const call = await getDbCallById(userId, callId);
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    res.json(call);
  } catch (error) {
    console.error("Error fetching call:", error);
    res.status(500).json({ message: "Error fetching call" });
  }
});

// Approve or reject a call
router.post(
  "/:callId/approve",
  validateParams(callIdParamsSchema),
  validateBody(approveCallSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { callId } = req.params;
      if (!callId) {
        return res.status(400).json({ message: "Call ID required" });
      }
      const { approved } = req.body;

      const call = await getDbCallById(userId, callId);
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }

      if (call.status !== "pending") {
        return res.status(400).json({ message: "Call is not pending approval" });
      }

      if (approved) {
        // Update status to approved
        const updatedCall = await updateDbCallStatus(userId, callId, "approved");

        // Initiate the call via AWS Connect
        try {
          const callResult = await makeCall({
            to: call.to,
            script: call.script,
          });

          // Update with contact ID and in_progress status
          await updateDbCallStatus(userId, callId, "in_progress", callResult.contactId, "queued");

          res.json({
            ...updatedCall,
            contactId: callResult.contactId,
            status: "in_progress",
          });
        } catch (callError) {
          console.error("Error initiating call:", callError);
          await updateDbCallStatus(userId, callId, "failed");
          res.status(500).json({ message: "Failed to initiate call" });
        }
      } else {
        // Reject the call
        const updatedCall = await updateDbCallStatus(userId, callId, "cancelled");
        res.json(updatedCall);
      }
    } catch (error) {
      console.error("Error approving call:", error);
      res.status(500).json({ message: "Error approving call" });
    }
  }
);

// End a call
router.post(
  "/:callId/end",
  validateParams(callIdParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { callId } = req.params;
      if (!callId) {
        return res.status(400).json({ message: "Call ID required" });
      }

      const call = await getDbCallById(userId, callId);
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }

      if (!call.contactId) {
        return res.status(400).json({ message: "Call has no active contact" });
      }

      // End the call via AWS Connect
      await endCall(call.contactId);

      // Update status
      const updatedCall = await updateDbCallStatus(userId, callId, "completed");

      res.json(updatedCall);
    } catch (error) {
      console.error("Error ending call:", error);
      res.status(500).json({ message: "Error ending call" });
    }
  }
);

// Get call status (refresh from AWS Connect)
router.get(
  "/:callId/status",
  validateParams(callIdParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { callId } = req.params;
      if (!callId) {
        return res.status(400).json({ message: "Call ID required" });
      }

      const call = await getDbCallById(userId, callId);
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }

      if (!call.contactId) {
        return res.json({ status: call.status });
      }

      // Get status from AWS Connect
      const connectStatus = await getCallStatus(call.contactId);

      // Update local status if changed
      if (connectStatus.status !== call.connectStatus) {
        let newStatus = call.status;
        if (connectStatus.status === "completed") {
          newStatus = "completed";
        } else if (connectStatus.status === "failed" || connectStatus.status === "no-answer") {
          newStatus = "failed";
        }

        await updateDbCallStatus(userId, callId, newStatus, undefined, connectStatus.status);
      }

      res.json({
        status: call.status,
        connectStatus: connectStatus.status,
      });
    } catch (error) {
      console.error("Error fetching call status:", error);
      res.status(500).json({ message: "Error fetching call status" });
    }
  }
);

// Update call outcome
router.patch(
  "/:callId/outcome",
  validateParams(callIdParamsSchema),
  validateBody(updateOutcomeSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { callId } = req.params;
      if (!callId) {
        return res.status(400).json({ message: "Call ID required" });
      }

      const call = await getDbCallById(userId, callId);
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }

      const outcome: CallOutcome = req.body;
      await updateDbCallOutcome(userId, callId, outcome);

      res.json({ message: "Outcome updated" });
    } catch (error) {
      console.error("Error updating call outcome:", error);
      res.status(500).json({ message: "Error updating call outcome" });
    }
  }
);

// Delete a call
router.delete(
  "/:callId",
  validateParams(callIdParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { callId } = req.params;
      if (!callId) {
        return res.status(400).json({ message: "Call ID required" });
      }

      const call = await getDbCallById(userId, callId);
      if (!call) {
        return res.status(404).json({ message: "Call not found" });
      }

      // Only allow deleting pending or completed calls
      if (call.status === "in_progress") {
        return res.status(400).json({ message: "Cannot delete an in-progress call" });
      }

      await deleteDbCall(userId, callId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting call:", error);
      res.status(500).json({ message: "Error deleting call" });
    }
  }
);

// Get available script templates
router.get("/scripts/templates", async (_req: Request, res: Response) => {
  try {
    const templates = Object.entries(SCRIPT_TEMPLATES).map(([type, template]) => ({
      type,
      name: template.name,
      description: template.description,
      requiredVariables: extractRequiredVariables(template.steps),
    }));

    res.json({ templates });
  } catch (error) {
    console.error("Error fetching script templates:", error);
    res.status(500).json({ message: "Error fetching script templates" });
  }
});

// Get available voices
router.get("/voices", async (_req: Request, res: Response) => {
  try {
    res.json({ voices: AVAILABLE_VOICES });
  } catch (error) {
    console.error("Error fetching voices:", error);
    res.status(500).json({ message: "Error fetching voices" });
  }
});

// Preview speech synthesis
router.post(
  "/synthesize",
  validateBody(synthesizeSpeechSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { text, voice } = req.body;

      const result = await synthesizeSpeech({
        text,
        voice: voice || "Amy",
      });

      // Return audio as base64
      const base64Audio = Buffer.from(result.audioStream).toString("base64");

      res.json({
        audio: base64Audio,
        contentType: result.contentType,
      });
    } catch (error) {
      console.error("Error synthesizing speech:", error);
      res.status(500).json({ message: "Error synthesizing speech" });
    }
  }
);

// Helper function to extract required variables from script steps
function extractRequiredVariables(steps: Array<{ content?: string }>): string[] {
  const variables = new Set<string>();
  const variableRegex = /{{(\w+)}}/g;

  for (const step of steps) {
    if (step.content) {
      let match;
      while ((match = variableRegex.exec(step.content)) !== null) {
        if (match[1]) {
          variables.add(match[1]);
        }
      }
    }
  }

  return Array.from(variables);
}
