import { v4 as uuidv4 } from "uuid";
import {
  dynamodb,
  TABLE_NAME,
  KEY_PREFIXES,
  GSI,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "./dynamodb";
import type { CallStatus, CallType, CallScript } from "../lib/connect";

// Types
export interface CallOutcome {
  success: boolean;
  summary: string;
  appointmentBooked?: {
    date: string;
    time: string;
    confirmationNumber?: string;
  };
  followUpRequired: boolean;
  followUpNotes?: string;
}

export interface CallRecord {
  callId: string;
  contactId?: string; // AWS Connect Contact ID
  userId: string;
  direction: "outbound" | "inbound";
  to: string;
  from: string;
  purpose: string;
  scriptType: CallType;
  script?: CallScript;
  status: "pending" | "approved" | "in_progress" | "completed" | "failed" | "cancelled";
  connectStatus?: CallStatus;
  duration?: number;
  recordingUrl?: string;
  recordingKey?: string;
  transcriptUrl?: string;
  transcript?: string;
  outcome?: CallOutcome;
  notes?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCalls {
  calls: CallRecord[];
  lastEvaluatedKey?: Record<string, unknown>;
}

// Create PK and SK for calls
const createCallPK = (userId: string) => `${KEY_PREFIXES.USER}${userId}`;
const createCallSK = (callId: string) => `${KEY_PREFIXES.CALL}${callId}`;

// Create a new call record
export const createDbCall = async (
  userId: string,
  data: {
    to: string;
    from?: string;
    purpose: string;
    scriptType: CallType;
    script?: CallScript;
    scheduledAt?: string;
    notes?: string;
  }
): Promise<CallRecord> => {
  const callId = uuidv4();
  const now = new Date().toISOString();

  const call = {
    pk: createCallPK(userId),
    sk: createCallSK(callId),
    gsi1pk: `${KEY_PREFIXES.USER}${userId}#CALLS`,
    gsi1sk: now,
    callId,
    userId,
    direction: "outbound" as const,
    to: data.to,
    from: data.from || "",
    purpose: data.purpose,
    scriptType: data.scriptType,
    script: data.script,
    status: "pending" as const,
    scheduledAt: data.scheduledAt,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLE_NAME,
    Item: call,
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return {
      callId,
      userId,
      direction: "outbound",
      to: data.to,
      from: data.from || "",
      purpose: data.purpose,
      scriptType: data.scriptType,
      script: data.script,
      status: "pending",
      scheduledAt: data.scheduledAt,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Error creating call:", error);
    throw error;
  }
};

// Get call by ID
export const getDbCallById = async (userId: string, callId: string): Promise<CallRecord | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createCallPK(userId),
      sk: createCallSK(callId),
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    if (!response.Item) return null;

    return {
      callId: response.Item.callId,
      contactId: response.Item.contactId,
      userId: response.Item.userId,
      direction: response.Item.direction,
      to: response.Item.to,
      from: response.Item.from,
      purpose: response.Item.purpose,
      scriptType: response.Item.scriptType,
      script: response.Item.script,
      status: response.Item.status,
      connectStatus: response.Item.connectStatus,
      duration: response.Item.duration,
      recordingUrl: response.Item.recordingUrl,
      recordingKey: response.Item.recordingKey,
      transcriptUrl: response.Item.transcriptUrl,
      transcript: response.Item.transcript,
      outcome: response.Item.outcome,
      notes: response.Item.notes,
      scheduledAt: response.Item.scheduledAt,
      startedAt: response.Item.startedAt,
      completedAt: response.Item.completedAt,
      createdAt: response.Item.createdAt,
      updatedAt: response.Item.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching call:", error);
    throw error;
  }
};

// Get all calls for a user
export const getDbCallsByUserId = async (
  userId: string,
  limit: number = 20,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<PaginatedCalls> => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: GSI.GSI1,
    KeyConditionExpression: "gsi1pk = :gsi1pk",
    ExpressionAttributeValues: {
      ":gsi1pk": `${KEY_PREFIXES.USER}${userId}#CALLS`,
    },
    ScanIndexForward: false, // Most recent first
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    const calls = (response.Items || []).map((item) => ({
      callId: item.callId,
      contactId: item.contactId,
      userId: item.userId,
      direction: item.direction as "outbound" | "inbound",
      to: item.to,
      from: item.from,
      purpose: item.purpose,
      scriptType: item.scriptType as CallType,
      script: item.script,
      status: item.status as CallRecord["status"],
      connectStatus: item.connectStatus as CallStatus | undefined,
      duration: item.duration,
      recordingUrl: item.recordingUrl,
      recordingKey: item.recordingKey,
      transcriptUrl: item.transcriptUrl,
      transcript: item.transcript,
      outcome: item.outcome,
      notes: item.notes,
      scheduledAt: item.scheduledAt,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      calls,
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error("Error fetching calls:", error);
    throw error;
  }
};

// Update call status
export const updateDbCallStatus = async (
  userId: string,
  callId: string,
  status: CallRecord["status"],
  contactId?: string,
  connectStatus?: CallStatus
): Promise<CallRecord | null> => {
  const now = new Date().toISOString();

  const updateExpressions: string[] = ["#status = :status", "#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = {
    "#status": "status",
    "#updatedAt": "updatedAt",
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ":status": status,
    ":updatedAt": now,
  };

  if (contactId) {
    updateExpressions.push("#contactId = :contactId");
    expressionAttributeNames["#contactId"] = "contactId";
    expressionAttributeValues[":contactId"] = contactId;
  }

  if (connectStatus) {
    updateExpressions.push("#connectStatus = :connectStatus");
    expressionAttributeNames["#connectStatus"] = "connectStatus";
    expressionAttributeValues[":connectStatus"] = connectStatus;
  }

  if (status === "in_progress") {
    updateExpressions.push("#startedAt = :startedAt");
    expressionAttributeNames["#startedAt"] = "startedAt";
    expressionAttributeValues[":startedAt"] = now;
  }

  if (status === "completed" || status === "failed" || status === "cancelled") {
    updateExpressions.push("#completedAt = :completedAt");
    expressionAttributeNames["#completedAt"] = "completedAt";
    expressionAttributeValues[":completedAt"] = now;
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createCallPK(userId),
      sk: createCallSK(callId),
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    if (!response.Attributes) return null;

    return {
      callId: response.Attributes.callId,
      contactId: response.Attributes.contactId,
      userId: response.Attributes.userId,
      direction: response.Attributes.direction,
      to: response.Attributes.to,
      from: response.Attributes.from,
      purpose: response.Attributes.purpose,
      scriptType: response.Attributes.scriptType,
      script: response.Attributes.script,
      status: response.Attributes.status,
      connectStatus: response.Attributes.connectStatus,
      duration: response.Attributes.duration,
      recordingUrl: response.Attributes.recordingUrl,
      recordingKey: response.Attributes.recordingKey,
      transcriptUrl: response.Attributes.transcriptUrl,
      transcript: response.Attributes.transcript,
      outcome: response.Attributes.outcome,
      notes: response.Attributes.notes,
      scheduledAt: response.Attributes.scheduledAt,
      startedAt: response.Attributes.startedAt,
      completedAt: response.Attributes.completedAt,
      createdAt: response.Attributes.createdAt,
      updatedAt: response.Attributes.updatedAt,
    };
  } catch (error) {
    console.error("Error updating call status:", error);
    throw error;
  }
};

// Update call with recording info
export const updateDbCallRecording = async (
  userId: string,
  callId: string,
  recordingUrl: string,
  recordingKey: string,
  duration?: number
): Promise<void> => {
  const now = new Date().toISOString();

  const updateExpressions: string[] = [
    "#recordingUrl = :recordingUrl",
    "#recordingKey = :recordingKey",
    "#updatedAt = :updatedAt",
  ];
  const expressionAttributeNames: Record<string, string> = {
    "#recordingUrl": "recordingUrl",
    "#recordingKey": "recordingKey",
    "#updatedAt": "updatedAt",
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ":recordingUrl": recordingUrl,
    ":recordingKey": recordingKey,
    ":updatedAt": now,
  };

  if (duration !== undefined) {
    updateExpressions.push("#duration = :duration");
    expressionAttributeNames["#duration"] = "duration";
    expressionAttributeValues[":duration"] = duration;
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createCallPK(userId),
      sk: createCallSK(callId),
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    await dynamodb.send(new UpdateCommand(params));
  } catch (error) {
    console.error("Error updating call recording:", error);
    throw error;
  }
};

// Update call with transcript
export const updateDbCallTranscript = async (
  userId: string,
  callId: string,
  transcript: string,
  transcriptUrl?: string
): Promise<void> => {
  const now = new Date().toISOString();

  const updateExpressions: string[] = ["#transcript = :transcript", "#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = {
    "#transcript": "transcript",
    "#updatedAt": "updatedAt",
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ":transcript": transcript,
    ":updatedAt": now,
  };

  if (transcriptUrl) {
    updateExpressions.push("#transcriptUrl = :transcriptUrl");
    expressionAttributeNames["#transcriptUrl"] = "transcriptUrl";
    expressionAttributeValues[":transcriptUrl"] = transcriptUrl;
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createCallPK(userId),
      sk: createCallSK(callId),
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    await dynamodb.send(new UpdateCommand(params));
  } catch (error) {
    console.error("Error updating call transcript:", error);
    throw error;
  }
};

// Update call outcome
export const updateDbCallOutcome = async (
  userId: string,
  callId: string,
  outcome: CallOutcome
): Promise<void> => {
  const now = new Date().toISOString();

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createCallPK(userId),
      sk: createCallSK(callId),
    },
    UpdateExpression: "SET #outcome = :outcome, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#outcome": "outcome",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":outcome": outcome,
      ":updatedAt": now,
    },
  };

  try {
    await dynamodb.send(new UpdateCommand(params));
  } catch (error) {
    console.error("Error updating call outcome:", error);
    throw error;
  }
};

// Delete a call
export const deleteDbCall = async (userId: string, callId: string): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createCallPK(userId),
      sk: createCallSK(callId),
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error("Error deleting call:", error);
    throw error;
  }
};

// Get call by Contact ID (for webhook lookups)
export const getDbCallByContactId = async (contactId: string): Promise<CallRecord | null> => {
  // We need to scan for the contactId since it's not a key
  // In production, you'd want a GSI on contactId for better performance
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: "#contactId = :contactId",
    ExpressionAttributeNames: {
      "#contactId": "contactId",
    },
    ExpressionAttributeValues: {
      ":contactId": contactId,
    },
    Limit: 1,
  };

  try {
    // Use scan since we don't have a GSI on contactId
    const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
    const response = await dynamodb.send(new ScanCommand(params));
    if (!response.Items || response.Items.length === 0) return null;

    const item = response.Items[0]!;
    return {
      callId: item.callId as string,
      contactId: item.contactId as string | undefined,
      userId: item.userId as string,
      direction: item.direction as "outbound" | "inbound",
      to: item.to as string,
      from: item.from as string,
      purpose: item.purpose as string,
      scriptType: item.scriptType as CallType,
      script: item.script as CallScript | undefined,
      status: item.status as CallRecord["status"],
      connectStatus: item.connectStatus as CallStatus | undefined,
      duration: item.duration as number | undefined,
      recordingUrl: item.recordingUrl as string | undefined,
      recordingKey: item.recordingKey as string | undefined,
      transcriptUrl: item.transcriptUrl as string | undefined,
      transcript: item.transcript as string | undefined,
      outcome: item.outcome as CallOutcome | undefined,
      notes: item.notes as string | undefined,
      scheduledAt: item.scheduledAt as string | undefined,
      startedAt: item.startedAt as string | undefined,
      completedAt: item.completedAt as string | undefined,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    };
  } catch (error) {
    console.error("Error fetching call by contactId:", error);
    throw error;
  }
};

// Get pending calls (for approval workflow)
export const getDbPendingCalls = async (
  userId: string,
  limit: number = 20
): Promise<CallRecord[]> => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: GSI.GSI1,
    KeyConditionExpression: "gsi1pk = :gsi1pk",
    FilterExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":gsi1pk": `${KEY_PREFIXES.USER}${userId}#CALLS`,
      ":status": "pending",
    },
    ScanIndexForward: false,
    Limit: limit,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []).map((item) => ({
      callId: item.callId,
      contactId: item.contactId,
      userId: item.userId,
      direction: item.direction as "outbound" | "inbound",
      to: item.to,
      from: item.from,
      purpose: item.purpose,
      scriptType: item.scriptType as CallType,
      script: item.script,
      status: item.status as CallRecord["status"],
      connectStatus: item.connectStatus as CallStatus | undefined,
      duration: item.duration,
      recordingUrl: item.recordingUrl,
      recordingKey: item.recordingKey,
      transcriptUrl: item.transcriptUrl,
      transcript: item.transcript,
      outcome: item.outcome,
      notes: item.notes,
      scheduledAt: item.scheduledAt,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching pending calls:", error);
    throw error;
  }
};
