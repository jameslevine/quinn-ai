import { Router, Request, Response } from "express";
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  createSocialEvent,
  getSocialEvents,
  getSocialEvent,
  updateSocialEvent,
  deleteSocialEvent,
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  createTravelPlan,
  getTravelPlans,
  getTravelPlan,
  updateTravelPlan,
  deleteTravelPlan,
  createGift,
  getGifts,
  getGift,
  updateGift,
  deleteGift,
} from "../adapters/life";

export const router: Router = Router();

// ============ CONTACTS ============

// Get all contacts
router.get("/contacts", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const contacts = await getContacts(userId);
    res.json(contacts);
  } catch (error) {
    console.error("Error getting contacts:", error);
    res.status(500).json({ error: "Failed to get contacts" });
  }
});

// Get single contact
router.get("/contacts/:contactId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const contact = await getContact(userId, req.params.contactId!);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.json(contact);
  } catch (error) {
    console.error("Error getting contact:", error);
    res.status(500).json({ error: "Failed to get contact" });
  }
});

// Create contact
router.post("/contacts", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const contact = await createContact(userId, req.body);
    res.status(201).json(contact);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// Update contact
router.patch("/contacts/:contactId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const contact = await updateContact(userId, req.params.contactId!, req.body);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// Delete contact
router.delete("/contacts/:contactId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deleteContact(userId, req.params.contactId!);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

// ============ SOCIAL EVENTS ============

// Get all social events
router.get("/events", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const events = await getSocialEvents(userId);
    res.json(events);
  } catch (error) {
    console.error("Error getting social events:", error);
    res.status(500).json({ error: "Failed to get social events" });
  }
});

// Get single social event
router.get("/events/:eventId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = await getSocialEvent(userId, req.params.eventId!);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error getting social event:", error);
    res.status(500).json({ error: "Failed to get social event" });
  }
});

// Create social event
router.post("/events", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = await createSocialEvent(userId, req.body);
    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating social event:", error);
    res.status(500).json({ error: "Failed to create social event" });
  }
});

// Update social event
router.patch("/events/:eventId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const event = await updateSocialEvent(userId, req.params.eventId!, req.body);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error("Error updating social event:", error);
    res.status(500).json({ error: "Failed to update social event" });
  }
});

// Delete social event
router.delete("/events/:eventId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deleteSocialEvent(userId, req.params.eventId!);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting social event:", error);
    res.status(500).json({ error: "Failed to delete social event" });
  }
});

// ============ APPOINTMENTS ============

// Get all appointments
router.get("/appointments", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const appointments = await getAppointments(userId);
    res.json(appointments);
  } catch (error) {
    console.error("Error getting appointments:", error);
    res.status(500).json({ error: "Failed to get appointments" });
  }
});

// Get single appointment
router.get("/appointments/:appointmentId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const appointment = await getAppointment(userId, req.params.appointmentId!);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    console.error("Error getting appointment:", error);
    res.status(500).json({ error: "Failed to get appointment" });
  }
});

// Create appointment
router.post("/appointments", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const appointment = await createAppointment(userId, req.body);
    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

// Update appointment
router.patch("/appointments/:appointmentId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const appointment = await updateAppointment(userId, req.params.appointmentId!, req.body);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Failed to update appointment" });
  }
});

// Delete appointment
router.delete("/appointments/:appointmentId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deleteAppointment(userId, req.params.appointmentId!);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
});

// ============ TRAVEL PLANS ============

// Get all travel plans
router.get("/travel", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plans = await getTravelPlans(userId);
    res.json(plans);
  } catch (error) {
    console.error("Error getting travel plans:", error);
    res.status(500).json({ error: "Failed to get travel plans" });
  }
});

// Get single travel plan
router.get("/travel/:travelPlanId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await getTravelPlan(userId, req.params.travelPlanId!);
    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }
    res.json(plan);
  } catch (error) {
    console.error("Error getting travel plan:", error);
    res.status(500).json({ error: "Failed to get travel plan" });
  }
});

// Create travel plan
router.post("/travel", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await createTravelPlan(userId, req.body);
    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating travel plan:", error);
    res.status(500).json({ error: "Failed to create travel plan" });
  }
});

// Update travel plan
router.patch("/travel/:travelPlanId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = await updateTravelPlan(userId, req.params.travelPlanId!, req.body);
    if (!plan) {
      return res.status(404).json({ error: "Travel plan not found" });
    }
    res.json(plan);
  } catch (error) {
    console.error("Error updating travel plan:", error);
    res.status(500).json({ error: "Failed to update travel plan" });
  }
});

// Delete travel plan
router.delete("/travel/:travelPlanId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deleteTravelPlan(userId, req.params.travelPlanId!);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting travel plan:", error);
    res.status(500).json({ error: "Failed to delete travel plan" });
  }
});

// ============ GIFTS ============

// Get all gifts
router.get("/gifts", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const gifts = await getGifts(userId);
    res.json(gifts);
  } catch (error) {
    console.error("Error getting gifts:", error);
    res.status(500).json({ error: "Failed to get gifts" });
  }
});

// Get single gift
router.get("/gifts/:giftId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const gift = await getGift(userId, req.params.giftId!);
    if (!gift) {
      return res.status(404).json({ error: "Gift not found" });
    }
    res.json(gift);
  } catch (error) {
    console.error("Error getting gift:", error);
    res.status(500).json({ error: "Failed to get gift" });
  }
});

// Create gift
router.post("/gifts", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const gift = await createGift(userId, req.body);
    res.status(201).json(gift);
  } catch (error) {
    console.error("Error creating gift:", error);
    res.status(500).json({ error: "Failed to create gift" });
  }
});

// Update gift
router.patch("/gifts/:giftId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const gift = await updateGift(userId, req.params.giftId!, req.body);
    if (!gift) {
      return res.status(404).json({ error: "Gift not found" });
    }
    res.json(gift);
  } catch (error) {
    console.error("Error updating gift:", error);
    res.status(500).json({ error: "Failed to update gift" });
  }
});

// Delete gift
router.delete("/gifts/:giftId", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deleteGift(userId, req.params.giftId!);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting gift:", error);
    res.status(500).json({ error: "Failed to delete gift" });
  }
});
