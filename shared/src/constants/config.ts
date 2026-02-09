// Configuration Constants

export const CONFIG = {
  // API
  API_VERSION: "v1",
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Timeouts
  DEFAULT_APPROVAL_TIMEOUT_HOURS: 24,
  MAX_APPROVAL_TIMEOUT_HOURS: 72,

  // Retries
  DEFAULT_MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,

  // Rate Limits
  RATE_LIMITS: {
    STARTER: { perMinute: 60, perDay: 10000 },
    PRO: { perMinute: 120, perDay: 50000 },
    PREMIUM: { perMinute: 300, perDay: 100000 },
  },

  // Spending Defaults
  DEFAULT_SPENDING_LIMITS: {
    perTransaction: 100,
    daily: 200,
    weekly: 500,
    monthly: 1500,
  },

  // Notification Defaults
  DEFAULT_NOTIFICATION_CHANNELS: ["push", "email"] as const,

  // AI
  DEFAULT_AI_MODEL: "claude-3-haiku",
  AI_MODELS: ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"] as const,

  // Voice
  DEFAULT_VOICE_ID: "neutral-1",
  VOICE_OPTIONS: ["neutral-1", "neutral-2", "british", "american"] as const,

  // Locales
  SUPPORTED_LOCALES: ["en-GB", "en-US", "es-ES", "fr-FR"] as const,
  DEFAULT_LOCALE: "en-GB",

  // Timezones
  DEFAULT_TIMEZONE: "Europe/London",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Invalid request data",
  RATE_LIMITED: "Too many requests, please try again later",
  INTEGRATION_ERROR: "External service error",
  INTERNAL_ERROR: "An unexpected error occurred",
} as const;

// Action Type Labels
export const ACTION_TYPE_LABELS: Record<string, string> = {
  email_draft: "Draft Email",
  email_send: "Send Email",
  email_categorize: "Categorize Email",
  phone_call: "Phone Call",
  grocery_order: "Grocery Order",
  food_delivery: "Food Delivery",
  bill_payment: "Bill Payment",
  appointment_booking: "Appointment Booking",
  travel_booking: "Travel Booking",
  gift_ordering: "Gift Order",
  calendar_event: "Calendar Event",
  reminder: "Reminder",
} as const;

// Integration Provider Labels
export const INTEGRATION_LABELS: Record<string, string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  google_calendar: "Google Calendar",
  outlook_calendar: "Outlook Calendar",
  twilio: "Twilio",
  truelayer: "TrueLayer",
  plaid: "Plaid",
  monzo: "Monzo",
  revolut: "Revolut",
  deliveroo: "Deliveroo",
  uber_eats: "Uber Eats",
  just_eat: "Just Eat",
  ocado: "Ocado",
  tesco: "Tesco",
  amazon_fresh: "Amazon Fresh",
} as const;
