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
import { integrationsRouter } from "./routes/integrations";
import { emailsRouter } from "./routes/emails";

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
    return res.status(200).end();
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Request logging
app.use(requestLogger);

// Health check (no auth required)
app.use("/health", healthRouter);

// Protected routes
app.use(cognitoAuthMiddleware);
app.use("/users", usersRouter);
app.use("/actions", actionsRouter);
app.use("/approvals", approvalsRouter);
app.use("/integrations", integrationsRouter);
app.use("/emails", emailsRouter);

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
