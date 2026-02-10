import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";

// Types
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

interface ActionsResponse {
  data: Action[];
  meta: {
    count: number;
    hasMore: boolean;
  };
}

const ACTIONS_QUERY_KEY = "actions";

// Get all actions
export const useActions = (status?: ActionStatus, limit: number = 50) => {
  return useQuery({
    queryKey: [ACTIONS_QUERY_KEY, { status, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      params.append("limit", limit.toString());

      const response = await apiClient.get<ActionsResponse["data"]>(
        `/actions?${params.toString()}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch actions");
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Get single action
export const useAction = (actionId: string) => {
  return useQuery({
    queryKey: [ACTIONS_QUERY_KEY, actionId],
    queryFn: async () => {
      const response = await apiClient.get<Action>(`/actions/${actionId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch action");
    },
    enabled: !!actionId,
  });
};

// Create action
export const useCreateAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: ActionType;
      title: string;
      description: string;
      details?: string;
      amount?: number;
      currency?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await apiClient.post<Action>("/actions", data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to create action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIONS_QUERY_KEY] });
    },
  });
};

// Update action status
export const useUpdateActionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ actionId, status }: { actionId: string; status: ActionStatus }) => {
      const response = await apiClient.patch<Action>(`/actions/${actionId}/status`, { status });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to update action status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIONS_QUERY_KEY] });
    },
  });
};
