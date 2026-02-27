import { Router, Request, Response } from "express";
import Joi from "joi";
import {
  listCalendars,
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  quickAddEvent,
  getFreeBusy,
  findAvailableSlots,
  checkAvailability,
  getTodayEvents,
  getUpcomingEvents,
  getCalendarAuthUrl,
  type CalendarEvent,
} from "../lib/google-calendar";
import { validateBody, validateParams, validateQuery } from "../middleware/validation";
import { getOrCreateDbUser } from "../adapters/users";

export const router: Router = Router();

// Validation schemas
const eventIdParamsSchema = Joi.object({
  eventId: Joi.string().required(),
});

const eventsQuerySchema = Joi.object({
  calendarId: Joi.string().default("primary"),
  timeMin: Joi.string().isoDate().optional(),
  timeMax: Joi.string().isoDate().optional(),
  maxResults: Joi.number().integer().min(1).max(100).default(50),
  q: Joi.string().optional(),
});

const createEventSchema = Joi.object({
  summary: Joi.string().required(),
  description: Joi.string().optional(),
  location: Joi.string().optional(),
  start: Joi.object({
    dateTime: Joi.string().isoDate().optional(),
    date: Joi.string().optional(),
    timeZone: Joi.string().optional(),
  }).required(),
  end: Joi.object({
    dateTime: Joi.string().isoDate().optional(),
    date: Joi.string().optional(),
    timeZone: Joi.string().optional(),
  }).required(),
  attendees: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().email().required(),
        displayName: Joi.string().optional(),
      })
    )
    .optional(),
  reminders: Joi.object({
    useDefault: Joi.boolean().required(),
    overrides: Joi.array()
      .items(
        Joi.object({
          method: Joi.string().valid("email", "popup").required(),
          minutes: Joi.number().integer().min(0).required(),
        })
      )
      .optional(),
  }).optional(),
  recurrence: Joi.array().items(Joi.string()).optional(),
  colorId: Joi.string().optional(),
  calendarId: Joi.string().default("primary"),
  sendUpdates: Joi.string().valid("all", "externalOnly", "none").default("all"),
});

const updateEventSchema = Joi.object({
  summary: Joi.string().optional(),
  description: Joi.string().optional(),
  location: Joi.string().optional(),
  start: Joi.object({
    dateTime: Joi.string().isoDate().optional(),
    date: Joi.string().optional(),
    timeZone: Joi.string().optional(),
  }).optional(),
  end: Joi.object({
    dateTime: Joi.string().isoDate().optional(),
    date: Joi.string().optional(),
    timeZone: Joi.string().optional(),
  }).optional(),
  attendees: Joi.array()
    .items(
      Joi.object({
        email: Joi.string().email().required(),
        displayName: Joi.string().optional(),
      })
    )
    .optional(),
  calendarId: Joi.string().default("primary"),
  sendUpdates: Joi.string().valid("all", "externalOnly", "none").default("all"),
});

const quickAddSchema = Joi.object({
  text: Joi.string().required(),
  calendarId: Joi.string().default("primary"),
});

const freeBusySchema = Joi.object({
  timeMin: Joi.string().isoDate().required(),
  timeMax: Joi.string().isoDate().required(),
  calendarIds: Joi.array().items(Joi.string()).default(["primary"]),
});

const availableSlotsSchema = Joi.object({
  duration: Joi.number().integer().min(15).max(480).required(),
  timeMin: Joi.string().isoDate().required(),
  timeMax: Joi.string().isoDate().required(),
  calendarIds: Joi.array().items(Joi.string()).default(["primary"]),
  workingHoursStart: Joi.number().integer().min(0).max(23).default(9),
  workingHoursEnd: Joi.number().integer().min(0).max(23).default(17),
  excludeWeekends: Joi.boolean().default(true),
});

const checkAvailabilitySchema = Joi.object({
  start: Joi.string().isoDate().required(),
  end: Joi.string().isoDate().required(),
  calendarIds: Joi.array().items(Joi.string()).default(["primary"]),
});

// Helper function to get internal user ID from Cognito sub
const getInternalUserId = async (req: Request): Promise<string | null> => {
  if (!req.user?.sub) return null;
  const cognitoSub = req.user.sub as string;
  const email = (req.user.email || req.user["cognito:username"]) as string;
  const user = await getOrCreateDbUser(cognitoSub, email);
  return user.userId;
};

// Get OAuth URL for calendar authorization
router.get("/auth-url", async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const authUrl = getCalendarAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ message: "Error generating auth URL" });
  }
});

// List all calendars
router.get("/calendars", async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const calendars = await listCalendars(userId);
    res.json({ calendars });
  } catch (error: any) {
    console.error("Error listing calendars:", error);
    if (error.message?.includes("not connected")) {
      return res.status(400).json({ message: error.message, needsAuth: true });
    }
    res.status(500).json({ message: "Error listing calendars" });
  }
});

// Get today's events
router.get("/today", async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = await getTodayEvents(userId);
    res.json({ events });
  } catch (error: any) {
    console.error("Error fetching today's events:", error);
    if (error.message?.includes("not connected")) {
      return res.status(400).json({ message: error.message, needsAuth: true });
    }
    res.status(500).json({ message: "Error fetching today's events" });
  }
});

// Get upcoming events
router.get("/upcoming", async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const days = parseInt(req.query.days as string) || 7;
    const events = await getUpcomingEvents(userId, days);
    res.json({ events });
  } catch (error: any) {
    console.error("Error fetching upcoming events:", error);
    if (error.message?.includes("not connected")) {
      return res.status(400).json({ message: error.message, needsAuth: true });
    }
    res.status(500).json({ message: "Error fetching upcoming events" });
  }
});

// Get events with filters
router.get("/events", validateQuery(eventsQuerySchema), async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { calendarId, timeMin, timeMax, maxResults, q } = req.query;

    const events = await getEvents(userId, {
      calendarId: calendarId as string,
      timeMin: timeMin ? new Date(timeMin as string) : undefined,
      timeMax: timeMax ? new Date(timeMax as string) : undefined,
      maxResults: parseInt(maxResults as string),
      q: q as string,
    });

    res.json({ events });
  } catch (error: any) {
    console.error("Error fetching events:", error);
    if (error.message?.includes("not connected")) {
      return res.status(400).json({ message: error.message, needsAuth: true });
    }
    res.status(500).json({ message: "Error fetching events" });
  }
});

// Get single event
router.get(
  "/events/:eventId",
  validateParams(eventIdParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = await getInternalUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { eventId } = req.params;
      const calendarId = (req.query.calendarId as string) || "primary";

      const event = await getEvent(userId, eventId!, calendarId);
      res.json(event);
    } catch (error: any) {
      console.error("Error fetching event:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ message: error.message, needsAuth: true });
      }
      res.status(500).json({ message: "Error fetching event" });
    }
  }
);

// Create event
router.post("/events", validateBody(createEventSchema), async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { calendarId, sendUpdates, ...eventData } = req.body;

    const event = await createEvent(
      userId,
      eventData as CalendarEvent,
      calendarId || "primary",
      sendUpdates || "all"
    );

    res.status(201).json(event);
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.message?.includes("not connected")) {
      return res.status(400).json({ message: error.message, needsAuth: true });
    }
    res.status(500).json({ message: "Error creating event" });
  }
});

// Quick add event (natural language)
router.post("/events/quick", validateBody(quickAddSchema), async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { text, calendarId } = req.body;

    const event = await quickAddEvent(userId, text, calendarId || "primary");
    res.status(201).json(event);
  } catch (error: any) {
    console.error("Error quick adding event:", error);
    if (error.message?.includes("not connected")) {
      return res.status(400).json({ message: error.message, needsAuth: true });
    }
    res.status(500).json({ message: "Error quick adding event" });
  }
});

// Update event
router.patch(
  "/events/:eventId",
  validateParams(eventIdParamsSchema),
  validateBody(updateEventSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = await getInternalUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { eventId } = req.params;
      const { calendarId, sendUpdates, ...updates } = req.body;

      const event = await updateEvent(
        userId,
        eventId!,
        updates,
        calendarId || "primary",
        sendUpdates || "all"
      );

      res.json(event);
    } catch (error: any) {
      console.error("Error updating event:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ message: error.message, needsAuth: true });
      }
      res.status(500).json({ message: "Error updating event" });
    }
  }
);

// Delete event
router.delete(
  "/events/:eventId",
  validateParams(eventIdParamsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = await getInternalUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { eventId } = req.params;
      const calendarId = (req.query.calendarId as string) || "primary";
      const sendUpdates = (req.query.sendUpdates as "all" | "externalOnly" | "none") || "all";

      await deleteEvent(userId, eventId!, calendarId, sendUpdates);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting event:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ message: error.message, needsAuth: true });
      }
      res.status(500).json({ message: "Error deleting event" });
    }
  }
);

// Get free/busy information
router.post("/freebusy", validateBody(freeBusySchema), async (req: Request, res: Response) => {
  try {
    const userId = await getInternalUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { timeMin, timeMax, calendarIds } = req.body;

    const freeBusy = await getFreeBusy(
      userId,
      new Date(timeMin),
      new Date(timeMax),
      calendarIds || ["primary"]
    );

    res.json({ freeBusy });
  } catch (error: any) {
    console.error("Error fetching free/busy:", error);
    if (error.message?.includes("not connected")) {
      return res.status(400).json({ message: error.message, needsAuth: true });
    }
    res.status(500).json({ message: "Error fetching free/busy" });
  }
});

// Find available time slots
router.post(
  "/available-slots",
  validateBody(availableSlotsSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = await getInternalUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const {
        duration,
        timeMin,
        timeMax,
        calendarIds,
        workingHoursStart,
        workingHoursEnd,
        excludeWeekends,
      } = req.body;

      const slots = await findAvailableSlots(userId, {
        duration,
        timeMin: new Date(timeMin),
        timeMax: new Date(timeMax),
        calendarIds,
        workingHoursStart,
        workingHoursEnd,
        excludeWeekends,
      });

      res.json({ slots });
    } catch (error: any) {
      console.error("Error finding available slots:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ message: error.message, needsAuth: true });
      }
      res.status(500).json({ message: "Error finding available slots" });
    }
  }
);

// Check availability for specific time
router.post(
  "/check-availability",
  validateBody(checkAvailabilitySchema),
  async (req: Request, res: Response) => {
    try {
      const userId = await getInternalUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { start, end, calendarIds } = req.body;

      const available = await checkAvailability(
        userId,
        new Date(start),
        new Date(end),
        calendarIds || ["primary"]
      );

      res.json({ available });
    } catch (error: any) {
      console.error("Error checking availability:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ message: error.message, needsAuth: true });
      }
      res.status(500).json({ message: "Error checking availability" });
    }
  }
);
