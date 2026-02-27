import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/api";

export interface Email {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body?: string;
  isRead: boolean;
  isStarred: boolean;
}

export interface EmailLabel {
  id: string;
  name: string;
  type: string;
}

interface ListEmailsParams {
  maxResults?: number;
  query?: string;
  pageToken?: string;
  labelIds?: string[];
}

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  threadId?: string;
}

interface CreateDraftParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  threadId?: string;
}

const EMAILS_QUERY_KEY = "emails";
const EMAIL_QUERY_KEY = "email";
const LABELS_QUERY_KEY = "email-labels";

// List emails
export const useEmails = (params: ListEmailsParams = {}) => {
  const queryString = new URLSearchParams();
  if (params.maxResults) queryString.set("maxResults", params.maxResults.toString());
  if (params.query) queryString.set("q", params.query);
  if (params.pageToken) queryString.set("pageToken", params.pageToken);
  if (params.labelIds?.length) queryString.set("labelIds", params.labelIds.join(","));

  const queryParams = queryString.toString();
  const endpoint = queryParams ? `/emails?${queryParams}` : "/emails";

  return useQuery({
    queryKey: [EMAILS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await apiClient.get<Email[]>(endpoint);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch emails");
      }
      return response.data || [];
    },
  });
};

// Get single email
export const useEmail = (messageId: string | null) => {
  return useQuery({
    queryKey: [EMAIL_QUERY_KEY, messageId],
    queryFn: async () => {
      if (!messageId) return null;
      const response = await apiClient.get<Email>(`/emails/${messageId}`);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch email");
      }
      return response.data;
    },
    enabled: !!messageId,
  });
};

// Get labels
export const useEmailLabels = () => {
  return useQuery({
    queryKey: [LABELS_QUERY_KEY],
    queryFn: async () => {
      const response = await apiClient.get<EmailLabel[]>("/emails/labels/list");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch labels");
      }
      return response.data || [];
    },
  });
};

// Send email
export const useSendEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendEmailParams) => {
      const response = await apiClient.post<{ id: string; threadId: string }>(
        "/emails/send",
        params
      );
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to send email");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
    },
  });
};

// Create draft
export const useCreateDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateDraftParams) => {
      const response = await apiClient.post<{ id: string; messageId: string }>(
        "/emails/drafts",
        params
      );
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to create draft");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
    },
  });
};

// Mark as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiClient.post(`/emails/${messageId}/read`);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to mark as read");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
    },
  });
};

// Archive email
export const useArchiveEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiClient.post(`/emails/${messageId}/archive`);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to archive email");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
    },
  });
};

// Delete email
export const useDeleteEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiClient.delete(`/emails/${messageId}`);
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete email");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
    },
  });
};
