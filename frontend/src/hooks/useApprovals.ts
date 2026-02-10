import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import type { Action } from "./useActions";

const APPROVALS_QUERY_KEY = "approvals";
const ACTIONS_QUERY_KEY = "actions";

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
  failed: number;
}

// Get pending approvals
export const usePendingApprovals = (limit: number = 50) => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, "pending", limit],
    queryFn: async () => {
      const response = await apiClient.get<Action[]>(`/approvals?limit=${limit}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch pending approvals");
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Get approval stats
export const useApprovalStats = () => {
  return useQuery({
    queryKey: [APPROVALS_QUERY_KEY, "stats"],
    queryFn: async () => {
      const response = await apiClient.get<ApprovalStats>("/approvals/stats");
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch approval stats");
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

// Approve action
export const useApproveAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiClient.post<Action>(`/approvals/${actionId}/approve`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to approve action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIONS_QUERY_KEY] });
    },
  });
};

// Reject action
export const useRejectAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionId: string) => {
      const response = await apiClient.post<Action>(`/approvals/${actionId}/reject`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to reject action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIONS_QUERY_KEY] });
    },
  });
};

// Bulk approve actions
export const useBulkApprove = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actionIds: string[]) => {
      const response = await apiClient.post<{
        approved: number;
        failed: number;
        total: number;
      }>("/approvals/bulk/approve", { actionIds });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to bulk approve actions");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPROVALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIONS_QUERY_KEY] });
    },
  });
};

export type { ApprovalStats };
