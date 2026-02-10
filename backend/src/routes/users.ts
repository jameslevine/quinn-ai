import { Router, Request, Response } from "express";
import {
  getDbUserById,
  getOrCreateDbUser,
  updateDbUserProfile,
  updateDbUserSettings,
  UserSettings,
} from "../adapters/users";

export const usersRouter: Router = Router();

// Get current user profile (or create if first login)
usersRouter.get("/me", async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch user profile" },
    });
  }
});

// Get user by ID
usersRouter.get("/:userId", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const userId = req.params.userId as string;
    const user = await getDbUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch user" },
    });
  }
});

// Update user profile
usersRouter.patch("/me", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;

    // Get or create user first
    const existingUser = await getOrCreateDbUser(cognitoSub, email);

    const { firstName, lastName } = req.body;
    const updates: { firstName?: string; lastName?: string } = {};

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;

    const updatedUser = await updateDbUserProfile(existingUser.userId, updates);

    res.json({
      success: true,
      data: {
        userId: updatedUser?.userId,
        email: updatedUser?.email,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        settings: updatedUser?.settings,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to update user profile" },
    });
  }
});

// Update user settings
usersRouter.patch("/me/settings", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;

    // Get or create user first
    const existingUser = await getOrCreateDbUser(cognitoSub, email);

    const settings: Partial<UserSettings> = req.body;
    const updatedUser = await updateDbUserSettings(existingUser.userId, settings);

    res.json({
      success: true,
      data: {
        settings: updatedUser?.settings,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to update user settings" },
    });
  }
});

export default usersRouter;
