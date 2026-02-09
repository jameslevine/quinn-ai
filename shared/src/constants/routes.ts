// API Routes

export const API_ROUTES = {
  // Health
  HEALTH: "/health",

  // Users
  USERS: {
    ME: "/users/me",
    PREFERENCES: "/users/me/preferences",
  },

  // Actions
  ACTIONS: {
    BASE: "/actions",
    BY_ID: (id: string) => `/actions/${id}`,
  },

  // Approvals
  APPROVALS: {
    BASE: "/approvals",
    BY_ID: (id: string) => `/approvals/${id}`,
    RESPOND: (id: string) => `/approvals/${id}/respond`,
  },

  // Integrations
  INTEGRATIONS: {
    BASE: "/integrations",
    BY_PROVIDER: (provider: string) => `/integrations/${provider}`,
    CONNECT: (provider: string) => `/integrations/${provider}/connect`,
    CALLBACK: (provider: string) => `/integrations/${provider}/callback`,
    SYNC: (provider: string) => `/integrations/${provider}/sync`,
  },

  // Emails
  EMAILS: {
    BASE: "/emails",
    BY_ID: (id: string) => `/emails/${id}`,
    DRAFT_REPLY: (id: string) => `/emails/${id}/draft-reply`,
    CATEGORIZE: (id: string) => `/emails/${id}/categorize`,
    SYNC: "/emails/sync",
  },

  // Conversations
  CONVERSATIONS: {
    BASE: "/conversations",
    BY_ID: (id: string) => `/conversations/${id}`,
    MESSAGES: (id: string) => `/conversations/${id}/messages`,
  },

  // Audit
  AUDIT: {
    BASE: "/audit",
  },
} as const;

// Frontend Routes
export const APP_ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Main
  DASHBOARD: "/dashboard",
  APPROVALS: "/approvals",
  EMAILS: "/emails",
  SETTINGS: "/settings",
  HISTORY: "/history",

  // Integrations
  INTEGRATIONS: "/integrations",
  INTEGRATION_CALLBACK: "/integrations/callback",
} as const;
