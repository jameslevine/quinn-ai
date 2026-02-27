import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || "quinn-main-dev";

// ============ TYPES ============

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
  contactFrequencyDays?: number; // How often to remind to contact
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
  attendees: string[]; // Contact IDs
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
  duration?: number; // minutes
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
  travelers: string[]; // Contact IDs or names
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

export const createContact = async (
  userId: string,
  contact: Omit<Contact, "contactId" | "userId" | "createdAt" | "updatedAt">
): Promise<Contact> => {
  const now = new Date().toISOString();
  const contactId = uuidv4();

  const newContact: Contact = {
    ...contact,
    contactId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `CONTACT#${contactId}`,
        ...newContact,
      },
    })
  );

  return newContact;
};

export const getContacts = async (userId: string): Promise<Contact[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "CONTACT#",
      },
    })
  );

  return (result.Items || []) as Contact[];
};

export const getContact = async (userId: string, contactId: string): Promise<Contact | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `CONTACT#${contactId}`,
      },
    })
  );

  return (result.Item as Contact) || null;
};

export const updateContact = async (
  userId: string,
  contactId: string,
  updates: Partial<Contact>
): Promise<Contact | null> => {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "contactId" && key !== "userId" && key !== "createdAt") {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `CONTACT#${contactId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return (result.Attributes as Contact) || null;
};

export const deleteContact = async (userId: string, contactId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `CONTACT#${contactId}`,
      },
    })
  );
};

// ============ SOCIAL EVENTS ============

export const createSocialEvent = async (
  userId: string,
  event: Omit<SocialEvent, "eventId" | "userId" | "createdAt" | "updatedAt">
): Promise<SocialEvent> => {
  const now = new Date().toISOString();
  const eventId = uuidv4();

  const newEvent: SocialEvent = {
    ...event,
    eventId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `SOCIAL_EVENT#${eventId}`,
        gsi1pk: `USER#${userId}#SOCIAL_EVENTS`,
        gsi1sk: event.date,
        ...newEvent,
      },
    })
  );

  return newEvent;
};

export const getSocialEvents = async (userId: string): Promise<SocialEvent[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "SOCIAL_EVENT#",
      },
    })
  );

  return (result.Items || []) as SocialEvent[];
};

export const getSocialEvent = async (
  userId: string,
  eventId: string
): Promise<SocialEvent | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `SOCIAL_EVENT#${eventId}`,
      },
    })
  );

  return (result.Item as SocialEvent) || null;
};

export const updateSocialEvent = async (
  userId: string,
  eventId: string,
  updates: Partial<SocialEvent>
): Promise<SocialEvent | null> => {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "eventId" && key !== "userId" && key !== "createdAt") {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `SOCIAL_EVENT#${eventId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return (result.Attributes as SocialEvent) || null;
};

export const deleteSocialEvent = async (userId: string, eventId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `SOCIAL_EVENT#${eventId}`,
      },
    })
  );
};

// ============ APPOINTMENTS ============

export const createAppointment = async (
  userId: string,
  appointment: Omit<Appointment, "appointmentId" | "userId" | "createdAt" | "updatedAt">
): Promise<Appointment> => {
  const now = new Date().toISOString();
  const appointmentId = uuidv4();

  const newAppointment: Appointment = {
    ...appointment,
    appointmentId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `APPOINTMENT#${appointmentId}`,
        gsi1pk: `USER#${userId}#APPOINTMENTS`,
        gsi1sk: appointment.date,
        ...newAppointment,
      },
    })
  );

  return newAppointment;
};

export const getAppointments = async (userId: string): Promise<Appointment[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "APPOINTMENT#",
      },
    })
  );

  return (result.Items || []) as Appointment[];
};

export const getAppointment = async (
  userId: string,
  appointmentId: string
): Promise<Appointment | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `APPOINTMENT#${appointmentId}`,
      },
    })
  );

  return (result.Item as Appointment) || null;
};

export const updateAppointment = async (
  userId: string,
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<Appointment | null> => {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "appointmentId" && key !== "userId" && key !== "createdAt") {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `APPOINTMENT#${appointmentId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return (result.Attributes as Appointment) || null;
};

export const deleteAppointment = async (userId: string, appointmentId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `APPOINTMENT#${appointmentId}`,
      },
    })
  );
};

// ============ TRAVEL PLANS ============

export const createTravelPlan = async (
  userId: string,
  plan: Omit<TravelPlan, "travelPlanId" | "userId" | "createdAt" | "updatedAt">
): Promise<TravelPlan> => {
  const now = new Date().toISOString();
  const travelPlanId = uuidv4();

  const newPlan: TravelPlan = {
    ...plan,
    travelPlanId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `TRAVEL_PLAN#${travelPlanId}`,
        gsi1pk: `USER#${userId}#TRAVEL`,
        gsi1sk: plan.startDate,
        ...newPlan,
      },
    })
  );

  return newPlan;
};

export const getTravelPlans = async (userId: string): Promise<TravelPlan[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "TRAVEL_PLAN#",
      },
    })
  );

  return (result.Items || []) as TravelPlan[];
};

export const getTravelPlan = async (
  userId: string,
  travelPlanId: string
): Promise<TravelPlan | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `TRAVEL_PLAN#${travelPlanId}`,
      },
    })
  );

  return (result.Item as TravelPlan) || null;
};

export const updateTravelPlan = async (
  userId: string,
  travelPlanId: string,
  updates: Partial<TravelPlan>
): Promise<TravelPlan | null> => {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "travelPlanId" && key !== "userId" && key !== "createdAt") {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `TRAVEL_PLAN#${travelPlanId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return (result.Attributes as TravelPlan) || null;
};

export const deleteTravelPlan = async (userId: string, travelPlanId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `TRAVEL_PLAN#${travelPlanId}`,
      },
    })
  );
};

// ============ GIFTS ============

export const createGift = async (
  userId: string,
  gift: Omit<Gift, "giftId" | "userId" | "createdAt" | "updatedAt">
): Promise<Gift> => {
  const now = new Date().toISOString();
  const giftId = uuidv4();

  const newGift: Gift = {
    ...gift,
    giftId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `USER#${userId}`,
        sk: `GIFT#${giftId}`,
        gsi1pk: `USER#${userId}#GIFTS`,
        gsi1sk: gift.occasionDate,
        ...newGift,
      },
    })
  );

  return newGift;
};

export const getGifts = async (userId: string): Promise<Gift[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "GIFT#",
      },
    })
  );

  return (result.Items || []) as Gift[];
};

export const getGift = async (userId: string, giftId: string): Promise<Gift | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `GIFT#${giftId}`,
      },
    })
  );

  return (result.Item as Gift) || null;
};

export const updateGift = async (
  userId: string,
  giftId: string,
  updates: Partial<Gift>
): Promise<Gift | null> => {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionAttributeNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionAttributeValues: Record<string, unknown> = {
    ":updatedAt": new Date().toISOString(),
  };

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "giftId" && key !== "userId" && key !== "createdAt") {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `GIFT#${giftId}`,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return (result.Attributes as Gift) || null;
};

export const deleteGift = async (userId: string, giftId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: `USER#${userId}`,
        sk: `GIFT#${giftId}`,
      },
    })
  );
};
