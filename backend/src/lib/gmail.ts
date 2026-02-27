import { google, Auth, gmail_v1 } from "googleapis";
import { getDbIntegrationByType, updateDbIntegrationTokens } from "../adapters/integrations";

// Gmail OAuth configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REDIRECT_URI =
  process.env.GMAIL_REDIRECT_URI || "http://localhost:3001/integrations/gmail/callback";

// Gmail scopes (includes Calendar for unified Google integration)
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

// Create OAuth2 client
export const createOAuth2Client = (): Auth.OAuth2Client => {
  return new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI);
};

// Generate authorization URL
export const getGmailAuthUrl = (state: string): string => {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    state,
    prompt: "consent",
  });
};

// Exchange code for tokens
export const exchangeCodeForTokens = async (code: string): Promise<Auth.Credentials> => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Get authenticated Gmail client for user
export const getGmailClient = async (userId: string): Promise<gmail_v1.Gmail> => {
  const integration = await getDbIntegrationByType(userId, "gmail");

  if (!integration || integration.status !== "connected") {
    throw new Error("Gmail not connected");
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken || null,
    refresh_token: integration.refreshToken || null,
  });

  // Check if token is expired and refresh if needed
  if (integration.tokenExpiry) {
    const expiryDate = new Date(integration.tokenExpiry);
    if (expiryDate < new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token && credentials.expiry_date) {
        await updateDbIntegrationTokens(
          userId,
          "gmail",
          credentials.access_token,
          new Date(credentials.expiry_date).toISOString(),
          credentials.refresh_token || undefined
        );
      }
      oauth2Client.setCredentials(credentials);
    }
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
};

// Get user email from Gmail
export const getGmailUserEmail = async (accessToken: string): Promise<string> => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data.email || "";
};

// Email types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body?: string;
  isRead: boolean;
  isStarred: boolean;
}

// Parse email headers
const parseHeaders = (
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined
): Record<string, string> => {
  const result: Record<string, string> = {};
  if (headers) {
    headers.forEach((header) => {
      if (header.name && header.value) {
        result[header.name.toLowerCase()] = header.value;
      }
    });
  }
  return result;
};

// Get email body from parts
const getEmailBody = (payload: gmail_v1.Schema$MessagePart | undefined): string => {
  if (!payload) return "";

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        const body = getEmailBody(part);
        if (body) return body;
      }
    }
  }

  return "";
};

// List emails
export const listEmails = async (
  userId: string,
  options: {
    maxResults?: number;
    labelIds?: string[];
    query?: string;
    pageToken?: string;
  } = {}
): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> => {
  const gmail = await getGmailClient(userId);

  const listParams: gmail_v1.Params$Resource$Users$Messages$List = {
    userId: "me",
    maxResults: options.maxResults || 20,
    q: options.query,
    pageToken: options.pageToken,
  };

  if (options.labelIds && options.labelIds.length > 0) {
    listParams.labelIds = options.labelIds;
  }

  const response = await gmail.users.messages.list(listParams);
  const data = response.data;

  if (!data.messages) {
    return { messages: [] };
  }

  const messages: GmailMessage[] = [];

  for (const msg of data.messages) {
    if (!msg.id) continue;

    const msgResponse = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const fullMessage = msgResponse.data;
    const headers = parseHeaders(fullMessage.payload?.headers);

    messages.push({
      id: fullMessage.id || "",
      threadId: fullMessage.threadId || "",
      labelIds: fullMessage.labelIds || [],
      snippet: fullMessage.snippet || "",
      subject: headers.subject || "(No Subject)",
      from: headers.from || "",
      to: headers.to || "",
      date: headers.date || "",
      body: getEmailBody(fullMessage.payload),
      isRead: !fullMessage.labelIds?.includes("UNREAD"),
      isStarred: fullMessage.labelIds?.includes("STARRED") || false,
    });
  }

  return {
    messages,
    nextPageToken: data.nextPageToken || undefined,
  };
};

// Get single email
export const getEmail = async (userId: string, messageId: string): Promise<GmailMessage> => {
  const gmail = await getGmailClient(userId);

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const data = response.data;
  const headers = parseHeaders(data.payload?.headers);

  return {
    id: data.id || "",
    threadId: data.threadId || "",
    labelIds: data.labelIds || [],
    snippet: data.snippet || "",
    subject: headers.subject || "(No Subject)",
    from: headers.from || "",
    to: headers.to || "",
    date: headers.date || "",
    body: getEmailBody(data.payload),
    isRead: !data.labelIds?.includes("UNREAD"),
    isStarred: data.labelIds?.includes("STARRED") || false,
  };
};

// Send email
export const sendEmail = async (
  userId: string,
  options: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    replyTo?: string;
    threadId?: string;
  }
): Promise<{ id: string; threadId: string }> => {
  const gmail = await getGmailClient(userId);
  const integration = await getDbIntegrationByType(userId, "gmail");

  const from = integration?.email || "";

  // Build email
  const emailLines = [`From: ${from}`, `To: ${options.to}`, `Subject: ${options.subject}`];

  if (options.cc) emailLines.push(`Cc: ${options.cc}`);
  if (options.bcc) emailLines.push(`Bcc: ${options.bcc}`);
  if (options.replyTo) emailLines.push(`Reply-To: ${options.replyTo}`);

  emailLines.push("Content-Type: text/html; charset=utf-8");
  emailLines.push("");
  emailLines.push(options.body);

  const email = emailLines.join("\r\n");
  const encodedEmail = Buffer.from(email).toString("base64url");

  const requestBody: gmail_v1.Schema$Message = {
    raw: encodedEmail,
  };

  if (options.threadId) {
    requestBody.threadId = options.threadId;
  }

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody,
  });

  return {
    id: response.data.id || "",
    threadId: response.data.threadId || "",
  };
};

// Create draft
export const createDraft = async (
  userId: string,
  options: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    threadId?: string;
  }
): Promise<{ id: string; messageId: string }> => {
  const gmail = await getGmailClient(userId);
  const integration = await getDbIntegrationByType(userId, "gmail");

  const from = integration?.email || "";

  const emailLines = [`From: ${from}`, `To: ${options.to}`, `Subject: ${options.subject}`];

  if (options.cc) emailLines.push(`Cc: ${options.cc}`);
  if (options.bcc) emailLines.push(`Bcc: ${options.bcc}`);

  emailLines.push("Content-Type: text/html; charset=utf-8");
  emailLines.push("");
  emailLines.push(options.body);

  const email = emailLines.join("\r\n");
  const encodedEmail = Buffer.from(email).toString("base64url");

  const message: gmail_v1.Schema$Message = {
    raw: encodedEmail,
  };

  if (options.threadId) {
    message.threadId = options.threadId;
  }

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message,
    },
  });

  return {
    id: response.data.id || "",
    messageId: response.data.message?.id || "",
  };
};

// Mark email as read
export const markAsRead = async (userId: string, messageId: string): Promise<void> => {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
};

// Archive email
export const archiveEmail = async (userId: string, messageId: string): Promise<void> => {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["INBOX"],
    },
  });
};

// Delete email
export const deleteEmail = async (userId: string, messageId: string): Promise<void> => {
  const gmail = await getGmailClient(userId);

  await gmail.users.messages.trash({
    userId: "me",
    id: messageId,
  });
};

// Get labels
export const getLabels = async (userId: string): Promise<gmail_v1.Schema$Label[]> => {
  const gmail = await getGmailClient(userId);

  const response = await gmail.users.labels.list({
    userId: "me",
  });

  return response.data.labels || [];
};
