import { Router, Request, Response } from "express";
import { getOrCreateDbUser } from "../adapters/users";
import { getDbIntegrationByType } from "../adapters/integrations";
import {
  listEmails,
  getEmail,
  sendEmail,
  createDraft,
  markAsRead,
  archiveEmail,
  deleteEmail,
  getLabels,
} from "../lib/gmail";

export const emailsRouter: Router = Router();

// Check if Gmail is connected
const checkGmailConnected = async (userId: string): Promise<boolean> => {
  const integration = await getDbIntegrationByType(userId, "gmail");
  return integration?.status === "connected";
};

// List emails
emailsRouter.get("/", async (req: Request, res: Response) => {
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

    // Check if Gmail is connected
    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const maxResults = parseInt(req.query.maxResults as string) || 20;
    const query = req.query.q as string | undefined;
    const pageToken = req.query.pageToken as string | undefined;
    const labelIds = req.query.labelIds ? (req.query.labelIds as string).split(",") : undefined;

    const result = await listEmails(user.userId, {
      maxResults,
      query,
      pageToken,
      labelIds,
    });

    res.json({
      success: true,
      data: result.messages,
      meta: {
        count: result.messages.length,
        nextPageToken: result.nextPageToken,
      },
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch emails" },
    });
  }
});

// Get single email
emailsRouter.get("/:messageId", async (req: Request, res: Response) => {
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

    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const messageId = req.params.messageId as string;
    const message = await getEmail(user.userId, messageId);

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Error fetching email:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch email" },
    });
  }
});

// Send email
emailsRouter.post("/send", async (req: Request, res: Response) => {
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

    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const { to, subject, body, cc, bcc, replyTo, threadId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "to, subject, and body are required" },
      });
    }

    const result = await sendEmail(user.userId, {
      to,
      subject,
      body,
      cc,
      bcc,
      replyTo,
      threadId,
    });

    res.json({
      success: true,
      data: result,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to send email" },
    });
  }
});

// Create draft
emailsRouter.post("/drafts", async (req: Request, res: Response) => {
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

    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const { to, subject, body, cc, bcc, threadId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "to, subject, and body are required" },
      });
    }

    const result = await createDraft(user.userId, {
      to,
      subject,
      body,
      cc,
      bcc,
      threadId,
    });

    res.json({
      success: true,
      data: result,
      message: "Draft created successfully",
    });
  } catch (error) {
    console.error("Error creating draft:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to create draft" },
    });
  }
});

// Mark email as read
emailsRouter.post("/:messageId/read", async (req: Request, res: Response) => {
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

    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const messageId = req.params.messageId as string;
    await markAsRead(user.userId, messageId);

    res.json({
      success: true,
      message: "Email marked as read",
    });
  } catch (error) {
    console.error("Error marking email as read:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to mark email as read" },
    });
  }
});

// Archive email
emailsRouter.post("/:messageId/archive", async (req: Request, res: Response) => {
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

    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const messageId = req.params.messageId as string;
    await archiveEmail(user.userId, messageId);

    res.json({
      success: true,
      message: "Email archived",
    });
  } catch (error) {
    console.error("Error archiving email:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to archive email" },
    });
  }
});

// Delete email
emailsRouter.delete("/:messageId", async (req: Request, res: Response) => {
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

    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const messageId = req.params.messageId as string;
    await deleteEmail(user.userId, messageId);

    res.json({
      success: true,
      message: "Email deleted",
    });
  } catch (error) {
    console.error("Error deleting email:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete email" },
    });
  }
});

// Get labels
emailsRouter.get("/labels/list", async (req: Request, res: Response) => {
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

    const isConnected = await checkGmailConnected(user.userId);
    if (!isConnected) {
      return res.status(400).json({
        success: false,
        error: { code: "GMAIL_NOT_CONNECTED", message: "Gmail is not connected" },
      });
    }

    const labels = await getLabels(user.userId);

    res.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    console.error("Error fetching labels:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch labels" },
    });
  }
});

export default emailsRouter;
