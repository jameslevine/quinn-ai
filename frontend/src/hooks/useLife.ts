import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient as api } from "../services/api";

// Types
export interface Contact {
  contactId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: "friend" | "family" | "colleague" | "acquaintance" | "other";
  birthday?: string;
  anniversary?: string;
  notes?: string;
  lastContactDate?: string;
  contactFrequencyDays?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialEvent {
  eventId: string;
  userId: string;
  title: string;
  description?: string;
  eventType: "date_night" | "dinner" | "party" | "meetup" | "birthday" | "anniversary" | "other";
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  venue?: string;
  venueBookingRef?: string;
  attendees: string[];
  budget?: number;
  actualCost?: number;
  status: "planned" | "confirmed" | "completed" | "cancelled";
  reminders: { date: string; sent: boolean }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  appointmentId: string;
  userId: string;
  title: string;
  description?: string;
  appointmentType:
    | "doctor"
    | "dentist"
    | "car_service"
    | "home_repair"
    | "haircut"
    | "vet"
    | "other";
  provider?: string;
  providerPhone?: string;
  providerAddress?: string;
  date: string;
  time: string;
  duration?: number;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  bookingRef?: string;
  cost?: number;
  insuranceCovered?: boolean;
  reminders: { date: string; sent: boolean }[];
  notes?: string;
  recurring?: {
    frequency: "weekly" | "monthly" | "quarterly" | "yearly";
    nextDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TravelPlan {
  travelPlanId: string;
  userId: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: "planning" | "booked" | "in_progress" | "completed" | "cancelled";
  budget?: number;
  actualCost?: number;
  travelers: string[];
  flights: {
    flightId: string;
    airline: string;
    flightNumber: string;
    departure: { airport: string; date: string; time: string };
    arrival: { airport: string; date: string; time: string };
    bookingRef?: string;
    cost?: number;
    status: "booked" | "checked_in" | "completed" | "cancelled";
  }[];
  accommodations: {
    accommodationId: string;
    name: string;
    type: "hotel" | "airbnb" | "hostel" | "resort" | "other";
    address?: string;
    checkIn: string;
    checkOut: string;
    bookingRef?: string;
    cost?: number;
    status: "booked" | "confirmed" | "completed" | "cancelled";
  }[];
  activities: {
    activityId: string;
    name: string;
    date: string;
    time?: string;
    location?: string;
    bookingRef?: string;
    cost?: number;
    notes?: string;
  }[];
  documents: {
    documentId: string;
    type: "passport" | "visa" | "insurance" | "ticket" | "reservation" | "other";
    name: string;
    expiryDate?: string;
    fileUrl?: string;
  }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Gift {
  giftId: string;
  userId: string;
  recipientContactId?: string;
  recipientName: string;
  occasion: string;
  occasionDate: string;
  giftIdea?: string;
  purchasedItem?: string;
  budget?: number;
  actualCost?: number;
  status: "idea" | "purchased" | "wrapped" | "given";
  purchaseUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ CONTACTS ============

export const useContacts = () => {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const response = await api.get<Contact[]>("/life/contacts");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch contacts");
      }
      return response.data || [];
    },
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      contact: Omit<Contact, "contactId" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const response = await api.post<Contact>("/life/contacts", contact);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      updates,
    }: {
      contactId: string;
      updates: Partial<Contact>;
    }) => {
      const response = await api.patch<Contact>(`/life/contacts/${contactId}`, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string) => {
      await api.delete(`/life/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};

// ============ SOCIAL EVENTS ============

export const useSocialEvents = () => {
  return useQuery({
    queryKey: ["socialEvents"],
    queryFn: async () => {
      const response = await api.get<SocialEvent[]>("/life/events");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch events");
      }
      return response.data || [];
    },
  });
};

export const useCreateSocialEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      event: Omit<SocialEvent, "eventId" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const response = await api.post<SocialEvent>("/life/events", event);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialEvents"] });
    },
  });
};

export const useUpdateSocialEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      updates,
    }: {
      eventId: string;
      updates: Partial<SocialEvent>;
    }) => {
      const response = await api.patch<SocialEvent>(`/life/events/${eventId}`, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialEvents"] });
    },
  });
};

export const useDeleteSocialEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.delete(`/life/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialEvents"] });
    },
  });
};

// ============ APPOINTMENTS ============

export const useAppointments = () => {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const response = await api.get<Appointment[]>("/life/appointments");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch appointments");
      }
      return response.data || [];
    },
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      appointment: Omit<Appointment, "appointmentId" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const response = await api.post<Appointment>("/life/appointments", appointment);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appointmentId,
      updates,
    }: {
      appointmentId: string;
      updates: Partial<Appointment>;
    }) => {
      const response = await api.patch<Appointment>(`/life/appointments/${appointmentId}`, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      await api.delete(`/life/appointments/${appointmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
};

// ============ TRAVEL PLANS ============

export const useTravelPlans = () => {
  return useQuery({
    queryKey: ["travelPlans"],
    queryFn: async () => {
      const response = await api.get<TravelPlan[]>("/life/travel");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch travel plans");
      }
      return response.data || [];
    },
  });
};

export const useCreateTravelPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      plan: Omit<TravelPlan, "travelPlanId" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const response = await api.post<TravelPlan>("/life/travel", plan);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travelPlans"] });
    },
  });
};

export const useUpdateTravelPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      travelPlanId,
      updates,
    }: {
      travelPlanId: string;
      updates: Partial<TravelPlan>;
    }) => {
      const response = await api.patch<TravelPlan>(`/life/travel/${travelPlanId}`, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travelPlans"] });
    },
  });
};

export const useDeleteTravelPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (travelPlanId: string) => {
      await api.delete(`/life/travel/${travelPlanId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travelPlans"] });
    },
  });
};

// ============ GIFTS ============

export const useGifts = () => {
  return useQuery({
    queryKey: ["gifts"],
    queryFn: async () => {
      const response = await api.get<Gift[]>("/life/gifts");
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch gifts");
      }
      return response.data || [];
    },
  });
};

export const useCreateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gift: Omit<Gift, "giftId" | "userId" | "createdAt" | "updatedAt">) => {
      const response = await api.post<Gift>("/life/gifts", gift);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
  });
};

export const useUpdateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ giftId, updates }: { giftId: string; updates: Partial<Gift> }) => {
      const response = await api.patch<Gift>(`/life/gifts/${giftId}`, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
  });
};

export const useDeleteGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (giftId: string) => {
      await api.delete(`/life/gifts/${giftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts"] });
    },
  });
};
