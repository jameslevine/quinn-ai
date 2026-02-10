import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";

// Types
export type IntegrationType = "gmail" | "outlook" | "google_calendar" | "bank" | "twilio";
export type IntegrationStatus = "connected" | "disconnected" | "expired" | "error";

export interface Integration {
  integrationId: string;
  type: IntegrationType;
  status: IntegrationStatus;
  email?: string;
  createdAt: string;
  lastSyncAt?: string;
}

const INTEGRATIONS_QUERY_KEY = "integrations";

// Get all integrations
export const useIntegrations = () => {
  return useQuery({
    queryKey: [INTEGRATIONS_QUERY_KEY],
    queryFn: async () => {
      const response = await apiClient.get<Integration[]>("/integrations");
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch integrations");
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

// Get Gmail auth URL
export const useGmailAuthUrl = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.get<{ authUrl: string }>("/integrations/gmail/auth");
      if (response.success && response.data) {
        return response.data.authUrl;
      }
      throw new Error(response.error?.message || "Failed to get Gmail auth URL");
    },
  });
};

// Disconnect integration
export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: IntegrationType) => {
      const response = await apiClient.delete(`/integrations/${type}`);
      if (response.success) {
        return true;
      }
      throw new Error(response.error?.message || "Failed to disconnect integration");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_QUERY_KEY] });
    },
  });
};

// Helper to check if integration is connected
export const isIntegrationConnected = (
  integrations: Integration[] | undefined,
  type: IntegrationType
): boolean => {
  if (!integrations) return false;
  const integration = integrations.find((i) => i.type === type);
  return integration?.status === "connected";
};

// Helper to get integration by type
export const getIntegration = (
  integrations: Integration[] | undefined,
  type: IntegrationType
): Integration | undefined => {
  if (!integrations) return undefined;
  return integrations.find((i) => i.type === type);
};
