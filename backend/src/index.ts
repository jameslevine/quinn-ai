import cors from "cors";
import express from "express";
import serverless from "serverless-http";

import { cognitoAuthMiddleware } from "./middleware/cognito-auth";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { healthRouter } from "./routes/health";
import { usersRouter } from "./routes/users";
import { actionsRouter } from "./routes/actions";
import { approvalsRouter } from "./routes/approvals";
import { integrationsRouter, gmailCallbackRouter } from "./routes/integrations";
import { emailsRouter } from "./routes/emails";
import { bankingRouter } from "./routes/banking";
import { router as foodRouter } from "./routes/food";
import { router as lifeRouter } from "./routes/life";
import { router as chatRouter } from "./routes/chat";
import { router as aiRouter } from "./routes/ai";
import { router as callsRouter } from "./routes/calls";
import { router as calendarRouter } from "./routes/calendar";
import { router as smsRouter } from "./routes/sms";
import { router as notificationsRouter } from "./routes/notifications";
import { router as connectWebhookRouter } from "./routes/connect-webhook";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Amz-Date",
      "X-Api-Key",
      "X-Amz-Security-Token",
      "X-Request-ID",
    ],
    maxAge: 300,
  })
);

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Request logging
app.use(requestLogger);

// Health check (no auth required)
app.use("/health", healthRouter);

// Gmail OAuth callback (no auth required - Google redirects here)
app.use("/integrations/gmail", gmailCallbackRouter);

// SMS webhooks (no auth required - AWS SNS/Pinpoint sends here)
app.use("/sms/webhook", smsRouter);

// Connect webhooks (no auth required - Amazon Connect sends here)
app.use("/connect-webhook", connectWebhookRouter);

// Protected routes
app.use(cognitoAuthMiddleware);
app.use("/users", usersRouter);
app.use("/actions", actionsRouter);
app.use("/approvals", approvalsRouter);
app.use("/integrations", integrationsRouter);
app.use("/emails", emailsRouter);
app.use("/banking", bankingRouter);
app.use("/food", foodRouter);
app.use("/life", lifeRouter);
app.use("/chat", chatRouter);
app.use("/ai", aiRouter);
app.use("/calls", callsRouter);
app.use("/calendar", calendarRouter);
app.use("/sms", smsRouter);
app.use("/notifications", notificationsRouter);

// Error handling
app.use(errorHandler);

// Export for Lambda
export const handler = serverless(app);

// Local development
if (process.env.NODE_ENV === "development") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Quinn API running on port ${PORT}`);
  });
}
