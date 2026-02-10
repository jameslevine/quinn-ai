import { Router, Request, Response } from "express";
import {
  getDbActionById,
  getDbActionsByUserId,
  getDbActionsByStatus,
  createDbAction,
  updateDbActionStatus,
  ActionType,
  ActionStatus,
} from "../adapters/actions";
import { getOrCreateDbUser } from "../adapters/users";

export const actionsRouter: Router = Router();

// Get all actions for current user
actionsRouter.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as ActionStatus | undefined;

    let result;
    if (status) {
      const actions = await getDbActionsByStatus(user.userId, status, limit);
      result = { actions, lastEvaluatedKey: undefined };
    } else {
      result = await getDbActionsByUserId(user.userId, limit);
    }

    res.json({
      success: true,
      data: result.actions,
      meta: {
        count: result.actions.length,
        hasMore: !!result.lastEvaluatedKey,
      },
    });
  } catch (error) {
    console.error("Error fetching actions:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch actions" },
    });
  }
});

// Get single action by ID
actionsRouter.get("/:actionId", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const actionId = req.params.actionId as string;
    const action = await getDbActionById(user.userId, actionId);

    if (!action) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Action not found" },
      });
    }

    res.json({
      success: true,
      data: action,
    });
  } catch (error) {
    console.error("Error fetching action:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch action" },
    });
  }
});

// Create new action
actionsRouter.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const { type, title, description, details, amount, currency, metadata } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "type, title, and description are required" },
      });
    }

    const action = await createDbAction(
      user.userId,
      type as ActionType,
      title,
      description,
      details,
      amount,
      currency,
      metadata
    );

    res.status(201).json({
      success: true,
      data: action,
    });
  } catch (error) {
    console.error("Error creating action:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to create action" },
    });
  }
});

// Update action status
actionsRouter.patch("/:actionId/status", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const actionId = req.params.actionId as string;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "status is required" },
      });
    }

    const validStatuses: ActionStatus[] = [
      "pending",
      "approved",
      "rejected",
      "completed",
      "failed",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid status value" },
      });
    }

    const action = await updateDbActionStatus(user.userId, actionId, status);

    if (!action) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Action not found" },
      });
    }

    res.json({
      success: true,
      data: action,
    });
  } catch (error) {
    console.error("Error updating action status:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to update action status" },
    });
  }
});

export default actionsRouter;
