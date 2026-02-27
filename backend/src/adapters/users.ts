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
  phoneNumber?: string;
  phoneVerified?: boolean;
  phoneVerificationCode?: string;
  phoneVerificationExpiry?: string;
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

// Get user by phone number
export const getDbUserByPhoneNumber = async (phoneNumber: string): Promise<User | null> => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: "gsi2",
    KeyConditionExpression: "gsi2pk = :gsi2pk",
    ExpressionAttributeValues: {
      ":gsi2pk": `PHONE#${phoneNumber}`,
    },
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    if (response.Items && response.Items.length > 0) {
      return response.Items[0] as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by phone number:", error);
    throw error;
  }
};

// Update user phone number
export const updateDbUserPhoneNumber = async (
  userId: string,
  phoneNumber: string
): Promise<User | null> => {
  // Generate verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createUserPK(userId),
      sk: createUserSK(),
    },
    UpdateExpression:
      "SET #phoneNumber = :phoneNumber, #phoneVerified = :phoneVerified, #phoneVerificationCode = :code, #phoneVerificationExpiry = :expiry, #gsi2pk = :gsi2pk, #updatedAt = :updatedAt",
    ExpressionAttributeNames: {
      "#phoneNumber": "phoneNumber",
      "#phoneVerified": "phoneVerified",
      "#phoneVerificationCode": "phoneVerificationCode",
      "#phoneVerificationExpiry": "phoneVerificationExpiry",
      "#gsi2pk": "gsi2pk",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":phoneNumber": phoneNumber,
      ":phoneVerified": false,
      ":code": verificationCode,
      ":expiry": expiry,
      ":gsi2pk": `PHONE#${phoneNumber}`,
      ":updatedAt": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW" as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return response.Attributes as User;
  } catch (error) {
    console.error("Error updating user phone number:", error);
    throw error;
  }
};

// Verify user phone number
export const updateDbUserPhoneVerification = async (
  userId: string,
  code: string
): Promise<boolean> => {
  // First get the user to check the code
  const user = await getDbUserById(userId);

  if (!user) {
    return false;
  }

  // Check if code matches and hasn't expired
  if (
    user.phoneVerificationCode !== code ||
    !user.phoneVerificationExpiry ||
    new Date(user.phoneVerificationExpiry) < new Date()
  ) {
    return false;
  }

  // Update user as verified
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: createUserPK(userId),
      sk: createUserSK(),
    },
    UpdateExpression:
      "SET #phoneVerified = :phoneVerified, #updatedAt = :updatedAt REMOVE #phoneVerificationCode, #phoneVerificationExpiry",
    ExpressionAttributeNames: {
      "#phoneVerified": "phoneVerified",
      "#phoneVerificationCode": "phoneVerificationCode",
      "#phoneVerificationExpiry": "phoneVerificationExpiry",
      "#updatedAt": "updatedAt",
    },
    ExpressionAttributeValues: {
      ":phoneVerified": true,
      ":updatedAt": new Date().toISOString(),
    },
  };

  try {
    await dynamodb.send(new UpdateCommand(params));
    return true;
  } catch (error) {
    console.error("Error verifying user phone:", error);
    return false;
  }
};
