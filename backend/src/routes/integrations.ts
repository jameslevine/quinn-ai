import { Router, Request, Response } from "express";
import {
  getDbIntegrationsByUserId,
  getDbIntegrationByType,
  upsertDbIntegration,
  deleteDbIntegration,
  IntegrationType,
} from "../adapters/integrations";
import { getOrCreateDbUser } from "../adapters/users";
import { getGmailAuthUrl, exchangeCodeForTokens, getGmailUserEmail } from "../lib/gmail";

export const integrationsRouter: Router = Router();

// Get all integrations for current user
integrationsRouter.get("/", async (req: Request, res: Response) => {
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

    const integrations = await getDbIntegrationsByUserId(user.userId);

    // Remove sensitive data from response
    const safeIntegrations = integrations.map((integration) => ({
      integrationId: integration.integrationId,
      type: integration.type,
      status: integration.status,
      email: integration.email,
      createdAt: integration.createdAt,
      lastSyncAt: integration.lastSyncAt,
    }));

    res.json({
      success: true,
      data: safeIntegrations,
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch integrations" },
    });
  }
});

// Get single integration by type
integrationsRouter.get("/:type", async (req: Request, res: Response) => {
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

    const type = req.params.type as IntegrationType;
    const integration = await getDbIntegrationByType(user.userId, type);

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Integration not found" },
      });
    }

    res.json({
      success: true,
      data: {
        integrationId: integration.integrationId,
        type: integration.type,
        status: integration.status,
        email: integration.email,
        createdAt: integration.createdAt,
        lastSyncAt: integration.lastSyncAt,
      },
    });
  } catch (error) {
    console.error("Error fetching integration:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch integration" },
    });
  }
});

// Gmail OAuth - Get authorization URL
integrationsRouter.get("/gmail/auth", async (req: Request, res: Response) => {
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

    // Create state with user ID for callback
    const state = Buffer.from(JSON.stringify({ userId: user.userId })).toString("base64");
    const authUrl = getGmailAuthUrl(state);

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    console.error("Error generating Gmail auth URL:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to generate auth URL" },
    });
  }
});

// Gmail OAuth - Callback (handles the redirect from Google)
integrationsRouter.get("/gmail/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=gmail_auth_denied`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=gmail_auth_failed`);
    }

    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state as string, "base64").toString());
    const userId = stateData.userId;

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code as string);

    // Get user email from Gmail
    const gmailEmail = await getGmailUserEmail(tokens.access_token!);

    // Save integration
    await upsertDbIntegration(userId, "gmail", {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      tokenExpiry: new Date(tokens.expiry_date!).toISOString(),
      email: gmailEmail,
    });

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/settings?success=gmail_connected`);
  } catch (error) {
    console.error("Error in Gmail callback:", error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=gmail_auth_failed`);
  }
});

// Disconnect integration
integrationsRouter.delete("/:type", async (req: Request, res: Response) => {
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

    const type = req.params.type as IntegrationType;
    await deleteDbIntegration(user.userId, type);

    res.json({
      success: true,
      message: `${type} integration disconnected`,
    });
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to disconnect integration" },
    });
  }
});

export default integrationsRouter;
