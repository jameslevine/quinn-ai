# Phase 4: Food (Weeks 21-26)

## Overview

Phase 4 adds food management capabilities, enabling Quinn to plan meals, order groceries, and handle food delivery.

## Goals

1. Build meal planning with recipe suggestions
2. Integrate grocery delivery services (Ocado, Tesco)
3. Connect food delivery apps (Deliveroo, Uber Eats)
4. Implement dietary preference handling
5. Add nutrition tracking

---

## Week 21-22: Meal Planning

### Objectives

- Build recipe database integration
- Implement meal plan generation
- Handle dietary preferences and restrictions
- Create shopping list generation

### Deliverables

#### 4.1 Recipe Service

```typescript
interface RecipeService {
  // Search
  searchRecipes(query: string, filters: RecipeFilters): Promise<Recipe[]>;
  getRecipe(recipeId: string): Promise<Recipe>;

  // Suggestions
  suggestRecipes(preferences: UserPreferences): Promise<Recipe[]>;
  suggestBasedOnIngredients(ingredients: string[]): Promise<Recipe[]>;

  // Favorites
  addFavorite(userId: string, recipeId: string): Promise<void>;
  getFavorites(userId: string): Promise<Recipe[]>;
}

interface Recipe {
  recipeId: string;
  name: string;
  description: string;
  cuisine: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  dietaryTags: DietaryTag[];
  imageUrl: string;
}
```

**Tasks:**

- [ ] Integrate recipe API (Spoonacular/Edamam)
- [ ] Build recipe search
- [ ] Implement filtering
- [ ] Add favorites system
- [ ] Create recipe detail view

#### 4.2 Meal Planning Service

```typescript
interface MealPlanningService {
  // Generation
  generateWeeklyPlan(userId: string, preferences: MealPlanPreferences): Promise<MealPlan>;

  // Management
  getMealPlan(userId: string, week: string): Promise<MealPlan>;
  updateMealPlan(planId: string, updates: MealPlanUpdate): Promise<MealPlan>;

  // Shopping
  generateShoppingList(planId: string): Promise<ShoppingList>;
}

interface MealPlan {
  planId: string;
  userId: string;
  weekStart: string;
  meals: {
    day: string;
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snacks?: Recipe[];
  }[];
  shoppingList: ShoppingList;
}
```

**Tasks:**

- [ ] Design meal plan schema
- [ ] Implement AI-powered plan generation
- [ ] Add meal swapping
- [ ] Build shopping list generation
- [ ] Create meal plan UI

#### 4.3 Dietary Preferences

```typescript
interface DietaryPreferences {
  restrictions: DietaryRestriction[];
  allergies: string[];
  dislikes: string[];
  cuisinePreferences: string[];
  calorieTarget?: number;
  macroTargets?: MacroTargets;
  budgetPerMeal?: number;
  householdSize: number;
}

type DietaryRestriction =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "halal"
  | "kosher"
  | "low_carb"
  | "keto";
```

**Tasks:**

- [ ] Create preferences schema
- [ ] Implement preference filtering
- [ ] Add allergy warnings
- [ ] Build preference UI
- [ ] Integrate with meal planning

---

## Week 23-24: Grocery Shopping

### Objectives

- Integrate Ocado API
- Integrate Tesco API
- Build price comparison
- Implement order automation

### Deliverables

#### 4.4 Grocery Service

```typescript
interface GroceryService {
  // Connection
  connect(userId: string, provider: GroceryProvider): Promise<void>;

  // Search
  searchProducts(query: string, provider?: GroceryProvider): Promise<Product[]>;

  // Cart
  createCart(userId: string, provider: GroceryProvider): Promise<Cart>;
  addToCart(cartId: string, product: Product, quantity: number): Promise<void>;

  // Orders
  checkout(cartId: string, deliverySlot: DeliverySlot): Promise<Order>;
  getOrders(userId: string): Promise<Order[]>;

  // Automation
  reorderFavorites(userId: string): Promise<Cart>;
  orderFromShoppingList(userId: string, listId: string): Promise<Cart>;
}

type GroceryProvider = "ocado" | "tesco" | "amazon_fresh" | "sainsburys";
```

**Tasks:**

- [ ] Integrate Ocado API
- [ ] Integrate Tesco API
- [ ] Build product search
- [ ] Implement cart management
- [ ] Add order tracking

#### 4.5 Price Comparison

```typescript
interface PriceComparisonService {
  // Compare
  compareProduct(productName: string): Promise<PriceComparison>;
  compareCart(items: CartItem[]): Promise<CartComparison>;

  // Suggestions
  suggestCheaperAlternatives(product: Product): Promise<Product[]>;
  findBestDeals(category: string): Promise<Deal[]>;
}

interface PriceComparison {
  productName: string;
  prices: {
    provider: GroceryProvider;
    price: number;
    unitPrice: number;
    inStock: boolean;
  }[];
  cheapest: GroceryProvider;
  savings: number;
}
```

**Tasks:**

- [ ] Build price aggregation
- [ ] Implement comparison logic
- [ ] Add deal detection
- [ ] Create comparison UI
- [ ] Add price alerts

#### 4.6 Delivery Scheduling

```typescript
interface DeliveryService {
  // Slots
  getAvailableSlots(provider: GroceryProvider, postcode: string): Promise<DeliverySlot[]>;

  // Scheduling
  scheduleDelivery(orderId: string, slot: DeliverySlot): Promise<void>;
  rescheduleDelivery(orderId: string, newSlot: DeliverySlot): Promise<void>;

  // Integration
  syncWithCalendar(userId: string, delivery: Delivery): Promise<void>;
}
```

**Tasks:**

- [ ] Implement slot fetching
- [ ] Build scheduling logic
- [ ] Add calendar integration
- [ ] Create delivery tracking
- [ ] Add delivery reminders

---

## Week 25-26: Food Delivery

### Objectives

- Integrate Deliveroo
- Integrate Uber Eats
- Build restaurant discovery
- Implement order automation

### Deliverables

#### 4.7 Food Delivery Service

```typescript
interface FoodDeliveryService {
  // Discovery
  searchRestaurants(location: Location, filters: RestaurantFilters): Promise<Restaurant[]>;
  getRestaurant(restaurantId: string): Promise<Restaurant>;
  getMenu(restaurantId: string): Promise<Menu>;

  // Orders
  createOrder(userId: string, items: MenuItem[], restaurant: Restaurant): Promise<Order>;
  trackOrder(orderId: string): Promise<OrderStatus>;
  cancelOrder(orderId: string): Promise<void>;

  // History
  getOrderHistory(userId: string): Promise<Order[]>;
  reorder(orderId: string): Promise<Order>;
}

type FoodDeliveryProvider = "deliveroo" | "uber_eats" | "just_eat";
```

**Tasks:**

- [ ] Integrate Deliveroo API
- [ ] Integrate Uber Eats API
- [ ] Build restaurant search
- [ ] Implement order placement
- [ ] Add order tracking

#### 4.8 Smart Suggestions

```typescript
interface FoodSuggestionService {
  // Suggestions
  suggestRestaurant(userId: string, context: MealContext): Promise<Restaurant[]>;
  suggestDish(userId: string, restaurant: Restaurant): Promise<MenuItem[]>;

  // Learning
  recordPreference(userId: string, preference: FoodPreference): Promise<void>;

  // Context
  getMealContext(userId: string): Promise<MealContext>;
}

interface MealContext {
  timeOfDay: "breakfast" | "lunch" | "dinner" | "snack";
  dayOfWeek: string;
  weather?: string;
  recentOrders: Order[];
  budget?: number;
}
```

**Tasks:**

- [ ] Build suggestion algorithm
- [ ] Implement preference learning
- [ ] Add context awareness
- [ ] Create suggestion UI
- [ ] Add quick reorder

---

## API Endpoints

### Recipes API

```
GET    /recipes                    # Search recipes
GET    /recipes/:id                # Get recipe details
GET    /recipes/suggestions        # Get suggestions
POST   /recipes/:id/favorite       # Add to favorites
DELETE /recipes/:id/favorite       # Remove from favorites
```

### Meal Plans API

```
GET    /meal-plans                 # List meal plans
POST   /meal-plans/generate        # Generate new plan
GET    /meal-plans/:id             # Get plan details
PATCH  /meal-plans/:id             # Update plan
GET    /meal-plans/:id/shopping    # Get shopping list
```

### Grocery API

```
GET    /grocery/products           # Search products
POST   /grocery/cart               # Create cart
POST   /grocery/cart/:id/items     # Add to cart
GET    /grocery/slots              # Get delivery slots
POST   /grocery/checkout           # Place order
GET    /grocery/orders             # List orders
```

### Food Delivery API

```
GET    /delivery/restaurants       # Search restaurants
GET    /delivery/restaurants/:id   # Get restaurant
GET    /delivery/restaurants/:id/menu  # Get menu
POST   /delivery/orders            # Place order
GET    /delivery/orders/:id        # Track order
POST   /delivery/orders/:id/reorder # Reorder
```

---

## Success Criteria

- [ ] Recipe search working
- [ ] Meal plans generating correctly
- [ ] Dietary preferences respected
- [ ] Grocery ordering functional
- [ ] Price comparison accurate
- [ ] Food delivery working
- [ ] Order tracking functional
- [ ] Suggestions improving over time

---

## Risk Mitigation

| Risk             | Mitigation                                   |
| ---------------- | -------------------------------------------- |
| API availability | Support multiple providers                   |
| Price accuracy   | Real-time price fetching                     |
| Dietary mistakes | Double-check allergies, require confirmation |
| Delivery issues  | Track orders, notify user of delays          |

---

## Next Phase Preview

**Phase 5: Life (Weeks 27-32)**

- Social and relationship management
- Appointment booking automation
- Travel planning and booking
- Home management
