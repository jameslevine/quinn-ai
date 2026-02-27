// Tests for food routes - Happy and Sad paths

// Mock the adapters
const mockCreateRecipe = jest.fn();
const mockGetRecipe = jest.fn();
const mockGetUserRecipes = jest.fn();
const mockUpdateRecipe = jest.fn();
const mockDeleteRecipe = jest.fn();
const mockCreateMealPlan = jest.fn();
const mockGetMealPlan = jest.fn();
const mockGetUserMealPlans = jest.fn();
const mockUpdateMealPlan = jest.fn();
const mockDeleteMealPlan = jest.fn();
const mockCreateGroceryList = jest.fn();
const mockGetGroceryList = jest.fn();
const mockGetUserGroceryLists = jest.fn();
const mockUpdateGroceryList = jest.fn();
const mockDeleteGroceryList = jest.fn();
const mockCreateFoodOrder = jest.fn();
const mockGetFoodOrder = jest.fn();
const mockGetUserFoodOrders = jest.fn();
const mockUpdateFoodOrder = jest.fn();
const mockGetDietaryPreferences = jest.fn();
const mockSaveDietaryPreferences = jest.fn();
const mockGenerateGroceryListFromMealPlan = jest.fn();

jest.mock("../../adapters/food", () => ({
  createRecipe: mockCreateRecipe,
  getRecipe: mockGetRecipe,
  getUserRecipes: mockGetUserRecipes,
  updateRecipe: mockUpdateRecipe,
  deleteRecipe: mockDeleteRecipe,
  createMealPlan: mockCreateMealPlan,
  getMealPlan: mockGetMealPlan,
  getUserMealPlans: mockGetUserMealPlans,
  updateMealPlan: mockUpdateMealPlan,
  deleteMealPlan: mockDeleteMealPlan,
  createGroceryList: mockCreateGroceryList,
  getGroceryList: mockGetGroceryList,
  getUserGroceryLists: mockGetUserGroceryLists,
  updateGroceryList: mockUpdateGroceryList,
  deleteGroceryList: mockDeleteGroceryList,
  createFoodOrder: mockCreateFoodOrder,
  getFoodOrder: mockGetFoodOrder,
  getUserFoodOrders: mockGetUserFoodOrders,
  updateFoodOrder: mockUpdateFoodOrder,
  getDietaryPreferences: mockGetDietaryPreferences,
  saveDietaryPreferences: mockSaveDietaryPreferences,
  generateGroceryListFromMealPlan: mockGenerateGroceryListFromMealPlan,
}));

jest.mock("../../middleware/cognito-auth", () => ({
  cognitoAuthMiddleware: jest.fn((req: any, _res: any, next: any) => {
    req.user = { sub: "test-user-id", email: "test@example.com" };
    next();
  }),
}));

// Import routes after mocking
import express from "express";
import { router as foodRouter } from "../../routes/food";

const app = express();
app.use(express.json());

// Add middleware to set req.user for all requests
app.use((req, _res, next) => {
  req.user = { sub: "test-user-id", email: "test@example.com" };
  next();
});

app.use("/food", foodRouter);

const request = require("supertest");

// Helper to create mock recipe
const createMockRecipe = (overrides = {}) => ({
  recipeId: "recipe-123",
  userId: "test-user-id",
  name: "Test Recipe",
  description: "A test recipe",
  ingredients: [{ name: "Flour", quantity: 2, unit: "cups" }],
  instructions: ["Mix ingredients", "Bake"],
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Helper to create mock meal plan
const createMockMealPlan = (overrides = {}) => ({
  mealPlanId: "plan-123",
  userId: "test-user-id",
  weekStartDate: "2026-02-09",
  meals: [{ day: "monday", mealType: "dinner", recipeName: "Test Recipe" }],
  status: "draft",
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Helper to create mock grocery list
const createMockGroceryList = (overrides = {}) => ({
  groceryListId: "list-123",
  userId: "test-user-id",
  name: "Weekly Groceries",
  items: [
    {
      itemId: "item-1",
      name: "Flour",
      quantity: 2,
      unit: "cups",
      category: "baking",
      checked: false,
    },
  ],
  status: "draft",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("Food Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // RECIPES
  // ==========================================
  describe("Recipes", () => {
    describe("GET /food/recipes", () => {
      it("should return 200 with recipes list", async () => {
        const mockRecipes = [createMockRecipe(), createMockRecipe({ recipeId: "recipe-456" })];
        mockGetUserRecipes.mockResolvedValueOnce(mockRecipes);

        const response = await request(app)
          .get("/food/recipes")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2);
      });

      it("should return 500 when database error occurs", async () => {
        mockGetUserRecipes.mockRejectedValueOnce(new Error("Database error"));

        const response = await request(app)
          .get("/food/recipes")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(500);
      });
    });

    describe("GET /food/recipes/:id", () => {
      it("should return 200 with recipe when found", async () => {
        mockGetRecipe.mockResolvedValueOnce(createMockRecipe());

        const response = await request(app)
          .get("/food/recipes/recipe-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.recipeId).toBe("recipe-123");
      });

      it("should return 404 when recipe not found", async () => {
        mockGetRecipe.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/food/recipes/nonexistent")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
      });
    });

    describe("POST /food/recipes", () => {
      it("should return 201 when recipe created", async () => {
        const newRecipe = createMockRecipe();
        mockCreateRecipe.mockResolvedValueOnce(newRecipe);

        const response = await request(app)
          .post("/food/recipes")
          .set("Authorization", "Bearer test-token")
          .send({
            name: "Test Recipe",
            ingredients: [{ name: "Flour", quantity: 2, unit: "cups" }],
            instructions: ["Mix", "Bake"],
            prepTime: 15,
            cookTime: 30,
            servings: 4,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it("should return 400 when required fields missing", async () => {
        const response = await request(app)
          .post("/food/recipes")
          .set("Authorization", "Bearer test-token")
          .send({ name: "Test Recipe" });

        expect(response.status).toBe(400);
      });
    });

    describe("PATCH /food/recipes/:id", () => {
      it("should return 200 when recipe updated", async () => {
        const updatedRecipe = createMockRecipe({ name: "Updated Recipe" });
        mockUpdateRecipe.mockResolvedValueOnce(updatedRecipe);

        const response = await request(app)
          .patch("/food/recipes/recipe-123")
          .set("Authorization", "Bearer test-token")
          .send({ name: "Updated Recipe" });

        expect(response.status).toBe(200);
      });

      it("should return 404 when recipe not found", async () => {
        mockUpdateRecipe.mockResolvedValueOnce(null);

        const response = await request(app)
          .patch("/food/recipes/nonexistent")
          .set("Authorization", "Bearer test-token")
          .send({ name: "Updated" });

        expect(response.status).toBe(404);
      });
    });

    describe("DELETE /food/recipes/:id", () => {
      it("should return 200 when recipe deleted", async () => {
        mockDeleteRecipe.mockResolvedValueOnce(undefined);

        const response = await request(app)
          .delete("/food/recipes/recipe-123")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.message).toContain("deleted");
      });
    });
  });

  // ==========================================
  // MEAL PLANS
  // ==========================================
  describe("Meal Plans", () => {
    describe("GET /food/meal-plans", () => {
      it("should return 200 with meal plans list", async () => {
        const mockPlans = [createMockMealPlan()];
        mockGetUserMealPlans.mockResolvedValueOnce(mockPlans);

        const response = await request(app)
          .get("/food/meal-plans")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe("POST /food/meal-plans", () => {
      it("should return 201 when meal plan created", async () => {
        mockCreateMealPlan.mockResolvedValueOnce(createMockMealPlan());

        const response = await request(app)
          .post("/food/meal-plans")
          .set("Authorization", "Bearer test-token")
          .send({
            weekStartDate: "2026-02-09",
            meals: [{ day: "monday", mealType: "dinner", recipeName: "Test" }],
          });

        expect(response.status).toBe(201);
      });
    });

    describe("POST /food/meal-plans/:id/grocery-list", () => {
      it("should return 201 when grocery list generated", async () => {
        mockGenerateGroceryListFromMealPlan.mockResolvedValueOnce(createMockGroceryList());

        const response = await request(app)
          .post("/food/meal-plans/plan-123/grocery-list")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(201);
      });

      it("should return 404 when meal plan not found", async () => {
        mockGenerateGroceryListFromMealPlan.mockRejectedValueOnce(new Error("Meal plan not found"));

        const response = await request(app)
          .post("/food/meal-plans/nonexistent/grocery-list")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(404);
      });
    });
  });

  // ==========================================
  // GROCERY LISTS
  // ==========================================
  describe("Grocery Lists", () => {
    describe("GET /food/grocery-lists", () => {
      it("should return 200 with grocery lists", async () => {
        mockGetUserGroceryLists.mockResolvedValueOnce([createMockGroceryList()]);

        const response = await request(app)
          .get("/food/grocery-lists")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
      });
    });

    describe("POST /food/grocery-lists", () => {
      it("should return 201 when grocery list created", async () => {
        mockCreateGroceryList.mockResolvedValueOnce(createMockGroceryList());

        const response = await request(app)
          .post("/food/grocery-lists")
          .set("Authorization", "Bearer test-token")
          .send({ name: "Weekly Groceries" });

        expect(response.status).toBe(201);
      });
    });
  });

  // ==========================================
  // FOOD ORDERS
  // ==========================================
  describe("Food Orders", () => {
    describe("GET /food/orders", () => {
      it("should return 200 with orders list", async () => {
        mockGetUserFoodOrders.mockResolvedValueOnce([]);

        const response = await request(app)
          .get("/food/orders")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
      });
    });

    describe("POST /food/orders", () => {
      it("should return 201 when order created", async () => {
        mockCreateFoodOrder.mockResolvedValueOnce({ orderId: "order-123", status: "pending" });

        const response = await request(app)
          .post("/food/orders")
          .set("Authorization", "Bearer test-token")
          .send({
            service: "deliveroo",
            orderType: "delivery",
            items: [{ name: "Pizza", quantity: 1, price: 15 }],
            subtotal: 15,
            deliveryFee: 3,
            serviceFee: 1,
            total: 19,
            deliveryAddress: "123 Test St",
          });

        expect(response.status).toBe(201);
      });
    });
  });

  // ==========================================
  // DIETARY PREFERENCES
  // ==========================================
  describe("Dietary Preferences", () => {
    describe("GET /food/preferences", () => {
      it("should return 200 with preferences", async () => {
        mockGetDietaryPreferences.mockResolvedValueOnce({
          restrictions: ["vegetarian"],
          allergies: ["nuts"],
        });

        const response = await request(app)
          .get("/food/preferences")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.restrictions).toContain("vegetarian");
      });

      it("should return default preferences when none exist", async () => {
        mockGetDietaryPreferences.mockResolvedValueOnce(null);

        const response = await request(app)
          .get("/food/preferences")
          .set("Authorization", "Bearer test-token");

        expect(response.status).toBe(200);
        expect(response.body.data.restrictions).toEqual([]);
      });
    });

    describe("PUT /food/preferences", () => {
      it("should return 200 when preferences saved", async () => {
        mockSaveDietaryPreferences.mockResolvedValueOnce({ restrictions: ["vegan"] });

        const response = await request(app)
          .put("/food/preferences")
          .set("Authorization", "Bearer test-token")
          .send({ restrictions: ["vegan"] });

        expect(response.status).toBe(200);
      });
    });
  });
});
