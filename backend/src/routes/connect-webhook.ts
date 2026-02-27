import { Router, Request, Response } from "express";
import {
  updateDbCallStatus,
  updateDbCallOutcome,
  getDbCallByContactId,
  getDbCallById,
} from "../adapters/calls";
import { getCallStatus } from "../lib/connect";
import type { CallStatus } from "../lib/connect";

export const router: Router = Router();

// Types for Connect events
interface ConnectContactEvent {
  eventType: "CONTACT_INITIATED" | "CONTACT_CONNECTED" | "CONTACT_DISCONNECTED" | "CONTACT_ENDED";
  contactId: string;
  instanceArn: string;
  channel: string;
  initiationMethod: string;
  timestamp: string;
  attributes?: Record<string, string>;
  agentInfo?: {
    agentArn: string;
    connectedToAgentTimestamp?: string;
  };
  disconnectReason?: string;
  duration?: number;
}

// Webhook endpoint for Amazon Connect contact events
// This should be called by Amazon Connect via Lambda or EventBridge
router.post("/contact-event", async (req: Request, res: Response) => {
  try {
    const event: ConnectContactEvent = req.body;
    console.log("[Connect Webhook] Received event:", JSON.stringify(event, null, 2));

    const { eventType, contactId, attributes, disconnectReason, duration } = event;

    // Find the call record by contactId
    const call = await getDbCallByContactId(contactId);
    if (!call) {
      console.log(`[Connect Webhook] No call found for contactId: ${contactId}`);
      return res.status(200).json({ message: "No matching call found" });
    }

    // Map Connect event to our status
    let newStatus: "pending" | "approved" | "in_progress" | "completed" | "failed" | "cancelled" =
      call.status;
    let connectStatus: string | undefined;

    switch (eventType) {
      case "CONTACT_INITIATED":
        newStatus = "in_progress";
        connectStatus = "initiated";
        break;

      case "CONTACT_CONNECTED":
        newStatus = "in_progress";
        connectStatus = "connected";
        break;

      case "CONTACT_DISCONNECTED":
      case "CONTACT_ENDED":
        // Determine if successful based on disconnect reason
        if (
          disconnectReason === "CUSTOMER_DISCONNECT" ||
          disconnectReason === "AGENT_DISCONNECT" ||
          disconnectReason === "CONTACT_FLOW_DISCONNECT"
        ) {
          newStatus = "completed";
          connectStatus = "completed";
        } else if (
          disconnectReason === "TELECOM_PROBLEM" ||
          disconnectReason === "CONTACT_FLOW_ERROR"
        ) {
          newStatus = "failed";
          connectStatus = "failed";
        } else {
          newStatus = "completed";
          connectStatus = disconnectReason?.toLowerCase() || "completed";
        }
        break;
    }

    // Update the call status - cast connectStatus to CallStatus type
    await updateDbCallStatus(
      call.userId,
      call.callId,
      newStatus,
      undefined,
      connectStatus as CallStatus | undefined
    );

    // If call ended, update duration and outcome
    if (eventType === "CONTACT_DISCONNECTED" || eventType === "CONTACT_ENDED") {
      if (duration) {
        // Update with duration - we'd need to add this to the adapter
        console.log(`[Connect Webhook] Call duration: ${duration} seconds`);
      }

      // If there are attributes with outcome info, update the outcome
      if (attributes?.outcome) {
        try {
          const outcome = JSON.parse(attributes.outcome);
          await updateDbCallOutcome(call.userId, call.callId, outcome);
        } catch (e) {
          console.log("[Connect Webhook] Could not parse outcome from attributes");
        }
      }
    }

    console.log(`[Connect Webhook] Updated call ${call.callId} status to ${newStatus}`);
    res.status(200).json({ message: "Event processed", callId: call.callId, newStatus });
  } catch (error) {
    console.error("[Connect Webhook] Error processing event:", error);
    res.status(500).json({ message: "Error processing event" });
  }
});

// Health check for the webhook
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "connect-webhook" });
});

// Manual status sync endpoint - can be called to force sync status from Connect
router.post("/sync/:callId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { callId } = req.params;
    if (!callId) {
      return res.status(400).json({ message: "Call ID required" });
    }

    const call = await getDbCallById(userId as string, callId);
    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    if (!call.contactId) {
      return res.json({ status: call.status, message: "No contact ID to sync" });
    }

    // Get status from Connect
    const connectStatus = await getCallStatus(call.contactId);

    // Update local status if needed
    let newStatus = call.status;
    if (connectStatus.status === "completed" && call.status === "in_progress") {
      newStatus = "completed";
      await updateDbCallStatus(userId, callId, newStatus, undefined, "completed");
    } else if (
      (connectStatus.status === "failed" || connectStatus.status === "no-answer") &&
      call.status === "in_progress"
    ) {
      newStatus = "failed";
      await updateDbCallStatus(userId, callId, newStatus, undefined, connectStatus.status);
    }

    res.json({
      callId,
      previousStatus: call.status,
      newStatus,
      connectStatus: connectStatus.status,
    });
  } catch (error) {
    console.error("[Connect Webhook] Error syncing status:", error);
    res.status(500).json({ message: "Error syncing status" });
  }
});
