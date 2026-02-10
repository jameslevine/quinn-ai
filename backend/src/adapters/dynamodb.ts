import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-west-2",
});

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE || "quinn-main-dev";

// Key prefixes for single-table design
export const KEY_PREFIXES = {
  USER: "USER#",
  ACTION: "ACTION#",
  APPROVAL: "APPROVAL#",
  INTEGRATION: "INTEGRATION#",
  EMAIL: "EMAIL#",
  SETTING: "SETTING#",
} as const;

// GSI names
export const GSI = {
  GSI1: "gsi1",
  GSI2: "gsi2",
} as const;

export { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand };
