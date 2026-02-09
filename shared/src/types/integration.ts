// Integration Types

export interface Integration {
  userId: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  connectedAt?: string;
  lastSyncAt?: string;
  syncStatus?: SyncStatus;
  errorMessage?: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationProvider =
  | "gmail"
  | "outlook"
  | "google_calendar"
  | "outlook_calendar"
  | "twilio"
  | "truelayer"
  | "plaid"
  | "monzo"
  | "revolut"
  | "deliveroo"
  | "uber_eats"
  | "just_eat"
  | "ocado"
  | "tesco"
  | "amazon_fresh";

export type IntegrationStatus = "connected" | "disconnected" | "expired" | "error";

export type SyncStatus = "syncing" | "synced" | "error";

export interface IntegrationCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  scope: string[];
}

export interface OAuthState {
  userId: string;
  provider: IntegrationProvider;
  redirectUrl: string;
  createdAt: string;
}
