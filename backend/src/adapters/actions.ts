import { v4 as uuidv4 } from "uuid";
import {
  dynamodb,
  TABLE_NAME,
  KEY_PREFIXES,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "./dynamodb";

// Action types
export type ActionType = "email" | "call" | "payment" | "food" | "appointment" | "other";
export type ActionStatus = "pending" | "approved" | "rejected" | "completed" | "failed";

export interface Action {
  actionId: string;
  userId: string;
  type: ActionType;
  status: ActionStatus;
  title: string;
  description: string;
  details?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PaginatedActions {
  actions: Action[];
  lastEvaluatedKey?: Record<string, unknown> | undefined;
}

// Create PK and SK for action
const createActionPK = (userId: string) => `${KEY_PREFIXES.USER}${userId}`;
const createActionSK = (actionId: string) => `${KEY_PREFIXES.ACTION}${actionId}`;

// Get action by ID
export const getDbActionById = async (userId: string, actionId: string): Promise<Action | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createActionPK(userId),
      sk: createActionSK(actionId),
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return response.Item as Action | null;
  } catch (error) {
    console.error("Error fetching action:", error);
    throw error;
  }
};

// Get all actions for a user
export const getDbActionsByUserId = async (
  userId: string,
  limit: number = 50,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<PaginatedActions> => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": createActionPK(userId),
      ":skPrefix": KEY_PREFIXES.ACTION,
    },
    ScanIndexForward: false,
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return {
      actions: (response.Items || []) as Action[],
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error("Error fetching actions:", error);
    throw error;
  }
};

// Get actions by status
export const getDbActionsByStatus = async (
  userId: string,
  status: ActionStatus,
  limit: number = 50
): Promise<Action[]> => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
    FilterExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":pk": createActionPK(userId),
      ":skPrefix": KEY_PREFIXES.ACTION,
      ":status": status,
    },
    ScanIndexForward: false,
    Limit: limit,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []) as Action[];
  } catch (error) {
    console.error("Error fetching actions by status:", error);
    throw error;
  }
};

// Create new action
export const createDbAction = async (
  userId: string,
  type: ActionType,
  title: string,
  description: string,
  details?: string,
  amount?: number,
  currency?: string,
  metadata?: Record<string, unknown>
): Promise<Action> => {
  const actionId = uuidv4();
  const now = new Date().toISOString();

  const action = {
    pk: createActionPK(userId),
    sk: createActionSK(actionId),
    gsi1pk: `STATUS#pending`,
    gsi1sk: now,
    actionId,
    userId,
    type,
    status: "pending" as ActionStatus,
    title,
    description,
    ...(details && { details }),
    ...(amount !== undefined && { amount }),
    ...(currency && { currency }),
    ...(metadata && { metadata }),
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLE_NAME,
    Item: action,
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return action;
  } catch (error) {
    console.error("Error creating action:", error);
    throw error;
  }
};

// Update action status
export const updateDbActionStatus = async (
  userId: string,
  actionId: string,
  status: ActionStatus
): Promise<Action | null> => {
  const now = new Date().toISOString();
  const updateExpressions = ["#status = :status", "#updatedAt = :updatedAt", "gsi1pk = :gsi1pk"];
  const expressionAttributeValues: Record<string, unknown> = {
    ":status": status,
    ":updatedAt": now,
    ":gsi1pk": `STATUS#${status}`,
  };

  if (status === "completed" || status === "failed") {
    updateExpressions.push("#completedAt = :completedAt");
    expressionAttributeValues[":completedAt"] = now;
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createActionPK(userId),
      sk: createActionSK(actionId),
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: {
      "#status": "status",
      "#updatedAt": "updatedAt",
      ...(status === "completed" || status === "failed" ? { "#completedAt": "completedAt" } : {}),
    },
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return response.Attributes as Action;
  } catch (error) {
    console.error("Error updating action status:", error);
    throw error;
  }
};

// Get pending actions count for user
export const getDbPendingActionsCount = async (userId: string): Promise<number> => {
  const actions = await getDbActionsByStatus(userId, "pending", 100);
  return actions.length;
};
