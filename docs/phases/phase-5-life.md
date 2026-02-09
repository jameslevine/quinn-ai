# Phase 5: Life (Weeks 27-32)

## Overview

Phase 5 completes Quinn's capabilities with social planning, appointment booking, travel management, and home administration.

## Goals

1. Build social and relationship management
2. Implement appointment booking automation
3. Add travel planning and booking
4. Create home management features
5. Complete the full life admin suite

---

## Week 27-28: Social & Relationships

### Objectives

- Build contact management system
- Implement relationship tracking
- Create date night planning
- Add gift suggestions and ordering

### Deliverables

#### 5.1 Contact Management

```typescript
interface ContactService {
  // Import
  importContacts(userId: string, source: ContactSource): Promise<Contact[]>;

  // Management
  getContacts(userId: string): Promise<Contact[]>;
  updateContact(contactId: string, updates: ContactUpdate): Promise<Contact>;

  // Relationships
  setRelationshipType(contactId: string, type: RelationshipType): Promise<void>;
  setPriority(contactId: string, priority: Priority): Promise<void>;
}

interface Contact {
  contactId: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  birthday?: string;
  anniversary?: string;
  relationshipType: RelationshipType;
  priority: Priority;
  lastContactDate?: string;
  notes?: string;
}

type RelationshipType = "family" | "friend" | "colleague" | "acquaintance" | "partner";
type Priority = "high" | "medium" | "low";
```

**Tasks:**

- [ ] Build contact import (Google, Outlook)
- [ ] Create contact management UI
- [ ] Implement relationship tracking
- [ ] Add important dates tracking
- [ ] Build contact reminders

#### 5.2 Social Calendar

```typescript
interface SocialCalendarService {
  // Events
  getUpcomingEvents(userId: string): Promise<SocialEvent[]>;
  createEvent(userId: string, event: SocialEventInput): Promise<SocialEvent>;

  // Reminders
  getContactReminders(userId: string): Promise<ContactReminder[]>;
  suggestReachOut(userId: string): Promise<Contact[]>;

  // Messages
  generateBirthdayMessage(contact: Contact): Promise<string>;
  sendMessage(contactId: string, message: string, channel: MessageChannel): Promise<void>;
}

interface SocialEvent {
  eventId: string;
  type: "birthday" | "anniversary" | "meetup" | "date_night" | "other";
  contact?: Contact;
  date: string;
  reminder: boolean;
  reminderDays: number;
}
```

**Tasks:**

- [ ] Build event tracking
- [ ] Implement reminders
- [ ] Add reach-out suggestions
- [ ] Create message generation
- [ ] Build social calendar UI

#### 5.3 Date Night Planning

```typescript
interface DateNightService {
  // Suggestions
  suggestDateIdeas(preferences: DatePreferences): Promise<DateIdea[]>;

  // Booking
  bookRestaurant(restaurantId: string, details: ReservationDetails): Promise<Reservation>;
  bookActivity(activityId: string, details: BookingDetails): Promise<Booking>;

  // Planning
  createDatePlan(userId: string, date: string): Promise<DatePlan>;
}

interface DatePreferences {
  budget: number;
  location: Location;
  interests: string[];
  occasion?: string;
  timeOfDay: "lunch" | "dinner" | "evening";
}
```

**Tasks:**

- [ ] Build date idea suggestions
- [ ] Integrate restaurant booking (OpenTable)
- [ ] Add activity discovery
- [ ] Create date plan generator
- [ ] Build date planning UI

#### 5.4 Gift Management

```typescript
interface GiftService {
  // Suggestions
  suggestGifts(contact: Contact, occasion: string, budget: number): Promise<GiftSuggestion[]>;

  // Ordering
  orderGift(giftId: string, recipient: Contact): Promise<Order>;

  // Tracking
  getGiftHistory(contactId: string): Promise<GiftRecord[]>;
  setGiftPreferences(contactId: string, preferences: GiftPreferences): Promise<void>;
}
```

**Tasks:**

- [ ] Build gift suggestion algorithm
- [ ] Integrate Amazon for ordering
- [ ] Add gift tracking
- [ ] Create gift preference storage
- [ ] Build gift management UI

---

## Week 29-30: Appointments & Bookings

### Objectives

- Integrate calendar services
- Build appointment booking automation
- Create service provider management
- Implement reminder system

### Deliverables

#### 5.5 Calendar Integration

```typescript
interface CalendarService {
  // Connection
  connect(userId: string, provider: CalendarProvider): Promise<void>;

  // Events
  getEvents(userId: string, dateRange: DateRange): Promise<CalendarEvent[]>;
  createEvent(userId: string, event: CalendarEventInput): Promise<CalendarEvent>;
  updateEvent(eventId: string, updates: CalendarEventUpdate): Promise<CalendarEvent>;

  // Availability
  getAvailability(userId: string, dateRange: DateRange): Promise<TimeSlot[]>;
  findMeetingTime(participants: string[], duration: number): Promise<TimeSlot[]>;
}

type CalendarProvider = "google" | "outlook" | "apple";
```

**Tasks:**

- [ ] Integrate Google Calendar
- [ ] Integrate Outlook Calendar
- [ ] Build event management
- [ ] Implement availability checking
- [ ] Create calendar sync

#### 5.6 Appointment Booking

```typescript
interface AppointmentService {
  // Providers
  findProviders(type: ServiceType, location: Location): Promise<ServiceProvider[]>;
  getProviderAvailability(providerId: string): Promise<TimeSlot[]>;

  // Booking
  bookAppointment(
    providerId: string,
    slot: TimeSlot,
    details: AppointmentDetails
  ): Promise<Appointment>;
  rescheduleAppointment(appointmentId: string, newSlot: TimeSlot): Promise<Appointment>;
  cancelAppointment(appointmentId: string): Promise<void>;

  // Automation
  scheduleRecurring(type: ServiceType, frequency: Frequency): Promise<void>;
}

type ServiceType =
  | "doctor"
  | "dentist"
  | "optician"
  | "hairdresser"
  | "car_service"
  | "home_repair"
  | "cleaning";
```

**Tasks:**

- [ ] Build provider search
- [ ] Implement booking flow
- [ ] Add phone-based booking (using Phase 2)
- [ ] Create recurring appointments
- [ ] Build appointment management UI

#### 5.7 Service Provider Management

```typescript
interface ProviderManagementService {
  // Favorites
  addFavoriteProvider(userId: string, provider: ServiceProvider): Promise<void>;
  getFavoriteProviders(userId: string, type?: ServiceType): Promise<ServiceProvider[]>;

  // History
  getServiceHistory(userId: string, type?: ServiceType): Promise<ServiceRecord[]>;

  // Preferences
  setProviderPreferences(
    userId: string,
    type: ServiceType,
    prefs: ProviderPreferences
  ): Promise<void>;
}
```

**Tasks:**

- [ ] Build provider favorites
- [ ] Create service history
- [ ] Implement preference storage
- [ ] Add provider ratings
- [ ] Build provider management UI

---

## Week 31-32: Travel Planning

### Objectives

- Integrate flight search and booking
- Add hotel booking
- Implement train booking
- Create itinerary management

### Deliverables

#### 5.8 Travel Search

```typescript
interface TravelSearchService {
  // Flights
  searchFlights(criteria: FlightCriteria): Promise<Flight[]>;
  getFlightDetails(flightId: string): Promise<FlightDetails>;

  // Hotels
  searchHotels(criteria: HotelCriteria): Promise<Hotel[]>;
  getHotelDetails(hotelId: string): Promise<HotelDetails>;

  // Trains
  searchTrains(criteria: TrainCriteria): Promise<Train[]>;

  // Packages
  searchPackages(criteria: PackageCriteria): Promise<TravelPackage[]>;
}

interface FlightCriteria {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: "economy" | "premium" | "business" | "first";
  directOnly?: boolean;
}
```

**Tasks:**

- [ ] Integrate Skyscanner API
- [ ] Integrate Booking.com API
- [ ] Integrate Trainline API
- [ ] Build search UI
- [ ] Add price alerts

#### 5.9 Travel Booking

```typescript
interface TravelBookingService {
  // Booking
  bookFlight(flightId: string, passengers: Passenger[]): Promise<FlightBooking>;
  bookHotel(hotelId: string, details: HotelBookingDetails): Promise<HotelBooking>;
  bookTrain(trainId: string, passengers: Passenger[]): Promise<TrainBooking>;

  // Management
  getBookings(userId: string): Promise<TravelBooking[]>;
  cancelBooking(bookingId: string): Promise<RefundDetails>;
  modifyBooking(bookingId: string, changes: BookingChanges): Promise<TravelBooking>;
}
```

**Tasks:**

- [ ] Implement flight booking
- [ ] Implement hotel booking
- [ ] Implement train booking
- [ ] Add booking management
- [ ] Create booking confirmation flow

#### 5.10 Itinerary Management

```typescript
interface ItineraryService {
  // Creation
  createItinerary(userId: string, trip: TripDetails): Promise<Itinerary>;
  addToItinerary(itineraryId: string, item: ItineraryItem): Promise<void>;

  // Management
  getItinerary(itineraryId: string): Promise<Itinerary>;
  shareItinerary(itineraryId: string, email: string): Promise<void>;

  // Documents
  addDocument(itineraryId: string, document: TravelDocument): Promise<void>;
  getDocuments(itineraryId: string): Promise<TravelDocument[]>;
}

interface Itinerary {
  itineraryId: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  destination: string;
  items: ItineraryItem[];
  bookings: TravelBooking[];
  documents: TravelDocument[];
}
```

**Tasks:**

- [ ] Build itinerary creation
- [ ] Add booking integration
- [ ] Implement document storage
- [ ] Create sharing feature
- [ ] Build itinerary UI

---

## API Endpoints

### Contacts API

```
GET    /contacts                   # List contacts
POST   /contacts/import            # Import contacts
GET    /contacts/:id               # Get contact
PATCH  /contacts/:id               # Update contact
GET    /contacts/reminders         # Get reminders
```

### Social API

```
GET    /social/events              # List social events
POST   /social/events              # Create event
GET    /social/date-ideas          # Get date suggestions
POST   /social/reservations        # Book restaurant
GET    /social/gifts/suggestions   # Get gift ideas
POST   /social/gifts/order         # Order gift
```

### Appointments API

```
GET    /appointments               # List appointments
POST   /appointments               # Book appointment
GET    /appointments/:id           # Get appointment
PATCH  /appointments/:id           # Reschedule
DELETE /appointments/:id           # Cancel
GET    /providers                  # Search providers
```

### Travel API

```
GET    /travel/flights             # Search flights
GET    /travel/hotels              # Search hotels
GET    /travel/trains              # Search trains
POST   /travel/bookings            # Create booking
GET    /travel/bookings            # List bookings
GET    /travel/itineraries         # List itineraries
POST   /travel/itineraries         # Create itinerary
```

---

## Success Criteria

- [ ] Contact import working
- [ ] Relationship tracking functional
- [ ] Date night suggestions relevant
- [ ] Gift ordering working
- [ ] Calendar integration complete
- [ ] Appointment booking automated
- [ ] Travel search functional
- [ ] Booking flow complete
- [ ] Itinerary management working

---

## Risk Mitigation

| Risk                 | Mitigation                                   |
| -------------------- | -------------------------------------------- |
| Calendar sync issues | Support multiple providers, handle conflicts |
| Booking failures     | Implement retry, manual fallback             |
| Travel API costs     | Cache results, rate limit searches           |
| Privacy concerns     | Clear consent, data minimization             |

---

## Project Completion

### Full Feature Set

After Phase 5, Quinn will be able to:

1. **Communication**
   - Manage emails (read, categorize, draft, send)
   - Make phone calls (appointments, customer service)
   - Send SMS and handle approvals

2. **Money**
   - Track spending across accounts
   - Manage budgets and alerts
   - Pay bills automatically

3. **Food**
   - Plan meals and generate shopping lists
   - Order groceries automatically
   - Order food delivery

4. **Life**
   - Manage relationships and social calendar
   - Book appointments automatically
   - Plan and book travel

### Success Metrics

| Metric                 | Target          |
| ---------------------- | --------------- |
| Monthly Active Users   | 10,000          |
| Actions per User/Month | 50+             |
| Approval Rate          | 80%+            |
| Time Saved per User    | 10+ hours/month |
| NPS Score              | 50+             |

### Next Steps

1. **Beta Launch** - 500 users
2. **Iterate** - Based on feedback
3. **Scale** - Marketing and growth
4. **Expand** - New integrations and features
