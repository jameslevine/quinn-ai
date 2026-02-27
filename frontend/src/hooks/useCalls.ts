import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";

// Types
export type CallStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export type CallType =
  | "appointment_booking"
  | "customer_service"
  | "bill_negotiation"
  | "order_followup"
  | "general_inquiry";

export interface CallOutcome {
  success: boolean;
  summary: string;
  appointmentBooked?: {
    date: string;
    time: string;
    confirmationNumber?: string;
  };
  followUpRequired: boolean;
  followUpNotes?: string;
}

export interface CallRecord {
  callId: string;
  contactId?: string;
  userId: string;
  direction: "outbound" | "inbound";
  to: string;
  from: string;
  purpose: string;
  scriptType: CallType;
  status: CallStatus;
  connectStatus?: string;
  duration?: number;
  recordingUrl?: string;
  transcriptUrl?: string;
  transcript?: string;
  outcome?: CallOutcome;
  notes?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptTemplate {
  type: CallType;
  name: string;
  description: string;
  requiredVariables: string[];
}

export interface Voice {
  id: string;
  name: string;
  gender: string;
}

// Query keys
const CALLS_QUERY_KEY = "calls";

// Get all calls
export const useCalls = (options = {}) => {
  return useQuery({
    queryKey: [CALLS_QUERY_KEY],
    queryFn: async () => {
      const response = await apiClient.get<{
        calls: CallRecord[];
        nextCursor?: string;
      }>("/calls");
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch calls");
    },
    ...options,
  });
};

// Get pending calls
export const usePendingCalls = (options = {}) => {
  return useQuery({
    queryKey: [CALLS_QUERY_KEY, "pending"],
    queryFn: async () => {
      const response = await apiClient.get<{ calls: CallRecord[] }>("/calls/pending");
      if (response.success && response.data) {
        return response.data.calls;
      }
      throw new Error(response.error?.message || "Failed to fetch pending calls");
    },
    ...options,
  });
};

// Get a specific call
export const useCall = (callId: string | null, options = {}) => {
  return useQuery({
    queryKey: [CALLS_QUERY_KEY, callId],
    queryFn: async () => {
      if (!callId) return null;
      const response = await apiClient.get<CallRecord>(`/calls/${callId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch call");
    },
    enabled: !!callId,
    ...options,
  });
};

// Create a new call
export const useCreateCall = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      to: string;
      purpose: string;
      scriptType: CallType;
      variables?: Record<string, string>;
      scheduledAt?: string;
      notes?: string;
    }) => {
      const response = await apiClient.post<CallRecord>("/calls", data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to create call");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALLS_QUERY_KEY] });
    },
    ...options,
  });
};

// Approve or reject a call
export const useApproveCall = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callId, approved }: { callId: string; approved: boolean }) => {
      const response = await apiClient.post<CallRecord>(`/calls/${callId}/approve`, { approved });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to approve call");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALLS_QUERY_KEY] });
    },
    ...options,
  });
};

// End a call
export const useEndCall = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      const response = await apiClient.post<CallRecord>(`/calls/${callId}/end`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to end call");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALLS_QUERY_KEY] });
    },
    ...options,
  });
};

// Get call status
export const useCallStatus = (callId: string | null, options = {}) => {
  return useQuery({
    queryKey: [CALLS_QUERY_KEY, callId, "status"],
    queryFn: async () => {
      if (!callId) return null;
      const response = await apiClient.get<{ status: CallStatus; connectStatus?: string }>(
        `/calls/${callId}/status`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch call status");
    },
    enabled: !!callId,
    refetchInterval: 5000, // Poll every 5 seconds for active calls
    ...options,
  });
};

// Update call outcome
export const useUpdateCallOutcome = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callId, outcome }: { callId: string; outcome: CallOutcome }) => {
      const response = await apiClient.patch(`/calls/${callId}/outcome`, outcome);
      if (response.success) {
        return true;
      }
      throw new Error(response.error?.message || "Failed to update call outcome");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALLS_QUERY_KEY] });
    },
    ...options,
  });
};

// Delete a call
export const useDeleteCall = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: string) => {
      const response = await apiClient.delete(`/calls/${callId}`);
      if (response.success) {
        return callId;
      }
      throw new Error(response.error?.message || "Failed to delete call");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALLS_QUERY_KEY] });
    },
    ...options,
  });
};

// Get script templates
export const useScriptTemplates = (options = {}) => {
  return useQuery({
    queryKey: [CALLS_QUERY_KEY, "templates"],
    queryFn: async () => {
      const response = await apiClient.get<{ templates: ScriptTemplate[] }>(
        "/calls/scripts/templates"
      );
      if (response.success && response.data) {
        return response.data.templates;
      }
      throw new Error(response.error?.message || "Failed to fetch script templates");
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    ...options,
  });
};

// Get available voices
export const useVoices = (options = {}) => {
  return useQuery({
    queryKey: [CALLS_QUERY_KEY, "voices"],
    queryFn: async () => {
      const response = await apiClient.get<{ voices: Voice[] }>("/calls/voices");
      if (response.success && response.data) {
        return response.data.voices;
      }
      throw new Error(response.error?.message || "Failed to fetch voices");
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    ...options,
  });
};

// Synthesize speech preview
export const useSynthesizeSpeech = (options = {}) => {
  return useMutation({
    mutationFn: async ({ text, voice }: { text: string; voice?: string }) => {
      const response = await apiClient.post<{ audio: string; contentType: string }>(
        "/calls/synthesize",
        { text, voice }
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to synthesize speech");
    },
    ...options,
  });
};
