import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";
import { useStore } from "../store";

// Types
interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  settings: UserSettings;
  createdAt: string;
}

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  approvalModes: {
    email: "suggest" | "auto_review" | "full_auto";
    call: "suggest" | "auto_review";
    payment: "suggest" | "auto_review";
    food: "suggest" | "auto_review" | "full_auto";
  };
  spendingLimits: {
    perTransaction: number;
    daily: number;
    monthly: number;
  };
  theme: "light" | "dark";
}

const USER_QUERY_KEY = "user";

// Get current user
export const useCurrentUser = () => {
  const setUser = useStore((state) => state.setUser);

  return useQuery({
    queryKey: [USER_QUERY_KEY, "me"],
    queryFn: async () => {
      const response = await apiClient.get<User>("/users/me");
      if (response.success && response.data) {
        setUser({
          id: response.data.userId,
          email: response.data.email,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
        });
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to fetch user");
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string }) => {
      const response = await apiClient.patch<User>("/users/me", data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to update profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, "me"] });
    },
  });
};

// Update user settings
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await apiClient.patch<{ settings: UserSettings }>(
        "/users/me/settings",
        settings
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error?.message || "Failed to update settings");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, "me"] });
    },
  });
};

export type { User, UserSettings };
