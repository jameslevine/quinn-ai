import { Router, Request, Response } from "express";
import Joi from "joi";
import { cognitoAuthMiddleware } from "../middleware/cognito-auth";
import { validateBody, validateParams } from "../middleware/validation";
import {
  createRecipe,
  getRecipe,
  getUserRecipes,
  updateRecipe,
  deleteRecipe,
  createMealPlan,
  getMealPlan,
  getUserMealPlans,
  updateMealPlan,
  deleteMealPlan,
  createGroceryList,
  getGroceryList,
  getUserGroceryLists,
  updateGroceryList,
  deleteGroceryList,
  createFoodOrder,
  getFoodOrder,
  getUserFoodOrders,
  updateFoodOrder,
  getDietaryPreferences,
  saveDietaryPreferences,
  generateGroceryListFromMealPlan,
} from "../adapters/food";

export const router: Router = Router();

// Validation schemas
const ingredientSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().required(),
  unit: Joi.string().required(),
  category: Joi.string().optional(),
});

const recipeSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  ingredients: Joi.array().items(ingredientSchema).required(),
  instructions: Joi.array().items(Joi.string()).required(),
  prepTime: Joi.number().required(),
  cookTime: Joi.number().required(),
  servings: Joi.number().required(),
  cuisine: Joi.string().optional(),
  dietaryTags: Joi.array().items(Joi.string()).default([]),
  calories: Joi.number().optional(),
  imageUrl: Joi.string().uri().optional(),
  source: Joi.string().optional(),
  isFavorite: Joi.boolean().default(false),
  rating: Joi.number().min(1).max(5).optional(),
});

const mealSlotSchema = Joi.object({
  day: Joi.string()
    .valid("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")
    .required(),
  mealType: Joi.string().valid("breakfast", "lunch", "dinner", "snack").required(),
  recipeId: Joi.string().optional(),
  recipeName: Joi.string().optional(),
  notes: Joi.string().optional(),
});

const mealPlanSchema = Joi.object({
  weekStartDate: Joi.string().isoDate().required(),
  meals: Joi.array().items(mealSlotSchema).required(),
  status: Joi.string().valid("draft", "active", "completed").default("draft"),
});

const groceryItemSchema = Joi.object({
  itemId: Joi.string().required(),
  name: Joi.string().required(),
  quantity: Joi.number().required(),
  unit: Joi.string().required(),
  category: Joi.string().required(),
  checked: Joi.boolean().default(false),
  price: Joi.number().optional(),
  notes: Joi.string().optional(),
});

const groceryListSchema = Joi.object({
  name: Joi.string().required(),
  mealPlanId: Joi.string().optional(),
  items: Joi.array().items(groceryItemSchema).default([]),
  status: Joi.string().valid("draft", "ready", "ordered", "delivered").default("draft"),
  store: Joi.string().optional(),
  estimatedTotal: Joi.number().optional(),
  deliveryDate: Joi.string().isoDate().optional(),
});

const orderItemSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().required(),
  price: Joi.number().required(),
  notes: Joi.string().optional(),
});

const foodOrderSchema = Joi.object({
  service: Joi.string()
    .valid("deliveroo", "uber_eats", "just_eat", "ocado", "tesco", "amazon_fresh")
    .required(),
  orderType: Joi.string().valid("delivery", "grocery").required(),
  items: Joi.array().items(orderItemSchema).required(),
  restaurant: Joi.string().optional(),
  store: Joi.string().optional(),
  subtotal: Joi.number().required(),
  deliveryFee: Joi.number().required(),
  serviceFee: Joi.number().required(),
  total: Joi.number().required(),
  deliveryAddress: Joi.string().required(),
  deliveryTime: Joi.string().optional(),
});

const dietaryPreferencesSchema = Joi.object({
  restrictions: Joi.array().items(Joi.string()).default([]),
  allergies: Joi.array().items(Joi.string()).default([]),
  dislikes: Joi.array().items(Joi.string()).default([]),
  cuisinePreferences: Joi.array().items(Joi.string()).default([]),
  calorieTarget: Joi.number().optional(),
  mealBudget: Joi.number().optional(),
  weeklyBudget: Joi.number().optional(),
  servingsDefault: Joi.number().default(2),
});

const idParamSchema = Joi.object({
  id: Joi.string().required(),
});

// ============ RECIPES ============

// Get all recipes
router.get("/recipes", cognitoAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recipes = await getUserRecipes(userId);
    res.json({ success: true, data: recipes });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res
      .status(500)
      .json({ success: false, error: { code: "FETCH_ERROR", message: "Failed to fetch recipes" } });
  }
});

// Get single recipe
router.get(
  "/recipes/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const recipe = await getRecipe(userId, req.params.id!);
      if (!recipe) {
        return res
          .status(404)
          .json({ success: false, error: { code: "NOT_FOUND", message: "Recipe not found" } });
      }

      res.json({ success: true, data: recipe });
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({
        success: false,
        error: { code: "FETCH_ERROR", message: "Failed to fetch recipe" },
      });
    }
  }
);

// Create recipe
router.post(
  "/recipes",
  cognitoAuthMiddleware,
  validateBody(recipeSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const recipe = await createRecipe(userId, req.body);
      res.status(201).json({ success: true, data: recipe });
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({
        success: false,
        error: { code: "CREATE_ERROR", message: "Failed to create recipe" },
      });
    }
  }
);

// Update recipe
router.patch(
  "/recipes/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const recipe = await updateRecipe(userId, req.params.id!, req.body);
      if (!recipe) {
        return res
          .status(404)
          .json({ success: false, error: { code: "NOT_FOUND", message: "Recipe not found" } });
      }

      res.json({ success: true, data: recipe });
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({
        success: false,
        error: { code: "UPDATE_ERROR", message: "Failed to update recipe" },
      });
    }
  }
);

// Delete recipe
router.delete(
  "/recipes/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await deleteRecipe(userId, req.params.id!);
      res.json({ success: true, message: "Recipe deleted" });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({
        success: false,
        error: { code: "DELETE_ERROR", message: "Failed to delete recipe" },
      });
    }
  }
);

// ============ MEAL PLANS ============

// Get all meal plans
router.get("/meal-plans", cognitoAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const mealPlans = await getUserMealPlans(userId);
    res.json({ success: true, data: mealPlans });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    res.status(500).json({
      success: false,
      error: { code: "FETCH_ERROR", message: "Failed to fetch meal plans" },
    });
  }
});

// Get single meal plan
router.get(
  "/meal-plans/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const mealPlan = await getMealPlan(userId, req.params.id!);
      if (!mealPlan) {
        return res
          .status(404)
          .json({ success: false, error: { code: "NOT_FOUND", message: "Meal plan not found" } });
      }

      res.json({ success: true, data: mealPlan });
    } catch (error) {
      console.error("Error fetching meal plan:", error);
      res.status(500).json({
        success: false,
        error: { code: "FETCH_ERROR", message: "Failed to fetch meal plan" },
      });
    }
  }
);

// Create meal plan
router.post(
  "/meal-plans",
  cognitoAuthMiddleware,
  validateBody(mealPlanSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const mealPlan = await createMealPlan(userId, req.body);
      res.status(201).json({ success: true, data: mealPlan });
    } catch (error) {
      console.error("Error creating meal plan:", error);
      res.status(500).json({
        success: false,
        error: { code: "CREATE_ERROR", message: "Failed to create meal plan" },
      });
    }
  }
);

// Update meal plan
router.patch(
  "/meal-plans/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const mealPlan = await updateMealPlan(userId, req.params.id!, req.body);
      if (!mealPlan) {
        return res
          .status(404)
          .json({ success: false, error: { code: "NOT_FOUND", message: "Meal plan not found" } });
      }

      res.json({ success: true, data: mealPlan });
    } catch (error) {
      console.error("Error updating meal plan:", error);
      res.status(500).json({
        success: false,
        error: { code: "UPDATE_ERROR", message: "Failed to update meal plan" },
      });
    }
  }
);

// Delete meal plan
router.delete(
  "/meal-plans/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await deleteMealPlan(userId, req.params.id!);
      res.json({ success: true, message: "Meal plan deleted" });
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      res.status(500).json({
        success: false,
        error: { code: "DELETE_ERROR", message: "Failed to delete meal plan" },
      });
    }
  }
);

// Generate grocery list from meal plan
router.post(
  "/meal-plans/:id/grocery-list",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const groceryList = await generateGroceryListFromMealPlan(userId, req.params.id!);
      res.status(201).json({ success: true, data: groceryList });
    } catch (error: any) {
      console.error("Error generating grocery list:", error);
      if (error.message === "Meal plan not found") {
        return res
          .status(404)
          .json({ success: false, error: { code: "NOT_FOUND", message: "Meal plan not found" } });
      }
      res.status(500).json({
        success: false,
        error: { code: "CREATE_ERROR", message: "Failed to generate grocery list" },
      });
    }
  }
);

// ============ GROCERY LISTS ============

// Get all grocery lists
router.get("/grocery-lists", cognitoAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const groceryLists = await getUserGroceryLists(userId);
    res.json({ success: true, data: groceryLists });
  } catch (error) {
    console.error("Error fetching grocery lists:", error);
    res.status(500).json({
      success: false,
      error: { code: "FETCH_ERROR", message: "Failed to fetch grocery lists" },
    });
  }
});

// Get single grocery list
router.get(
  "/grocery-lists/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const groceryList = await getGroceryList(userId, req.params.id!);
      if (!groceryList) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Grocery list not found" },
        });
      }

      res.json({ success: true, data: groceryList });
    } catch (error) {
      console.error("Error fetching grocery list:", error);
      res.status(500).json({
        success: false,
        error: { code: "FETCH_ERROR", message: "Failed to fetch grocery list" },
      });
    }
  }
);

// Create grocery list
router.post(
  "/grocery-lists",
  cognitoAuthMiddleware,
  validateBody(groceryListSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const groceryList = await createGroceryList(userId, req.body);
      res.status(201).json({ success: true, data: groceryList });
    } catch (error) {
      console.error("Error creating grocery list:", error);
      res.status(500).json({
        success: false,
        error: { code: "CREATE_ERROR", message: "Failed to create grocery list" },
      });
    }
  }
);

// Update grocery list
router.patch(
  "/grocery-lists/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const groceryList = await updateGroceryList(userId, req.params.id!, req.body);
      if (!groceryList) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Grocery list not found" },
        });
      }

      res.json({ success: true, data: groceryList });
    } catch (error) {
      console.error("Error updating grocery list:", error);
      res.status(500).json({
        success: false,
        error: { code: "UPDATE_ERROR", message: "Failed to update grocery list" },
      });
    }
  }
);

// Delete grocery list
router.delete(
  "/grocery-lists/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await deleteGroceryList(userId, req.params.id!);
      res.json({ success: true, message: "Grocery list deleted" });
    } catch (error) {
      console.error("Error deleting grocery list:", error);
      res.status(500).json({
        success: false,
        error: { code: "DELETE_ERROR", message: "Failed to delete grocery list" },
      });
    }
  }
);

// ============ FOOD ORDERS ============

// Get all food orders
router.get("/orders", cognitoAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const orders = await getUserFoodOrders(userId, limit);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching food orders:", error);
    res.status(500).json({
      success: false,
      error: { code: "FETCH_ERROR", message: "Failed to fetch food orders" },
    });
  }
});

// Get single food order
router.get(
  "/orders/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const order = await getFoodOrder(userId, req.params.id!);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error fetching food order:", error);
      res.status(500).json({
        success: false,
        error: { code: "FETCH_ERROR", message: "Failed to fetch food order" },
      });
    }
  }
);

// Create food order (simulated - in production would integrate with actual services)
router.post(
  "/orders",
  cognitoAuthMiddleware,
  validateBody(foodOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // In production, this would integrate with Deliveroo, Uber Eats, etc.
      // For now, we just create a pending order
      const order = await createFoodOrder(userId, {
        ...req.body,
        status: "pending",
      });

      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error("Error creating food order:", error);
      res.status(500).json({
        success: false,
        error: { code: "CREATE_ERROR", message: "Failed to create food order" },
      });
    }
  }
);

// Update food order status
router.patch(
  "/orders/:id",
  cognitoAuthMiddleware,
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const order = await updateFoodOrder(userId, req.params.id!, req.body);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: { code: "NOT_FOUND", message: "Order not found" } });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error updating food order:", error);
      res.status(500).json({
        success: false,
        error: { code: "UPDATE_ERROR", message: "Failed to update food order" },
      });
    }
  }
);

// ============ DIETARY PREFERENCES ============

// Get dietary preferences
router.get("/preferences", cognitoAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const preferences = await getDietaryPreferences(userId);
    res.json({
      success: true,
      data: preferences || {
        restrictions: [],
        allergies: [],
        dislikes: [],
        cuisinePreferences: [],
        servingsDefault: 2,
      },
    });
  } catch (error) {
    console.error("Error fetching dietary preferences:", error);
    res.status(500).json({
      success: false,
      error: { code: "FETCH_ERROR", message: "Failed to fetch dietary preferences" },
    });
  }
});

// Save dietary preferences
router.put(
  "/preferences",
  cognitoAuthMiddleware,
  validateBody(dietaryPreferencesSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const preferences = await saveDietaryPreferences(userId, req.body);
      res.json({ success: true, data: preferences });
    } catch (error) {
      console.error("Error saving dietary preferences:", error);
      res.status(500).json({
        success: false,
        error: { code: "SAVE_ERROR", message: "Failed to save dietary preferences" },
      });
    }
  }
);

export default router;
