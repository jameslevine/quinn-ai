import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "./dynamodb";
import { v4 as uuidv4 } from "uuid";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "quinn-main-dev";

// Types
export interface Recipe {
  recipeId: string;
  userId: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  cuisine?: string;
  dietaryTags: string[]; // vegetarian, vegan, gluten-free, etc.
  calories?: number;
  imageUrl?: string;
  source?: string; // url or "user"
  isFavorite: boolean;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category?: string; // produce, dairy, meat, etc.
}

export interface MealPlan {
  mealPlanId: string;
  userId: string;
  weekStartDate: string; // ISO date string (Monday)
  meals: MealSlot[];
  status: "draft" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface MealSlot {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  recipeId?: string;
  recipeName?: string;
  notes?: string;
}

export interface GroceryList {
  groceryListId: string;
  userId: string;
  name: string;
  mealPlanId?: string;
  items: GroceryItem[];
  status: "draft" | "ready" | "ordered" | "delivered";
  store?: string;
  estimatedTotal?: number;
  orderId?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroceryItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  price?: number;
  notes?: string;
}

export interface FoodOrder {
  orderId: string;
  userId: string;
  service: "deliveroo" | "uber_eats" | "just_eat" | "ocado" | "tesco" | "amazon_fresh";
  orderType: "delivery" | "grocery";
  status: "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";
  items: OrderItem[];
  restaurant?: string;
  store?: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  deliveryAddress: string;
  deliveryTime?: string;
  externalOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface DietaryPreferences {
  userId: string;
  restrictions: string[]; // vegetarian, vegan, gluten-free, dairy-free, nut-free, etc.
  allergies: string[];
  dislikes: string[];
  cuisinePreferences: string[];
  calorieTarget?: number;
  mealBudget?: number; // per meal
  weeklyBudget?: number;
  servingsDefault: number;
  updatedAt: string;
}

// Key helpers
const createPK = (userId: string) => `USER#${userId}`;
const createRecipeSK = (recipeId: string) => `RECIPE#${recipeId}`;
const createMealPlanSK = (mealPlanId: string) => `MEALPLAN#${mealPlanId}`;
const createGroceryListSK = (groceryListId: string) => `GROCERYLIST#${groceryListId}`;
const createFoodOrderSK = (orderId: string) => `FOODORDER#${orderId}`;
const createDietaryPrefsSK = () => `DIETARYPREFS`;

// Recipe operations
export const createRecipe = async (
  userId: string,
  recipe: Omit<Recipe, "recipeId" | "userId" | "createdAt" | "updatedAt">
): Promise<Recipe> => {
  const now = new Date().toISOString();
  const recipeId = uuidv4();

  const newRecipe: Recipe = {
    ...recipe,
    recipeId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: createPK(userId),
        sk: createRecipeSK(recipeId),
        gsi1pk: `RECIPES`,
        gsi1sk: `USER#${userId}#${now}`,
        ...newRecipe,
      },
    })
  );

  return newRecipe;
};

export const getRecipe = async (userId: string, recipeId: string): Promise<Recipe | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createRecipeSK(recipeId),
      },
    })
  );

  return result.Item as Recipe | null;
};

export const getUserRecipes = async (userId: string): Promise<Recipe[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": createPK(userId),
        ":sk": "RECIPE#",
      },
    })
  );

  return (result.Items || []) as Recipe[];
};

export const updateRecipe = async (
  userId: string,
  recipeId: string,
  updates: Partial<Recipe>
): Promise<Recipe | null> => {
  const now = new Date().toISOString();

  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionAttributeValues: Record<string, any> = { ":updatedAt": now };
  const expressionAttributeNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "recipeId" && key !== "userId" && key !== "createdAt") {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
      updateExpressions.push(`${attrName} = ${attrValue}`);
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createRecipeSK(recipeId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as Recipe | null;
};

export const deleteRecipe = async (userId: string, recipeId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createRecipeSK(recipeId),
      },
    })
  );
};

// Meal Plan operations
export const createMealPlan = async (
  userId: string,
  mealPlan: Omit<MealPlan, "mealPlanId" | "userId" | "createdAt" | "updatedAt">
): Promise<MealPlan> => {
  const now = new Date().toISOString();
  const mealPlanId = uuidv4();

  const newMealPlan: MealPlan = {
    ...mealPlan,
    mealPlanId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: createPK(userId),
        sk: createMealPlanSK(mealPlanId),
        gsi1pk: `MEALPLANS`,
        gsi1sk: `USER#${userId}#${mealPlan.weekStartDate}`,
        ...newMealPlan,
      },
    })
  );

  return newMealPlan;
};

export const getMealPlan = async (userId: string, mealPlanId: string): Promise<MealPlan | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createMealPlanSK(mealPlanId),
      },
    })
  );

  return result.Item as MealPlan | null;
};

export const getUserMealPlans = async (userId: string): Promise<MealPlan[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": createPK(userId),
        ":sk": "MEALPLAN#",
      },
      ScanIndexForward: false,
    })
  );

  return (result.Items || []) as MealPlan[];
};

export const updateMealPlan = async (
  userId: string,
  mealPlanId: string,
  updates: Partial<MealPlan>
): Promise<MealPlan | null> => {
  const now = new Date().toISOString();

  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionAttributeValues: Record<string, any> = { ":updatedAt": now };
  const expressionAttributeNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "mealPlanId" && key !== "userId" && key !== "createdAt") {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
      updateExpressions.push(`${attrName} = ${attrValue}`);
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createMealPlanSK(mealPlanId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as MealPlan | null;
};

export const deleteMealPlan = async (userId: string, mealPlanId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createMealPlanSK(mealPlanId),
      },
    })
  );
};

// Grocery List operations
export const createGroceryList = async (
  userId: string,
  groceryList: Omit<GroceryList, "groceryListId" | "userId" | "createdAt" | "updatedAt">
): Promise<GroceryList> => {
  const now = new Date().toISOString();
  const groceryListId = uuidv4();

  const newGroceryList: GroceryList = {
    ...groceryList,
    groceryListId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: createPK(userId),
        sk: createGroceryListSK(groceryListId),
        gsi1pk: `GROCERYLISTS`,
        gsi1sk: `USER#${userId}#${now}`,
        ...newGroceryList,
      },
    })
  );

  return newGroceryList;
};

export const getGroceryList = async (
  userId: string,
  groceryListId: string
): Promise<GroceryList | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createGroceryListSK(groceryListId),
      },
    })
  );

  return result.Item as GroceryList | null;
};

export const getUserGroceryLists = async (userId: string): Promise<GroceryList[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": createPK(userId),
        ":sk": "GROCERYLIST#",
      },
      ScanIndexForward: false,
    })
  );

  return (result.Items || []) as GroceryList[];
};

export const updateGroceryList = async (
  userId: string,
  groceryListId: string,
  updates: Partial<GroceryList>
): Promise<GroceryList | null> => {
  const now = new Date().toISOString();

  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionAttributeValues: Record<string, any> = { ":updatedAt": now };
  const expressionAttributeNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "groceryListId" && key !== "userId" && key !== "createdAt") {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
      updateExpressions.push(`${attrName} = ${attrValue}`);
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createGroceryListSK(groceryListId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as GroceryList | null;
};

export const deleteGroceryList = async (userId: string, groceryListId: string): Promise<void> => {
  await dynamodb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createGroceryListSK(groceryListId),
      },
    })
  );
};

// Food Order operations
export const createFoodOrder = async (
  userId: string,
  order: Omit<FoodOrder, "orderId" | "userId" | "createdAt" | "updatedAt">
): Promise<FoodOrder> => {
  const now = new Date().toISOString();
  const orderId = uuidv4();

  const newOrder: FoodOrder = {
    ...order,
    orderId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: createPK(userId),
        sk: createFoodOrderSK(orderId),
        gsi1pk: `FOODORDERS`,
        gsi1sk: `USER#${userId}#${now}`,
        ...newOrder,
      },
    })
  );

  return newOrder;
};

export const getFoodOrder = async (userId: string, orderId: string): Promise<FoodOrder | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createFoodOrderSK(orderId),
      },
    })
  );

  return result.Item as FoodOrder | null;
};

export const getUserFoodOrders = async (
  userId: string,
  limit: number = 20
): Promise<FoodOrder[]> => {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": createPK(userId),
        ":sk": "FOODORDER#",
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return (result.Items || []) as FoodOrder[];
};

export const updateFoodOrder = async (
  userId: string,
  orderId: string,
  updates: Partial<FoodOrder>
): Promise<FoodOrder | null> => {
  const now = new Date().toISOString();

  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionAttributeValues: Record<string, any> = { ":updatedAt": now };
  const expressionAttributeNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "orderId" && key !== "userId" && key !== "createdAt") {
      const attrName = `#${key}`;
      const attrValue = `:${key}`;
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
      updateExpressions.push(`${attrName} = ${attrValue}`);
    }
  });

  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createFoodOrderSK(orderId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes as FoodOrder | null;
};

// Dietary Preferences operations
export const getDietaryPreferences = async (userId: string): Promise<DietaryPreferences | null> => {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: createPK(userId),
        sk: createDietaryPrefsSK(),
      },
    })
  );

  return result.Item as DietaryPreferences | null;
};

export const saveDietaryPreferences = async (
  userId: string,
  prefs: Omit<DietaryPreferences, "userId" | "updatedAt">
): Promise<DietaryPreferences> => {
  const now = new Date().toISOString();

  const dietaryPrefs: DietaryPreferences = {
    ...prefs,
    userId,
    updatedAt: now,
  };

  await dynamodb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: createPK(userId),
        sk: createDietaryPrefsSK(),
        ...dietaryPrefs,
      },
    })
  );

  return dietaryPrefs;
};

// Helper function to generate grocery list from meal plan
export const generateGroceryListFromMealPlan = async (
  userId: string,
  mealPlanId: string
): Promise<GroceryList> => {
  const mealPlan = await getMealPlan(userId, mealPlanId);
  if (!mealPlan) {
    throw new Error("Meal plan not found");
  }

  // Get all recipes from the meal plan
  const recipeIds = mealPlan.meals.filter((meal) => meal.recipeId).map((meal) => meal.recipeId!);

  const uniqueRecipeIds = [...new Set(recipeIds)];

  // Fetch all recipes
  const recipes = await Promise.all(uniqueRecipeIds.map((id) => getRecipe(userId, id)));

  // Aggregate ingredients
  const ingredientMap = new Map<string, GroceryItem>();

  recipes.forEach((recipe) => {
    if (!recipe) return;

    recipe.ingredients.forEach((ing) => {
      const key = `${ing.name.toLowerCase()}-${ing.unit}`;
      const existing = ingredientMap.get(key);

      if (existing) {
        existing.quantity += ing.quantity;
      } else {
        ingredientMap.set(key, {
          itemId: uuidv4(),
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category || "Other",
          checked: false,
        });
      }
    });
  });

  // Create grocery list
  const groceryList = await createGroceryList(userId, {
    name: `Groceries for week of ${mealPlan.weekStartDate}`,
    mealPlanId,
    items: Array.from(ingredientMap.values()),
    status: "draft",
  });

  return groceryList;
};
