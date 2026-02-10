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

// User types
export interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  cognitoSub: string;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  approvalModes: {
    email: "suggest" | "auto_review" | "full_auto";
    call: "suggest" | "auto_review";
    payment: "suggest" | "auto_review";
    food: "suggest" | "auto_review" | "full_auto";
  };
  spendingLimits: {
    perTransaction: number;
    daily: number;
    monthly: number;
  };
  theme: "light" | "dark";
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  approvalModes: {
    email: "suggest",
    call: "suggest",
    payment: "suggest",
    food: "suggest",
  },
  spendingLimits: {
    perTransaction: 50,
    daily: 100,
    monthly: 500,
  },
  theme: "light",
};

// Create PK and SK for user
const createUserPK = (userId: string) => `${KEY_PREFIXES.USER}${userId}`;
const createUserSK = () => "PROFILE";

// Get user by ID
export const getDbUserById = async (userId: string): Promise<User | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createUserPK(userId),
      sk: createUserSK(),
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return response.Item as User | null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

// Get user by Cognito sub
export const getDbUserByCognitoSub = async (cognitoSub: string): Promise<User | null> => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "gsi1",
    KeyConditionExpression: "gsi1pk = :gsi1pk",
    ExpressionAttributeValues: {
      ":gsi1pk": `COGNITO#${cognitoSub}`,
    },
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    if (response.Items && response.Items.length > 0) {
      return response.Items[0] as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by Cognito sub:", error);
    throw error;
  }
};

// Create new user
export const createDbUser = async (
  cognitoSub: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<User> => {
  const userId = uuidv4();
  const now = new Date().toISOString();

  const user = {
    pk: createUserPK(userId),
    sk: createUserSK(),
    gsi1pk: `COGNITO#${cognitoSub}`,
    gsi1sk: "USER",
    userId,
    email,
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    cognitoSub,
    settings: DEFAULT_SETTINGS,
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLE_NAME,
    Item: user,
    ConditionExpression: "attribute_not_exists(pk)",
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Update user profile
export const updateDbUserProfile = async (
  userId: string,
  updates: Partial<Pick<User, "firstName" | "lastName">>
): Promise<User | null> => {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = {
    "#updatedAt": "updatedAt",
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  if (updates.firstName !== undefined) {
    updateExpressions.push("#firstName = :firstName");
    expressionAttributeNames["#firstName"] = "firstName";
    expressionAttributeValues[":firstName"] = updates.firstName;
  }

  if (updates.lastName !== undefined) {
    updateExpressions.push("#lastName = :lastName");
    expressionAttributeNames["#lastName"] = "lastName";
    expressionAttributeValues[":lastName"] = updates.lastName;
  }

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createUserPK(userId),
      sk: createUserSK(),
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return response.Attributes as User;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Update user settings
export const updateDbUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<User | null> => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createUserPK(userId),
      sk: createUserSK(),
    },
    UpdateExpression: "SET #settings = :settings, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#settings": "settings",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":settings": settings,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return response.Attributes as User;
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

// Get or create user (for first login)
export const getOrCreateDbUser = async (cognitoSub: string, email: string): Promise<User> => {
  const existingUser = await getDbUserByCognitoSub(cognitoSub);
  if (existingUser) {
    return existingUser;
  }
  return createDbUser(cognitoSub, email);
};
