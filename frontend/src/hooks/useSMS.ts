/**
 * SMS Hook - Manage phone number registration and SMS settings
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

// Types
interface SMSStatus {
  phoneNumber: string | null;
  phoneVerified: boolean;
  smsEnabled: boolean;
}

interface VerifiedNumber {
  phoneNumber: string;
  formattedPhoneNumber: string;
  status: string;
  verifiedAt?: string;
}

interface VerifiedNumbersResponse {
  verifiedNumbers: VerifiedNumber[];
  sandboxMode: boolean;
}

interface RegisterPhoneResponse {
  message: string;
  phoneNumber: string;
  phoneType?: string;
  carrier?: string;
}

// Query keys
const SMS_KEYS = {
  status: ["sms", "status"] as const,
  verifiedNumbers: ["sms", "verified-numbers"] as const,
};

/**
 * Get SMS status for current user
 */
export const useSMSStatus = () => {
  return useQuery({
    queryKey: SMS_KEYS.status,
    queryFn: async () => {
      const response = await api.get<SMSStatus>("/sms/status");
      return response.data;
    },
  });
};

/**
 * Get AWS verified destination numbers (sandbox mode)
 */
export const useVerifiedNumbers = () => {
  return useQuery({
    queryKey: SMS_KEYS.verifiedNumbers,
    queryFn: async () => {
      const response = await api.get<VerifiedNumbersResponse>("/sms/verified-numbers");
      return response.data;
    },
  });
};

/**
 * Register phone number for SMS
 */
export const useRegisterPhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await api.post<RegisterPhoneResponse>("/sms/register", {
        phoneNumber,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMS_KEYS.status });
    },
  });
};

/**
 * Verify phone number with code
 */
export const useVerifyPhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post<{ message: string; phoneNumber: string }>("/sms/verify", {
        code,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMS_KEYS.status });
    },
  });
};

/**
 * Resend verification code
 */
export const useResendVerification = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ message: string; phoneNumber: string }>(
        "/sms/resend-verification"
      );
      return response;
    },
  });
};

/**
 * Unregister phone number
 */
export const useUnregisterPhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete<{ message: string }>("/sms/unregister");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SMS_KEYS.status });
    },
  });
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+?[1-9]\d{1,14}$/;
  return e164Regex.test(phone.replace(/[\s\-()]/g, ""));
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // UK format
  if (cleaned.startsWith("+44")) {
    const local = cleaned.substring(3);
    return `+44 ${local.substring(0, 4)} ${local.substring(4)}`;
  }

  // US format
  if (cleaned.startsWith("+1")) {
    const local = cleaned.substring(2);
    return `+1 (${local.substring(0, 3)}) ${local.substring(3, 6)}-${local.substring(6)}`;
  }

  return cleaned;
};
