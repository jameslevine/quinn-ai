import { Router, Request, Response } from "express";
import { getOrCreateDbUser } from "../adapters/users";
import {
  createDbBankConnection,
  getDbBankConnectionsByUserId,
  getDbBankConnectionById,
  deleteDbBankConnection,
  updateDbBankConnectionSyncCursor,
  upsertDbBankAccount,
  getDbBankAccountsByUserId,
  upsertDbTransaction,
  getDbTransactionsByUserId,
  deleteDbTransactionByPlaidId,
} from "../adapters/banking";
import {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getInstitution,
  removeItem,
  syncTransactions,
} from "../lib/plaid";

export const bankingRouter: Router = Router();

// Create Plaid Link token
bankingRouter.post("/link-token", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;
    if (!cognitoSub || !email) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid user data" },
      });
    }
    const user = await getOrCreateDbUser(cognitoSub, email);

    const linkToken = await createLinkToken(user.userId);

    res.json({
      success: true,
      data: { linkToken },
    });
  } catch (error) {
    console.error("Error creating link token:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to create link token" },
    });
  }
});

// Exchange public token and connect bank
bankingRouter.post("/connect", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;
    if (!cognitoSub || !email) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid user data" },
      });
    }
    const user = await getOrCreateDbUser(cognitoSub, email);

    const { publicToken, institutionId } = req.body;

    if (!publicToken || !institutionId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "publicToken and institutionId are required" },
      });
    }

    // Exchange public token for access token
    const { accessToken, itemId } = await exchangePublicToken(publicToken);

    // Get institution info
    const institution = await getInstitution(institutionId);

    // Save bank connection
    const connection = await createDbBankConnection(
      user.userId,
      itemId,
      accessToken,
      institutionId,
      institution.name,
      institution.logo
    );

    // Get and save accounts
    const accounts = await getAccounts(accessToken);
    for (const account of accounts) {
      await upsertDbBankAccount(user.userId, connection.connectionId, account.accountId, {
        name: account.name,
        officialName: account.officialName,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        currentBalance: account.balances.current,
        availableBalance: account.balances.available,
        limitBalance: account.balances.limit,
        isoCurrencyCode: account.balances.isoCurrencyCode,
      });
    }

    res.json({
      success: true,
      data: {
        connectionId: connection.connectionId,
        institutionName: institution.name,
        accountCount: accounts.length,
      },
      message: "Bank connected successfully",
    });
  } catch (error) {
    console.error("Error connecting bank:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to connect bank" },
    });
  }
});

// Get all bank connections
bankingRouter.get("/connections", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub as string;
    const email = (req.user.email || req.user["cognito:username"]) as string;
    if (!cognitoSub || !email) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid user data" },
      });
    }
    const user = await getOrCreateDbUser(cognitoSub, email);

    const connections = await getDbBankConnectionsByUserId(user.userId);

    // Remove sensitive data
    const safeConnections = connections.map((conn) => ({
      connectionId: conn.connectionId,
      institutionId: conn.institutionId,
      institutionName: conn.institutionName,
      institutionLogo: conn.institutionLogo,
      status: conn.status,
      lastSyncAt: conn.lastSyncAt,
      createdAt: conn.createdAt,
    }));

    res.json({
      success: true,
      data: safeConnections,
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch connections" },
    });
  }
});

// Disconnect bank
bankingRouter.delete("/connections/:connectionId", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub;
    const email = req.user.email;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const connectionId = req.params.connectionId;
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "connectionId is required" },
      });
    }

    const connection = await getDbBankConnectionById(user.userId, connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found" },
      });
    }

    // Remove from Plaid
    try {
      await removeItem(connection.accessToken);
    } catch (e) {
      console.warn("Failed to remove item from Plaid:", e);
    }

    // Delete from database
    await deleteDbBankConnection(user.userId, connectionId);

    res.json({
      success: true,
      message: "Bank disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting bank:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to disconnect bank" },
    });
  }
});

// Get all accounts
bankingRouter.get("/accounts", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub;
    const email = req.user.email;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const accounts = await getDbBankAccountsByUserId(user.userId);

    res.json({
      success: true,
      data: accounts.filter((a) => !a.isHidden),
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch accounts" },
    });
  }
});

// Sync transactions for a connection
bankingRouter.post("/connections/:connectionId/sync", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub;
    const email = req.user.email;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const connectionId = req.params.connectionId;
    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "connectionId is required" },
      });
    }

    const connection = await getDbBankConnectionById(user.userId, connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found" },
      });
    }

    // Get accounts for this connection
    const accounts = await getDbBankAccountsByUserId(user.userId);
    const connectionAccounts = accounts.filter((a) => a.connectionId === connectionId);
    const accountMap = new Map(connectionAccounts.map((a) => [a.plaidAccountId, a.accountId]));

    // Sync transactions
    let cursor = connection.syncCursor || undefined;
    let hasMore = true;
    let addedCount = 0;
    let modifiedCount = 0;
    let removedCount = 0;

    while (hasMore) {
      const result = await syncTransactions(connection.accessToken, cursor);

      // Process added transactions
      for (const tx of result.added) {
        const accountId = accountMap.get(tx.accountId);
        if (accountId) {
          await upsertDbTransaction(user.userId, accountId, tx.transactionId, {
            amount: tx.amount,
            date: tx.date,
            name: tx.name,
            merchantName: tx.merchantName,
            category: tx.category,
            categoryId: tx.categoryId,
            pending: tx.pending,
            isoCurrencyCode: tx.isoCurrencyCode,
            paymentChannel: tx.paymentChannel,
            location: tx.location,
          });
          addedCount++;
        }
      }

      // Process modified transactions
      for (const tx of result.modified) {
        const accountId = accountMap.get(tx.accountId);
        if (accountId) {
          await upsertDbTransaction(user.userId, accountId, tx.transactionId, {
            amount: tx.amount,
            date: tx.date,
            name: tx.name,
            merchantName: tx.merchantName,
            category: tx.category,
            categoryId: tx.categoryId,
            pending: tx.pending,
            isoCurrencyCode: tx.isoCurrencyCode,
            paymentChannel: tx.paymentChannel,
            location: tx.location,
          });
          modifiedCount++;
        }
      }

      // Process removed transactions
      for (const txId of result.removed) {
        await deleteDbTransactionByPlaidId(user.userId, txId);
        removedCount++;
      }

      cursor = result.nextCursor;
      hasMore = result.hasMore;
    }

    // Update sync cursor
    if (cursor) {
      await updateDbBankConnectionSyncCursor(user.userId, connectionId, cursor);
    }

    res.json({
      success: true,
      data: {
        added: addedCount,
        modified: modifiedCount,
        removed: removedCount,
      },
      message: "Transactions synced successfully",
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to sync transactions" },
    });
  }
});

// Get transactions
bankingRouter.get("/transactions", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub;
    const email = req.user.email;
    const user = await getOrCreateDbUser(cognitoSub, email);

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    const transactions = await getDbTransactionsByUserId(user.userId, {
      startDate,
      endDate,
      limit,
    });

    res.json({
      success: true,
      data: transactions,
      meta: {
        count: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch transactions" },
    });
  }
});

// Get spending summary
bankingRouter.get("/spending/summary", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      });
    }

    const cognitoSub = req.user.sub;
    const email = req.user.email;
    const user = await getOrCreateDbUser(cognitoSub, email);

    // Get transactions for the last 30 days
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const transactions = await getDbTransactionsByUserId(user.userId, {
      startDate,
      endDate,
      limit: 500,
    });

    // Calculate spending by category
    const categorySpending: Record<string, number> = {};
    let totalSpending = 0;
    let totalIncome = 0;

    for (const tx of transactions) {
      if (tx.pending) continue;

      if (tx.amount > 0) {
        // Positive amounts are expenses in Plaid
        totalSpending += tx.amount;
        const category = tx.category[0] || "Other";
        categorySpending[category] = (categorySpending[category] || 0) + tx.amount;
      } else {
        // Negative amounts are income
        totalIncome += Math.abs(tx.amount);
      }
    }

    // Sort categories by spending
    const sortedCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalSpending,
        totalIncome,
        netCashFlow: totalIncome - totalSpending,
        byCategory: sortedCategories,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching spending summary:", error);
    res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch spending summary" },
    });
  }
});

export default bankingRouter;
