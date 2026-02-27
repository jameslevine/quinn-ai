# Phase 8: Real Integrations 🔌

## Overview

Phase 8 replaces simulated integrations with real API connections to food delivery, grocery, calendar, restaurant booking, and travel services.

**Status:** 📋 Planned  
**Estimated Duration:** 6-8 weeks

---

## Goals

1. Connect to real food delivery APIs (Deliveroo, Uber Eats, Just Eat)
2. Connect to grocery delivery APIs (Ocado, Tesco, Amazon Fresh)
3. Integrate Google Calendar and Outlook Calendar
4. Connect to restaurant booking APIs (OpenTable, Resy)
5. Integrate travel booking APIs (Skyscanner, Booking.com)
6. Add Amazon integration for gift shopping

---

## Features

### 8.1 Food Delivery Integration

**Services:**

- Deliveroo
- Uber Eats
- Just Eat

**Backend Components:**

```typescript
// backend/src/lib/food-delivery.ts
interface FoodDeliveryService {
  // Search restaurants
  searchRestaurants(location: Location, query?: string): Promise<Restaurant[]>;

  // Get menu
  getMenu(restaurantId: string): Promise<Menu>;

  // Create order
  createOrder(order: FoodOrder): Promise<OrderConfirmation>;

  // Track order
  trackOrder(orderId: string): Promise<OrderStatus>;

  // Cancel order
  cancelOrder(orderId: string): Promise<void>;
}
```

**Tasks:**

- [ ] Research API availability (most require partnerships)
- [ ] Implement Deliveroo integration (if API available)
- [ ] Implement Uber Eats integration
- [ ] Implement Just Eat integration
- [ ] Create unified food delivery adapter
- [ ] Add order tracking webhooks
- [ ] Implement fallback to web scraping if needed

### 8.2 Grocery Delivery Integration

**Services:**

- Ocado
- Tesco
- Amazon Fresh
- Sainsbury's

**Backend Components:**

```typescript
// backend/src/lib/grocery.ts
interface GroceryService {
  // Search products
  searchProducts(query: string): Promise<Product[]>;

  // Get product details
  getProduct(productId: string): Promise<Product>;

  // Add to basket
  addToBasket(items: BasketItem[]): Promise<Basket>;

  // Get delivery slots
  getDeliverySlots(): Promise<DeliverySlot[]>;

  // Place order
  placeOrder(basket: Basket, slot: DeliverySlot): Promise<Order>;

  // Track order
  trackOrder(orderId: string): Promise<OrderStatus>;
}
```

**Tasks:**

- [ ] Research Ocado API (partner program)
- [ ] Implement Tesco API integration
- [ ] Implement Amazon Fresh integration
- [ ] Create unified grocery adapter
- [ ] Implement product matching across stores
- [ ] Add price comparison feature
- [ ] Implement delivery slot optimization

### 8.3 Calendar Integration

**Services:**

- Google Calendar
- Microsoft Outlook Calendar
- Apple Calendar (via CalDAV)

**Backend Components:**

```typescript
// backend/src/lib/calendar.ts
interface CalendarService {
  // Get events
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;

  // Create event
  createEvent(event: CalendarEvent): Promise<CalendarEvent>;

  // Update event
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent>;

  // Delete event
  deleteEvent(eventId: string): Promise<void>;

  // Find free time
  findFreeTime(duration: number, range: DateRange): Promise<TimeSlot[]>;

  // Check availability
  checkAvailability(time: Date, duration: number): Promise<boolean>;
}
```

**Tasks:**

- [ ] Implement Google Calendar OAuth
- [ ] Implement Google Calendar API
- [ ] Implement Microsoft Graph API for Outlook
- [ ] Create unified calendar adapter
- [ ] Add two-way sync
- [ ] Implement conflict detection
- [ ] Add free/busy lookup

### 8.4 Restaurant Booking Integration

**Services:**

- OpenTable
- Resy
- TheFork
- Yelp Reservations

**Backend Components:**

```typescript
// backend/src/lib/restaurant-booking.ts
interface RestaurantBookingService {
  // Search restaurants
  searchRestaurants(criteria: SearchCriteria): Promise<Restaurant[]>;

  // Get availability
  getAvailability(restaurantId: string, date: Date, partySize: number): Promise<TimeSlot[]>;

  // Make reservation
  makeReservation(reservation: Reservation): Promise<Confirmation>;

  // Modify reservation
  modifyReservation(reservationId: string, changes: ReservationChanges): Promise<Confirmation>;

  // Cancel reservation
  cancelReservation(reservationId: string): Promise<void>;
}
```

**Tasks:**

- [ ] Apply for OpenTable API access
- [ ] Implement Resy integration
- [ ] Implement TheFork integration
- [ ] Create unified booking adapter
- [ ] Add restaurant recommendations
- [ ] Implement waitlist functionality

### 8.5 Travel Booking Integration

**Services:**

- Skyscanner (flights)
- Booking.com (hotels)
- Trainline (trains)
- Kayak (aggregator)

**Backend Components:**

```typescript
// backend/src/lib/travel.ts
interface TravelService {
  // Search flights
  searchFlights(origin: string, destination: string, dates: TravelDates): Promise<Flight[]>;

  // Search hotels
  searchHotels(location: string, dates: TravelDates, guests: number): Promise<Hotel[]>;

  // Search trains
  searchTrains(origin: string, destination: string, date: Date): Promise<Train[]>;

  // Book flight
  bookFlight(flight: Flight, passengers: Passenger[]): Promise<Booking>;

  // Book hotel
  bookHotel(hotel: Hotel, guests: Guest[]): Promise<Booking>;

  // Get booking
  getBooking(bookingId: string): Promise<Booking>;
}
```

**Tasks:**

- [ ] Implement Skyscanner API
- [ ] Implement Booking.com API
- [ ] Implement Trainline API
- [ ] Create unified travel adapter
- [ ] Add price alerts
- [ ] Implement itinerary builder
- [ ] Add travel document management

### 8.6 Shopping Integration

**Services:**

- Amazon
- eBay
- John Lewis

**Backend Components:**

```typescript
// backend/src/lib/shopping.ts
interface ShoppingService {
  // Search products
  searchProducts(query: string, filters?: ProductFilters): Promise<Product[]>;

  // Get product details
  getProduct(productId: string): Promise<Product>;

  // Add to cart
  addToCart(productId: string, quantity: number): Promise<Cart>;

  // Checkout
  checkout(cart: Cart, shippingAddress: Address): Promise<Order>;

  // Track order
  trackOrder(orderId: string): Promise<OrderStatus>;
}
```

**Tasks:**

- [ ] Implement Amazon Product Advertising API
- [ ] Implement eBay API
- [ ] Create unified shopping adapter
- [ ] Add price tracking
- [ ] Implement gift wrapping options
- [ ] Add delivery date estimation

---

## API Endpoints

### Food Delivery

```
GET    /delivery/restaurants      # Search restaurants
GET    /delivery/restaurants/:id/menu  # Get menu
POST   /delivery/orders           # Create order
GET    /delivery/orders/:id       # Get order status
DELETE /delivery/orders/:id       # Cancel order
```

### Grocery

```
GET    /grocery/products          # Search products
GET    /grocery/products/:id      # Get product
POST   /grocery/basket            # Create/update basket
GET    /grocery/slots             # Get delivery slots
POST   /grocery/orders            # Place order
```

### Calendar

```
GET    /calendar/events           # List events
POST   /calendar/events           # Create event
PATCH  /calendar/events/:id       # Update event
DELETE /calendar/events/:id       # Delete event
GET    /calendar/availability     # Check availability
```

### Restaurant Booking

```
GET    /restaurants/search        # Search restaurants
GET    /restaurants/:id/availability  # Get availability
POST   /restaurants/reservations  # Make reservation
PATCH  /restaurants/reservations/:id  # Modify
DELETE /restaurants/reservations/:id  # Cancel
```

### Travel

```
GET    /travel/flights            # Search flights
GET    /travel/hotels             # Search hotels
GET    /travel/trains             # Search trains
POST   /travel/bookings           # Create booking
GET    /travel/bookings/:id       # Get booking
```

---

## Integration Challenges

### API Access

Many services don't offer public APIs:

- **Deliveroo:** Partner-only API
- **Ocado:** No public API
- **OpenTable:** Requires approval

**Solutions:**

1. Apply for partner programs
2. Use affiliate APIs where available
3. Implement browser automation as fallback
4. Partner with aggregators

### Authentication

Each service has different auth:

- OAuth 2.0 (Google, Microsoft)
- API Keys (Skyscanner, Booking.com)
- Session-based (food delivery)

### Rate Limiting

- Implement request queuing
- Cache responses where appropriate
- Use webhooks instead of polling

---

## Data Models

### IntegrationConnection

```typescript
interface IntegrationConnection {
  pk: string; // USER#<userId>
  sk: string; // INTEGRATION#<service>
  userId: string;
  service: IntegrationService;
  status: "connected" | "expired" | "error";
  credentials: EncryptedCredentials;
  lastSync?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

type IntegrationService =
  | "google_calendar"
  | "outlook_calendar"
  | "deliveroo"
  | "uber_eats"
  | "ocado"
  | "tesco"
  | "opentable"
  | "skyscanner"
  | "booking_com"
  | "amazon";
```

---

## Success Criteria

- [ ] At least 2 food delivery services connected
- [ ] At least 2 grocery services connected
- [ ] Google Calendar fully integrated
- [ ] At least 1 restaurant booking service
- [ ] Flight and hotel search working
- [ ] Order tracking functional
- [ ] 95%+ API success rate

---

## Dependencies

- Partner agreements with services
- OAuth credentials for each service
- Webhook endpoints for real-time updates
- Increased API rate limits

---

## Risks & Mitigations

| Risk                      | Mitigation                          |
| ------------------------- | ----------------------------------- |
| API access denied         | Use aggregators, browser automation |
| API changes               | Version pinning, monitoring         |
| Rate limiting             | Caching, request queuing            |
| Authentication complexity | Unified auth adapter                |
| Cost per API call         | Usage tracking, caching             |
