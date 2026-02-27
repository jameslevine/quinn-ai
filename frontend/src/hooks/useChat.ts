import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";

// Types
export interface ChatMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: "email" | "call" | "payment" | "food" | "appointment" | "other";
  title: string;
  description: string;
  confidence: number;
  parameters?: Record<string, unknown>;
}

export interface Conversation {
  conversationId: string;
  userId: string;
  title?: string;
  summary?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface CreateConversationResponse {
  conversation: Conversation;
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export interface QuickChatResponse {
  response: string;
  suggestions?: SuggestedAction[];
}

// Query keys
const CHAT_QUERY_KEY = "chat";
const CONVERSATIONS_QUERY_KEY = "conversations";

// Get all conversations
export const useConversations = (options = {}) => {
  return useQuery({
    queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY],
    queryFn: async () => {
      const response = await apiClient.get<{
        conversations: Conversation[];
        nextCursor?: string;
      }>("/chat/conversations");
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch conversations");
    },
    ...options,
  });
};

// Get a specific conversation with messages
export const useConversation = (conversationId: string | null, options = {}) => {
  return useQuery({
    queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY, conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const response = await apiClient.get<ConversationWithMessages>(
        `/chat/conversations/${conversationId}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch conversation");
    },
    enabled: !!conversationId,
    ...options,
  });
};

// Create a new conversation
export const useCreateConversation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title?: string; message?: string }) => {
      const response = await apiClient.post<CreateConversationResponse>(
        "/chat/conversations",
        data
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to create conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY] });
    },
    ...options,
  });
};

// Send a message to a conversation
export const useSendMessage = (conversationId: string, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post<SendMessageResponse>(
        `/chat/conversations/${conversationId}/messages`,
        { content }
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to send message");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY, conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY] });
    },
    ...options,
  });
};

// Update conversation title
export const useUpdateConversationTitle = (conversationId: string, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const response = await apiClient.patch<Conversation>(
        `/chat/conversations/${conversationId}`,
        { title }
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to update conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY, conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY] });
    },
    ...options,
  });
};

// Delete a conversation
export const useDeleteConversation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiClient.delete(`/chat/conversations/${conversationId}`);
      if (response.success) {
        return conversationId;
      }
      throw new Error(response.error?.message || "Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAT_QUERY_KEY, CONVERSATIONS_QUERY_KEY] });
    },
    ...options,
  });
};

// Quick chat (no conversation persistence)
export const useQuickChat = (options = {}) => {
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post<QuickChatResponse>("/chat/quick", { content });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to process message");
    },
    ...options,
  });
};

// AI-powered features

// Suggest actions based on conversation
export const useSuggestActions = (options = {}) => {
  return useMutation({
    mutationFn: async (
      conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
    ) => {
      const response = await apiClient.post<{ suggestions: SuggestedAction[] }>(
        "/ai/suggest-actions",
        { conversationHistory }
      );
      if (response.success && response.data) {
        return response.data.suggestions;
      }
      throw new Error(response.error?.message || "Failed to suggest actions");
    },
    ...options,
  });
};

// Create action from natural language
export const useCreateActionFromNL = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { request: string; autoCreate?: boolean }) => {
      const response = await apiClient.post<{
        parsed: {
          type: string;
          title: string;
          description: string;
          details?: string;
          amount?: number;
          currency?: string;
        };
        action?: unknown;
        message?: string;
      }>("/ai/create-action", data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to create action");
    },
    onSuccess: (data) => {
      if (data.action) {
        queryClient.invalidateQueries({ queryKey: ["actions"] });
      }
    },
    ...options,
  });
};

// Generate email draft
export const useGenerateEmailDraft = (options = {}) => {
  return useMutation({
    mutationFn: async (data: {
      prompt: string;
      tone?: "formal" | "casual" | "friendly" | "professional";
    }) => {
      const response = await apiClient.post<{
        draft: {
          to: string;
          subject: string;
          body: string;
          tone?: string;
        };
      }>("/ai/email/draft", data);
      if (response.success && response.data) {
        return response.data.draft;
      }
      throw new Error(response.error?.message || "Failed to generate email draft");
    },
    ...options,
  });
};

// Generate email reply
export const useGenerateEmailReply = (options = {}) => {
  return useMutation({
    mutationFn: async (data: {
      originalEmail: {
        from: string;
        subject: string;
        body: string;
      };
      instructions: string;
      tone?: "formal" | "casual" | "friendly" | "professional";
    }) => {
      const response = await apiClient.post<{
        draft: {
          to: string;
          subject: string;
          body: string;
          tone?: string;
        };
      }>("/ai/email/reply", data);
      if (response.success && response.data) {
        return response.data.draft;
      }
      throw new Error(response.error?.message || "Failed to generate email reply");
    },
    ...options,
  });
};

// Improve email draft
export const useImproveEmailDraft = (options = {}) => {
  return useMutation({
    mutationFn: async (data: {
      draft: {
        to: string;
        subject: string;
        body: string;
      };
      feedback: string;
    }) => {
      const response = await apiClient.post<{
        draft: {
          to: string;
          subject: string;
          body: string;
          tone?: string;
        };
      }>("/ai/email/improve", data);
      if (response.success && response.data) {
        return response.data.draft;
      }
      throw new Error(response.error?.message || "Failed to improve email draft");
    },
    ...options,
  });
};
