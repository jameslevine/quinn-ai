import { v4 as uuidv4 } from "uuid";
import {
  dynamodb,
  TABLE_NAME,
  KEY_PREFIXES,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "./dynamodb";

// Integration types
export type IntegrationType = "gmail" | "outlook" | "google_calendar" | "bank" | "twilio";
export type IntegrationStatus = "connected" | "disconnected" | "expired" | "error";

export interface Integration {
  integrationId: string;
  userId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  email?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

// Create PK and SK for integration
const createIntegrationPK = (userId: string) => `${KEY_PREFIXES.USER}${userId}`;
const createIntegrationSK = (type: IntegrationType) => `${KEY_PREFIXES.INTEGRATION}${type}`;

// Get integration by type
export const getDbIntegrationByType = async (
  userId: string,
  type: IntegrationType
): Promise<Integration | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createIntegrationPK(userId),
      sk: createIntegrationSK(type),
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return response.Item as Integration | null;
  } catch (error) {
    console.error("Error fetching integration:", error);
    throw error;
  }
};

// Get all integrations for user
export const getDbIntegrationsByUserId = async (userId: string): Promise<Integration[]> => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
    ExpressionAttributeValues: {
      ":pk": createIntegrationPK(userId),
      ":skPrefix": KEY_PREFIXES.INTEGRATION,
    },
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []) as Integration[];
  } catch (error) {
    console.error("Error fetching integrations:", error);
    throw error;
  }
};

// Create or update integration
export const upsertDbIntegration = async (
  userId: string,
  type: IntegrationType,
  data: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: string;
    email?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<Integration> => {
  const now = new Date().toISOString();
  const existing = await getDbIntegrationByType(userId, type);

  const integration = {
    pk: createIntegrationPK(userId),
    sk: createIntegrationSK(type),
    integrationId: existing?.integrationId || uuidv4(),
    userId,
    type,
    status: "connected" as IntegrationStatus,
    ...(data.accessToken && { accessToken: data.accessToken }),
    ...(data.refreshToken && { refreshToken: data.refreshToken }),
    ...(data.tokenExpiry && { tokenExpiry: data.tokenExpiry }),
    ...(data.email && { email: data.email }),
    ...(data.metadata && { metadata: data.metadata }),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastSyncAt: now,
  };

  const params = {
    TableName: TABLE_NAME,
    Item: integration,
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return integration;
  } catch (error) {
    console.error("Error upserting integration:", error);
    throw error;
  }
};

// Update integration status
export const updateDbIntegrationStatus = async (
  userId: string,
  type: IntegrationType,
  status: IntegrationStatus
): Promise<Integration | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createIntegrationPK(userId),
      sk: createIntegrationSK(type),
    },
    UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#status": "status",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return response.Attributes as Integration;
  } catch (error) {
    console.error("Error updating integration status:", error);
    throw error;
  }
};

// Delete integration
export const deleteDbIntegration = async (userId: string, type: IntegrationType): Promise<void> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createIntegrationPK(userId),
      sk: createIntegrationSK(type),
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error("Error deleting integration:", error);
    throw error;
  }
};

// Update tokens (for refresh)
export const updateDbIntegrationTokens = async (
  userId: string,
  type: IntegrationType,
  accessToken: string,
  tokenExpiry: string,
  refreshToken?: string
): Promise<Integration | null> => {
  const updateExpressions = [
    "#accessToken = :accessToken",
    "#tokenExpiry = :tokenExpiry",
    "#updatedAt = :updatedAt",
    "#status = :status",
  ];
  const expressionAttributeNames: Record<string, string> = {
    "#accessToken": "accessToken",
    "#tokenExpiry": "tokenExpiry",
    "#updatedAt": "updatedAt",
    "#status": "status",
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ":accessToken": accessToken,
    ":tokenExpiry": tokenExpiry,
    ":updatedAt": new Date().toISOString(),
    ":status": "connected",
  };

  if (refreshToken) {
    updateExpressions.push("#refreshToken = :refreshToken");
    expressionAttributeNames["#refreshToken"] = "refreshToken";
    expressionAttributeValues[":refreshToken"] = refreshToken;
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createIntegrationPK(userId),
      sk: createIntegrationSK(type),
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return response.Attributes as Integration;
  } catch (error) {
    console.error("Error updating integration tokens:", error);
    throw error;
  }
};
