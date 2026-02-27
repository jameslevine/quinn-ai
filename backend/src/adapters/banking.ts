import { v4 as uuidv4 } from "uuid";
import { dynamodb, TABLE_NAME } from "./dynamodb";
import {
  PutCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// Types
export interface BankConnection {
  connectionId: string;
  userId: string;
  itemId: string; // Plaid item ID
  accessToken: string; // Encrypted in production
  institutionId: string;
  institutionName: string;
  institutionLogo: string | null;
  status: "active" | "error" | "disconnected";
  lastSyncAt: string | null;
  syncCursor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  accountId: string;
  connectionId: string;
  userId: string;
  plaidAccountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  limitBalance: number | null;
  isoCurrencyCode: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  userId: string;
  plaidTransactionId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  categoryId: string | null;
  customCategory: string | null;
  pending: boolean;
  isoCurrencyCode: string | null;
  paymentChannel: string;
  location: {
    address: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

// Bank Connection functions
export const createDbBankConnection = async (
  userId: string,
  itemId: string,
  accessToken: string,
  institutionId: string,
  institutionName: string,
  institutionLogo: string | null
): Promise<BankConnection> => {
  const connectionId = uuidv4();
  const now = new Date().toISOString();

  const connection: BankConnection = {
    connectionId,
    userId,
    itemId,
    accessToken,
    institutionId,
    institutionName,
    institutionLogo,
    status: "active",
    lastSyncAt: null,
    syncCursor: null,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `BANK_CONNECTION#${connectionId}`,
        gsi1pk: `BANK_CONNECTION#${itemId}`,
        gsi1sk: `USER#${userId}`,
        ...connection,
      },
    })
  );

  return connection;
};

export const getDbBankConnectionsByUserId = async (userId: string): Promise<BankConnection[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "BANK_CONNECTION#",
      },
    })
  );

  return (result.Items || []) as BankConnection[];
};

export const getDbBankConnectionById = async (
  userId: string,
  connectionId: string
): Promise<BankConnection | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `BANK_CONNECTION#${connectionId}`,
      },
    })
  );

  return (result.Item as BankConnection) || null;
};

export const updateDbBankConnectionSyncCursor = async (
  userId: string,
  connectionId: string,
  syncCursor: string
): Promise<void> => {
  const now = new Date().toISOString();

  await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `BANK_CONNECTION#${connectionId}`,
      },
      UpdateExpression: "SET syncCursor = :cursor, lastSyncAt = :lastSync, updatedAt = :updated",
      ExpressionAttributeValues: {
        ":cursor": syncCursor,
        ":lastSync": now,
        ":updated": now,
      },
    })
  );
};

export const deleteDbBankConnection = async (
  userId: string,
  connectionId: string
): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `BANK_CONNECTION#${connectionId}`,
      },
    })
  );
};

// Bank Account functions
export const upsertDbBankAccount = async (
  userId: string,
  connectionId: string,
  plaidAccountId: string,
  data: {
    name: string;
    officialName: string | null;
    type: string;
    subtype: string | null;
    mask: string | null;
    currentBalance: number | null;
    availableBalance: number | null;
    limitBalance: number | null;
    isoCurrencyCode: string | null;
  }
): Promise<BankAccount> => {
  const now = new Date().toISOString();

  // Check if account exists
  const existing = await getDbBankAccountByPlaidId(userId, plaidAccountId);

  if (existing) {
    // Update existing account
    await dynamodb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: `USER#${userId}`,
          sk: `BANK_ACCOUNT#${existing.accountId}`,
        },
        UpdateExpression: `SET 
          #name = :name, 
          officialName = :officialName,
          currentBalance = :currentBalance,
          availableBalance = :availableBalance,
          limitBalance = :limitBalance,
          updatedAt = :updated`,
        ExpressionAttributeNames: {
          "#name": "name",
        },
        ExpressionAttributeValues: {
          ":name": data.name,
          ":officialName": data.officialName,
          ":currentBalance": data.currentBalance,
          ":availableBalance": data.availableBalance,
          ":limitBalance": data.limitBalance,
          ":updated": now,
        },
      })
    );

    return { ...existing, ...data, updatedAt: now };
  }

  // Create new account
  const accountId = uuidv4();
  const account: BankAccount = {
    accountId,
    connectionId,
    userId,
    plaidAccountId,
    ...data,
    isHidden: false,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `BANK_ACCOUNT#${accountId}`,
        gsi1pk: `CONNECTION#${connectionId}`,
        gsi1sk: `BANK_ACCOUNT#${accountId}`,
        gsi2pk: `PLAID_ACCOUNT#${plaidAccountId}`,
        gsi2sk: `USER#${userId}`,
        ...account,
      },
    })
  );

  return account;
};

export const getDbBankAccountsByUserId = async (userId: string): Promise<BankAccount[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "BANK_ACCOUNT#",
      },
    })
  );

  return (result.Items || []) as BankAccount[];
};

export const getDbBankAccountByPlaidId = async (
  userId: string,
  plaidAccountId: string
): Promise<BankAccount | null> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :pk AND gsi2sk = :sk",
      ExpressionAttributeValues: {
        ":pk": `PLAID_ACCOUNT#${plaidAccountId}`,
        ":sk": `USER#${userId}`,
      },
    })
  );

  return (result.Items?.[0] as BankAccount) || null;
};

// Transaction functions
export const upsertDbTransaction = async (
  userId: string,
  accountId: string,
  plaidTransactionId: string,
  data: {
    amount: number;
    date: string;
    name: string;
    merchantName: string | null;
    category: string[];
    categoryId: string | null;
    pending: boolean;
    isoCurrencyCode: string | null;
    paymentChannel: string;
    location: {
      address: string | null;
      city: string | null;
      region: string | null;
      postalCode: string | null;
      country: string | null;
    };
  }
): Promise<Transaction> => {
  const now = new Date().toISOString();
  const transactionId = uuidv4();

  const transaction: Transaction = {
    transactionId,
    accountId,
    userId,
    plaidTransactionId,
    ...data,
    customCategory: null,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `TRANSACTION#${data.date}#${transactionId}`,
        gsi1pk: `ACCOUNT#${accountId}`,
        gsi1sk: `TRANSACTION#${data.date}#${transactionId}`,
        gsi2pk: `PLAID_TX#${plaidTransactionId}`,
        gsi2sk: `USER#${userId}`,
        ...transaction,
      },
    })
  );

  return transaction;
};

export const getDbTransactionsByUserId = async (
  userId: string,
  options?: { startDate?: string; endDate?: string; limit?: number }
): Promise<Transaction[]> => {
  const params: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
    ExpressionAttributeValues: {
      ":pk": `USER#${userId}`,
      ":sk": "TRANSACTION#",
    },
    ScanIndexForward: false, // Most recent first
    Limit: options?.limit || 100,
  };

  if (options?.startDate && options?.endDate) {
    params.KeyConditionExpression = "pk = :pk AND sk BETWEEN :start AND :end";
    params.ExpressionAttributeValues[":start"] = `TRANSACTION#${options.startDate}`;
    params.ExpressionAttributeValues[":end"] = `TRANSACTION#${options.endDate}~`;
  }

  const result = await dynamodb.send(new QueryCommand(params));
  return (result.Items || []) as Transaction[];
};

export const getDbTransactionsByAccountId = async (
  accountId: string,
  options?: { limit?: number }
): Promise<Transaction[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi1",
      KeyConditionExpression: "gsi1pk = :pk AND begins_with(gsi1sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `ACCOUNT#${accountId}`,
        ":sk": "TRANSACTION#",
      },
      ScanIndexForward: false,
      Limit: options?.limit || 100,
    })
  );

  return (result.Items || []) as Transaction[];
};

export const deleteDbTransactionByPlaidId = async (
  userId: string,
  plaidTransactionId: string
): Promise<void> => {
  // First find the transaction
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "gsi2",
      KeyConditionExpression: "gsi2pk = :pk AND gsi2sk = :sk",
      ExpressionAttributeValues: {
        ":pk": `PLAID_TX#${plaidTransactionId}`,
        ":sk": `USER#${userId}`,
      },
    })
  );

  if (result.Items && result.Items.length > 0) {
    const tx = result.Items[0] as Transaction;
    await dynamodb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: `USER#${userId}`,
          sk: `TRANSACTION#${tx.date}#${tx.transactionId}`,
        },
      })
    );
  }
};
