import { Router, Request, Response } from "express";
import { getDbActionsByStatus, updateDbActionStatus, ActionStatus } from "../adapters/actions";
import { getOrCreateDbUser } from "../adapters/users";

export const approvalsRouter: Router = Router();

// Get all pending approvals for current user
approvalsRouter.get("/", async (req: Request, res: Response) => {
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
    const pendingActions = await getDbActionsByStatus(user.userId, "pending", limit);

    res.json({
      success: true,
      data: pendingActions,
      meta: {
        count: pendingActions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch pending approvals" },
    });
  }
});

// Approve an action
approvalsRouter.post("/:actionId/approve", async (req: Request, res: Response) => {
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
    const action = await updateDbActionStatus(user.userId, actionId, "approved");

    if (!action) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Action not found" },
      });
    }

    res.json({
      success: true,
      data: action,
      message: "Action approved successfully",
    });
  } catch (error) {
    console.error("Error approving action:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to approve action" },
    });
  }
});

// Reject an action
approvalsRouter.post("/:actionId/reject", async (req: Request, res: Response) => {
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
    const action = await updateDbActionStatus(user.userId, actionId, "rejected");

    if (!action) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Action not found" },
      });
    }

    res.json({
      success: true,
      data: action,
      message: "Action rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting action:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to reject action" },
    });
  }
});

// Bulk approve actions
approvalsRouter.post("/bulk/approve", async (req: Request, res: Response) => {
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

    const { actionIds } = req.body;

    if (!actionIds || !Array.isArray(actionIds) || actionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "actionIds array is required" },
      });
    }

    const results = await Promise.allSettled(
      actionIds.map((actionId: string) => updateDbActionStatus(user.userId, actionId, "approved"))
    );

    const approved = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    res.json({
      success: true,
      data: {
        approved,
        failed,
        total: actionIds.length,
      },
      message: `${approved} action(s) approved, ${failed} failed`,
    });
  } catch (error) {
    console.error("Error bulk approving actions:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to bulk approve actions" },
    });
  }
});

// Get approval statistics
approvalsRouter.get("/stats", async (req: Request, res: Response) => {
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

    const statuses: ActionStatus[] = ["pending", "approved", "rejected", "completed", "failed"];
    const statsPromises = statuses.map(async (status) => {
      const actions = await getDbActionsByStatus(user.userId, status, 100);
      return { status, count: actions.length };
    });

    const stats = await Promise.all(statsPromises);
    const statsMap = stats.reduce(
      (acc, { status, count }) => {
        acc[status] = count;
        return acc;
      },
      {} as Record<ActionStatus, number>
    );

    res.json({
      success: true,
      data: statsMap,
    });
  } catch (error) {
    console.error("Error fetching approval stats:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch approval stats" },
    });
  }
});

export default approvalsRouter;
