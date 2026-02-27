import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/api";

// Types
export interface BankConnection {
  connectionId: string;
  institutionId: string;
  institutionName: string;
  institutionLogo: string | null;
  status: "active" | "error" | "disconnected";
  lastSyncAt: string | null;
  createdAt: string;
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
}

export interface SpendingSummary {
  period: { startDate: string; endDate: string };
  totalSpending: number;
  totalIncome: number;
  netCashFlow: number;
  byCategory: { category: string; amount: number }[];
  transactionCount: number;
}

const CONNECTIONS_KEY = "bank-connections";
const ACCOUNTS_KEY = "bank-accounts";
const TRANSACTIONS_KEY = "bank-transactions";
const SPENDING_KEY = "spending-summary";

// Get Plaid Link token
export const useLinkToken = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<{ linkToken: string }>("/banking/link-token");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to get link token");
      }
      return response.data?.linkToken;
    },
  });
};

// Connect bank
export const useConnectBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { publicToken: string; institutionId: string }) => {
      const response = await apiClient.post<{
        connectionId: string;
        institutionName: string;
        accountCount: number;
      }>("/banking/connect", params);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to connect bank");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONNECTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] });
    },
  });
};

// Get bank connections
export const useBankConnections = () => {
  return useQuery({
    queryKey: [CONNECTIONS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<BankConnection[]>("/banking/connections");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch connections");
      }
      return response.data || [];
    },
  });
};

// Disconnect bank
export const useDisconnectBank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiClient.delete(`/banking/connections/${connectionId}`);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to disconnect bank");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONNECTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
    },
  });
};

// Get bank accounts
export const useBankAccounts = () => {
  return useQuery({
    queryKey: [ACCOUNTS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<BankAccount[]>("/banking/accounts");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch accounts");
      }
      return response.data || [];
    },
  });
};

// Sync transactions
export const useSyncTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiClient.post<{
        added: number;
        modified: number;
        removed: number;
      }>(`/banking/connections/${connectionId}/sync`);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to sync transactions");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SPENDING_KEY] });
    },
  });
};

// Get transactions
export const useTransactions = (params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  const queryString = new URLSearchParams();
  if (params?.startDate) queryString.set("startDate", params.startDate);
  if (params?.endDate) queryString.set("endDate", params.endDate);
  if (params?.limit) queryString.set("limit", params.limit.toString());

  const queryParams = queryString.toString();
  const endpoint = queryParams ? `/banking/transactions?${queryParams}` : "/banking/transactions";

  return useQuery({
    queryKey: [TRANSACTIONS_KEY, params],
    queryFn: async () => {
      const response = await apiClient.get<Transaction[]>(endpoint);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch transactions");
      }
      return response.data || [];
    },
  });
};

// Get spending summary
export const useSpendingSummary = () => {
  return useQuery({
    queryKey: [SPENDING_KEY],
    queryFn: async () => {
      const response = await apiClient.get<SpendingSummary>("/banking/spending/summary");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch spending summary");
      }
      return response.data;
    },
  });
};
