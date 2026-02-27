import { google, calendar_v3 } from "googleapis";
import { getDbIntegrationByType, updateDbIntegrationTokens } from "../adapters/integrations";

// Initialize OAuth2 client
const getOAuth2Client = () => {
  const { OAuth2 } = google.auth;
  return new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
};

// Types
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
  recurrence?: string[];
  colorId?: string;
  status?: "confirmed" | "tentative" | "cancelled";
  htmlLink?: string;
  created?: string;
  updated?: string;
}

export interface CalendarList {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: "freeBusyReader" | "reader" | "writer" | "owner";
}

export interface FreeBusySlot {
  start: string;
  end: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

// Get authenticated calendar client
const getCalendarClient = async (userId: string): Promise<calendar_v3.Calendar> => {
  console.log(`[Calendar] Getting calendar client for user: ${userId}`);

  const integration = await getDbIntegrationByType(userId, "google_calendar");
  console.log(`[Calendar] google_calendar integration:`, integration ? "found" : "not found");

  // Fall back to gmail integration if google_calendar not found
  const gmailIntegration = integration || (await getDbIntegrationByType(userId, "gmail"));
  console.log(`[Calendar] gmail integration:`, gmailIntegration ? "found" : "not found");
  console.log(`[Calendar] Has accessToken:`, gmailIntegration?.accessToken ? "yes" : "no");

  if (!gmailIntegration || !gmailIntegration.accessToken) {
    console.log(`[Calendar] No valid integration found for user ${userId}`);
    throw new Error("Google Calendar not connected. Please connect your Google account.");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: gmailIntegration.accessToken,
    refresh_token: gmailIntegration.refreshToken,
    expiry_date: gmailIntegration.tokenExpiry
      ? new Date(gmailIntegration.tokenExpiry).getTime()
      : undefined,
  });

  // Check if token needs refresh
  if (gmailIntegration.tokenExpiry && new Date(gmailIntegration.tokenExpiry) < new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await updateDbIntegrationTokens(
        userId,
        "google_calendar",
        credentials.access_token || "",
        credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : "",
        credentials.refresh_token || undefined
      );
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error("Failed to refresh Google token. Please reconnect your account.");
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
};

// List calendars
export const listCalendars = async (userId: string): Promise<CalendarList[]> => {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.calendarList.list();

  return (response.data.items || []).map((cal) => ({
    id: cal.id || "",
    summary: cal.summary || "",
    description: cal.description || undefined,
    primary: cal.primary || undefined,
    backgroundColor: cal.backgroundColor || undefined,
    foregroundColor: cal.foregroundColor || undefined,
    accessRole: cal.accessRole as CalendarList["accessRole"],
  }));
};

// Get events
export const getEvents = async (
  userId: string,
  options: {
    calendarId?: string;
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: "startTime" | "updated";
    q?: string;
  } = {}
): Promise<CalendarEvent[]> => {
  const calendar = await getCalendarClient(userId);

  const {
    calendarId = "primary",
    timeMin = new Date(),
    timeMax,
    maxResults = 50,
    singleEvents = true,
    orderBy = "startTime",
    q,
  } = options;

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults,
    singleEvents,
    orderBy,
    q,
  });

  return (response.data.items || []).map(mapGoogleEventToCalendarEvent);
};

// Get single event
export const getEvent = async (
  userId: string,
  eventId: string,
  calendarId: string = "primary"
): Promise<CalendarEvent> => {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.get({
    calendarId,
    eventId,
  });

  return mapGoogleEventToCalendarEvent(response.data);
};

// Create event
export const createEvent = async (
  userId: string,
  event: CalendarEvent,
  calendarId: string = "primary",
  sendUpdates: "all" | "externalOnly" | "none" = "all"
): Promise<CalendarEvent> => {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.insert({
    calendarId,
    sendUpdates,
    requestBody: mapCalendarEventToGoogleEvent(event),
  });

  return mapGoogleEventToCalendarEvent(response.data);
};

// Update event
export const updateEvent = async (
  userId: string,
  eventId: string,
  updates: Partial<CalendarEvent>,
  calendarId: string = "primary",
  sendUpdates: "all" | "externalOnly" | "none" = "all"
): Promise<CalendarEvent> => {
  const calendar = await getCalendarClient(userId);

  // Get existing event first
  const existing = await calendar.events.get({
    calendarId,
    eventId,
  });

  const updatedEvent = {
    ...existing.data,
    ...mapCalendarEventToGoogleEvent(updates as CalendarEvent),
  };

  const response = await calendar.events.update({
    calendarId,
    eventId,
    sendUpdates,
    requestBody: updatedEvent,
  });

  return mapGoogleEventToCalendarEvent(response.data);
};

// Delete event
export const deleteEvent = async (
  userId: string,
  eventId: string,
  calendarId: string = "primary",
  sendUpdates: "all" | "externalOnly" | "none" = "all"
): Promise<void> => {
  const calendar = await getCalendarClient(userId);

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates,
  });
};

// Quick add event (natural language)
export const quickAddEvent = async (
  userId: string,
  text: string,
  calendarId: string = "primary"
): Promise<CalendarEvent> => {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.events.quickAdd({
    calendarId,
    text,
  });

  return mapGoogleEventToCalendarEvent(response.data);
};

// Get free/busy information
export const getFreeBusy = async (
  userId: string,
  timeMin: Date,
  timeMax: Date,
  calendarIds: string[] = ["primary"]
): Promise<Record<string, FreeBusySlot[]>> => {
  const calendar = await getCalendarClient(userId);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: calendarIds.map((id) => ({ id })),
    },
  });

  const result: Record<string, FreeBusySlot[]> = {};

  for (const [calId, data] of Object.entries(response.data.calendars || {})) {
    result[calId] = (data.busy || []).map((slot) => ({
      start: slot.start || "",
      end: slot.end || "",
    }));
  }

  return result;
};

// Find available time slots
export const findAvailableSlots = async (
  userId: string,
  options: {
    duration: number; // in minutes
    timeMin: Date;
    timeMax: Date;
    calendarIds?: string[];
    workingHoursStart?: number; // hour of day (0-23)
    workingHoursEnd?: number;
    excludeWeekends?: boolean;
  }
): Promise<TimeSlot[]> => {
  const {
    duration,
    timeMin,
    timeMax,
    calendarIds = ["primary"],
    workingHoursStart = 9,
    workingHoursEnd = 17,
    excludeWeekends = true,
  } = options;

  const freeBusy = await getFreeBusy(userId, timeMin, timeMax, calendarIds);

  // Merge all busy slots
  const allBusySlots: FreeBusySlot[] = [];
  for (const slots of Object.values(freeBusy)) {
    allBusySlots.push(...slots);
  }

  // Sort by start time
  allBusySlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // Find available slots
  const availableSlots: TimeSlot[] = [];
  const durationMs = duration * 60 * 1000;

  let currentTime = new Date(timeMin);

  while (currentTime < timeMax) {
    const dayOfWeek = currentTime.getDay();
    const hour = currentTime.getHours();

    // Skip weekends if configured
    if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(workingHoursStart, 0, 0, 0);
      continue;
    }

    // Skip outside working hours
    if (hour < workingHoursStart) {
      currentTime.setHours(workingHoursStart, 0, 0, 0);
      continue;
    }

    if (hour >= workingHoursEnd) {
      currentTime.setDate(currentTime.getDate() + 1);
      currentTime.setHours(workingHoursStart, 0, 0, 0);
      continue;
    }

    const slotEnd = new Date(currentTime.getTime() + durationMs);

    // Check if slot overlaps with any busy period
    const isAvailable = !allBusySlots.some((busy) => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return currentTime < busyEnd && slotEnd > busyStart;
    });

    if (isAvailable && slotEnd <= timeMax) {
      // Check if slot end is within working hours
      if (slotEnd.getHours() <= workingHoursEnd) {
        availableSlots.push({
          start: new Date(currentTime),
          end: slotEnd,
          available: true,
        });
      }
    }

    // Move to next slot (30 minute increments)
    currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
  }

  return availableSlots;
};

// Check if a specific time is available
export const checkAvailability = async (
  userId: string,
  start: Date,
  end: Date,
  calendarIds: string[] = ["primary"]
): Promise<boolean> => {
  const freeBusy = await getFreeBusy(userId, start, end, calendarIds);

  for (const slots of Object.values(freeBusy)) {
    if (slots.length > 0) {
      return false;
    }
  }

  return true;
};

// Get today's events
export const getTodayEvents = async (userId: string): Promise<CalendarEvent[]> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return getEvents(userId, {
    timeMin: startOfDay,
    timeMax: endOfDay,
  });
};

// Get upcoming events (next 7 days)
export const getUpcomingEvents = async (
  userId: string,
  days: number = 7
): Promise<CalendarEvent[]> => {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return getEvents(userId, {
    timeMin: now,
    timeMax: future,
  });
};

// Helper: Map Google event to our CalendarEvent type
const mapGoogleEventToCalendarEvent = (event: calendar_v3.Schema$Event): CalendarEvent => {
  return {
    id: event.id || undefined,
    summary: event.summary || "",
    description: event.description || undefined,
    location: event.location || undefined,
    start: {
      dateTime: event.start?.dateTime || undefined,
      date: event.start?.date || undefined,
      timeZone: event.start?.timeZone || undefined,
    },
    end: {
      dateTime: event.end?.dateTime || undefined,
      date: event.end?.date || undefined,
      timeZone: event.end?.timeZone || undefined,
    },
    attendees: event.attendees?.map((a) => ({
      email: a.email || "",
      displayName: a.displayName || undefined,
      responseStatus: a.responseStatus as "needsAction" | "declined" | "tentative" | "accepted",
    })),
    reminders: event.reminders
      ? {
          useDefault: event.reminders.useDefault || false,
          overrides: event.reminders.overrides?.map((o) => ({
            method: o.method as "email" | "popup",
            minutes: o.minutes || 0,
          })),
        }
      : undefined,
    recurrence: event.recurrence || undefined,
    colorId: event.colorId || undefined,
    status: event.status as CalendarEvent["status"],
    htmlLink: event.htmlLink || undefined,
    created: event.created || undefined,
    updated: event.updated || undefined,
  };
};

// Helper: Map our CalendarEvent to Google event format
const mapCalendarEventToGoogleEvent = (event: CalendarEvent): calendar_v3.Schema$Event => {
  return {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: event.start,
    end: event.end,
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      displayName: a.displayName,
    })),
    reminders: event.reminders,
    recurrence: event.recurrence,
    colorId: event.colorId,
  };
};

// Generate OAuth URL with Calendar scope
export const getCalendarAuthUrl = (state: string): string => {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent",
  });
};
