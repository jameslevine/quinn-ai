import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api";

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

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface FreeBusySlot {
  start: string;
  end: string;
}

const CALENDAR_QUERY_KEY = "calendar";

// Get calendar auth URL
export const useCalendarAuthUrl = () => {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, "auth-url"],
    queryFn: async () => {
      const response = await apiClient.get<{ authUrl: string }>("/calendar/auth-url");
      return response.data?.authUrl || "";
    },
    enabled: false, // Only fetch when needed
  });
};

// List calendars
export const useCalendars = () => {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, "calendars"],
    queryFn: async () => {
      const response = await apiClient.get<{ calendars: CalendarList[] }>("/calendar/calendars");
      return response.data?.calendars || [];
    },
  });
};

// Get today's events
export const useTodayEvents = () => {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, "today"],
    queryFn: async () => {
      const response = await apiClient.get<{
        events: CalendarEvent[];
        needsAuth?: boolean;
        message?: string;
      }>("/calendar/today");
      if (!response.success) {
        const errorMessage = response.error?.message || "Failed to load events";
        throw new Error(errorMessage);
      }
      return response.data?.events || [];
    },
  });
};

// Get upcoming events
export const useUpcomingEvents = (days: number = 7) => {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, "upcoming", days],
    queryFn: async () => {
      const response = await apiClient.get<{
        events: CalendarEvent[];
        needsAuth?: boolean;
        message?: string;
      }>(`/calendar/upcoming?days=${days}`);
      if (!response.success) {
        const errorMessage = response.error?.message || "Failed to load events";
        throw new Error(errorMessage);
      }
      return response.data?.events || [];
    },
  });
};

// Get events with filters
export const useEvents = (options?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  q?: string;
}) => {
  const params = new URLSearchParams();
  if (options?.calendarId) params.append("calendarId", options.calendarId);
  if (options?.timeMin) params.append("timeMin", options.timeMin);
  if (options?.timeMax) params.append("timeMax", options.timeMax);
  if (options?.maxResults) params.append("maxResults", options.maxResults.toString());
  if (options?.q) params.append("q", options.q);

  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, "events", options],
    queryFn: async () => {
      const response = await apiClient.get<{ events: CalendarEvent[] }>(
        `/calendar/events?${params.toString()}`
      );
      return response.data?.events || [];
    },
  });
};

// Get single event
export const useEvent = (eventId: string, calendarId: string = "primary") => {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, "event", eventId],
    queryFn: async () => {
      const response = await apiClient.get<CalendarEvent>(
        `/calendar/events/${eventId}?calendarId=${calendarId}`
      );
      return response.data;
    },
    enabled: !!eventId,
  });
};

// Create event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      event: Omit<CalendarEvent, "id">;
      calendarId?: string;
      sendUpdates?: "all" | "externalOnly" | "none";
    }) => {
      const response = await apiClient.post<CalendarEvent>("/calendar/events", {
        ...data.event,
        calendarId: data.calendarId || "primary",
        sendUpdates: data.sendUpdates || "all",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });
    },
  });
};

// Quick add event (natural language)
export const useQuickAddEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { text: string; calendarId?: string }) => {
      const response = await apiClient.post<CalendarEvent>("/calendar/events/quick", {
        text: data.text,
        calendarId: data.calendarId || "primary",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });
    },
  });
};

// Update event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eventId: string;
      updates: Partial<CalendarEvent>;
      calendarId?: string;
      sendUpdates?: "all" | "externalOnly" | "none";
    }) => {
      const response = await apiClient.patch<CalendarEvent>(`/calendar/events/${data.eventId}`, {
        ...data.updates,
        calendarId: data.calendarId || "primary",
        sendUpdates: data.sendUpdates || "all",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });
    },
  });
};

// Delete event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eventId: string;
      calendarId?: string;
      sendUpdates?: "all" | "externalOnly" | "none";
    }) => {
      await apiClient.delete(
        `/calendar/events/${data.eventId}?calendarId=${data.calendarId || "primary"}&sendUpdates=${data.sendUpdates || "all"}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_QUERY_KEY] });
    },
  });
};

// Get free/busy information
export const useFreeBusy = (timeMin: string, timeMax: string, calendarIds?: string[]) => {
  return useQuery({
    queryKey: [CALENDAR_QUERY_KEY, "freebusy", timeMin, timeMax, calendarIds],
    queryFn: async () => {
      const response = await apiClient.post<{ freeBusy: Record<string, FreeBusySlot[]> }>(
        "/calendar/freebusy",
        {
          timeMin,
          timeMax,
          calendarIds: calendarIds || ["primary"],
        }
      );
      return response.data?.freeBusy || {};
    },
    enabled: !!timeMin && !!timeMax,
  });
};

// Find available slots
export const useFindAvailableSlots = () => {
  return useMutation({
    mutationFn: async (data: {
      duration: number;
      timeMin: string;
      timeMax: string;
      calendarIds?: string[];
      workingHoursStart?: number;
      workingHoursEnd?: number;
      excludeWeekends?: boolean;
    }) => {
      const response = await apiClient.post<{ slots: TimeSlot[] }>("/calendar/available-slots", {
        duration: data.duration,
        timeMin: data.timeMin,
        timeMax: data.timeMax,
        calendarIds: data.calendarIds || ["primary"],
        workingHoursStart: data.workingHoursStart ?? 9,
        workingHoursEnd: data.workingHoursEnd ?? 17,
        excludeWeekends: data.excludeWeekends ?? true,
      });
      return response.data?.slots || [];
    },
  });
};

// Check availability
export const useCheckAvailability = () => {
  return useMutation({
    mutationFn: async (data: { start: string; end: string; calendarIds?: string[] }) => {
      const response = await apiClient.post<{ available: boolean }>(
        "/calendar/check-availability",
        {
          start: data.start,
          end: data.end,
          calendarIds: data.calendarIds || ["primary"],
        }
      );
      return response.data?.available || false;
    },
  });
};

// Helper function to format event time
export const formatEventTime = (event: CalendarEvent): string => {
  if (event.start.date) {
    // All-day event
    return "All day";
  }

  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = event.end.dateTime ? new Date(event.end.dateTime) : null;

    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const startTime = start.toLocaleTimeString("en-GB", timeFormat);
    const endTime = end ? end.toLocaleTimeString("en-GB", timeFormat) : "";

    return endTime ? `${startTime} - ${endTime}` : startTime;
  }

  return "";
};

// Helper function to format event date
export const formatEventDate = (event: CalendarEvent): string => {
  const dateStr = event.start.dateTime || event.start.date;
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// Helper to check if event is all day
export const isAllDayEvent = (event: CalendarEvent): boolean => {
  return !!event.start.date && !event.start.dateTime;
};

// Helper to get event color
export const getEventColor = (event: CalendarEvent): string => {
  const colors: Record<string, string> = {
    "1": "#7986cb", // Lavender
    "2": "#33b679", // Sage
    "3": "#8e24aa", // Grape
    "4": "#e67c73", // Flamingo
    "5": "#f6bf26", // Banana
    "6": "#f4511e", // Tangerine
    "7": "#039be5", // Peacock
    "8": "#616161", // Graphite
    "9": "#3f51b5", // Blueberry
    "10": "#0b8043", // Basil
    "11": "#d50000", // Tomato
  };

  return event.colorId ? colors[event.colorId] || "#1976d2" : "#1976d2";
};
