import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/api";

// Types
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

export interface Recipe {
  recipeId: string;
  userId: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  cuisine?: string;
  dietaryTags: string[];
  calories?: number;
  imageUrl?: string;
  source?: string;
  isFavorite: boolean;
  rating?: number;
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

export interface MealPlan {
  mealPlanId: string;
  userId: string;
  weekStartDate: string;
  meals: MealSlot[];
  status: "draft" | "active" | "completed";
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

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
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

export interface DietaryPreferences {
  userId?: string;
  restrictions: string[];
  allergies: string[];
  dislikes: string[];
  cuisinePreferences: string[];
  calorieTarget?: number;
  mealBudget?: number;
  weeklyBudget?: number;
  servingsDefault: number;
  updatedAt?: string;
}

// Query keys
const RECIPES_KEY = "recipes";
const MEAL_PLANS_KEY = "mealPlans";
const GROCERY_LISTS_KEY = "groceryLists";
const FOOD_ORDERS_KEY = "foodOrders";
const DIETARY_PREFS_KEY = "dietaryPreferences";

// ============ RECIPES ============

export const useRecipes = () => {
  return useQuery({
    queryKey: [RECIPES_KEY],
    queryFn: async () => {
      const response = await apiClient.get<Recipe[]>("/food/recipes");
      return response.data || [];
    },
  });
};

export const useRecipe = (recipeId: string) => {
  return useQuery({
    queryKey: [RECIPES_KEY, recipeId],
    queryFn: async () => {
      const response = await apiClient.get<Recipe>(`/food/recipes/${recipeId}`);
      return response.data;
    },
    enabled: !!recipeId,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipe: Omit<Recipe, "recipeId" | "userId" | "createdAt" | "updatedAt">) => {
      const response = await apiClient.post<Recipe>("/food/recipes", recipe);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, updates }: { recipeId: string; updates: Partial<Recipe> }) => {
      const response = await apiClient.patch<Recipe>(`/food/recipes/${recipeId}`, updates);
      return response.data;
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY, recipeId] });
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipeId: string) => {
      await apiClient.delete(`/food/recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
};

// ============ MEAL PLANS ============

export const useMealPlans = () => {
  return useQuery({
    queryKey: [MEAL_PLANS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<MealPlan[]>("/food/meal-plans");
      return response.data || [];
    },
  });
};

export const useMealPlan = (mealPlanId: string) => {
  return useQuery({
    queryKey: [MEAL_PLANS_KEY, mealPlanId],
    queryFn: async () => {
      const response = await apiClient.get<MealPlan>(`/food/meal-plans/${mealPlanId}`);
      return response.data;
    },
    enabled: !!mealPlanId,
  });
};

export const useCreateMealPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      mealPlan: Omit<MealPlan, "mealPlanId" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const response = await apiClient.post<MealPlan>("/food/meal-plans", mealPlan);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEAL_PLANS_KEY] });
    },
  });
};

export const useUpdateMealPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mealPlanId,
      updates,
    }: {
      mealPlanId: string;
      updates: Partial<MealPlan>;
    }) => {
      const response = await apiClient.patch<MealPlan>(`/food/meal-plans/${mealPlanId}`, updates);
      return response.data;
    },
    onSuccess: (_, { mealPlanId }) => {
      queryClient.invalidateQueries({ queryKey: [MEAL_PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [MEAL_PLANS_KEY, mealPlanId] });
    },
  });
};

export const useDeleteMealPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mealPlanId: string) => {
      await apiClient.delete(`/food/meal-plans/${mealPlanId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEAL_PLANS_KEY] });
    },
  });
};

export const useGenerateGroceryList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mealPlanId: string) => {
      const response = await apiClient.post<GroceryList>(
        `/food/meal-plans/${mealPlanId}/grocery-list`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROCERY_LISTS_KEY] });
    },
  });
};

// ============ GROCERY LISTS ============

export const useGroceryLists = () => {
  return useQuery({
    queryKey: [GROCERY_LISTS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<GroceryList[]>("/food/grocery-lists");
      return response.data || [];
    },
  });
};

export const useGroceryList = (groceryListId: string) => {
  return useQuery({
    queryKey: [GROCERY_LISTS_KEY, groceryListId],
    queryFn: async () => {
      const response = await apiClient.get<GroceryList>(`/food/grocery-lists/${groceryListId}`);
      return response.data;
    },
    enabled: !!groceryListId,
  });
};

export const useCreateGroceryList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      groceryList: Omit<GroceryList, "groceryListId" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const response = await apiClient.post<GroceryList>("/food/grocery-lists", groceryList);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROCERY_LISTS_KEY] });
    },
  });
};

export const useUpdateGroceryList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groceryListId,
      updates,
    }: {
      groceryListId: string;
      updates: Partial<GroceryList>;
    }) => {
      const response = await apiClient.patch<GroceryList>(
        `/food/grocery-lists/${groceryListId}`,
        updates
      );
      return response.data;
    },
    onSuccess: (_, { groceryListId }) => {
      queryClient.invalidateQueries({ queryKey: [GROCERY_LISTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_LISTS_KEY, groceryListId] });
    },
  });
};

export const useDeleteGroceryList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groceryListId: string) => {
      await apiClient.delete(`/food/grocery-lists/${groceryListId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROCERY_LISTS_KEY] });
    },
  });
};

// ============ FOOD ORDERS ============

export const useFoodOrders = (limit?: number) => {
  return useQuery({
    queryKey: [FOOD_ORDERS_KEY, limit],
    queryFn: async () => {
      const url = limit ? `/food/orders?limit=${limit}` : "/food/orders";
      const response = await apiClient.get<FoodOrder[]>(url);
      return response.data || [];
    },
  });
};

export const useFoodOrder = (orderId: string) => {
  return useQuery({
    queryKey: [FOOD_ORDERS_KEY, orderId],
    queryFn: async () => {
      const response = await apiClient.get<FoodOrder>(`/food/orders/${orderId}`);
      return response.data;
    },
    enabled: !!orderId,
  });
};

export const useCreateFoodOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      order: Omit<FoodOrder, "orderId" | "userId" | "status" | "createdAt" | "updatedAt">
    ) => {
      const response = await apiClient.post<FoodOrder>("/food/orders", order);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOOD_ORDERS_KEY] });
    },
  });
};

export const useUpdateFoodOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: Partial<FoodOrder> }) => {
      const response = await apiClient.patch<FoodOrder>(`/food/orders/${orderId}`, updates);
      return response.data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: [FOOD_ORDERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FOOD_ORDERS_KEY, orderId] });
    },
  });
};

// ============ DIETARY PREFERENCES ============

export const useDietaryPreferences = () => {
  return useQuery({
    queryKey: [DIETARY_PREFS_KEY],
    queryFn: async () => {
      const response = await apiClient.get<DietaryPreferences>("/food/preferences");
      return (
        response.data || {
          restrictions: [],
          allergies: [],
          dislikes: [],
          cuisinePreferences: [],
          servingsDefault: 2,
        }
      );
    },
  });
};

export const useSaveDietaryPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: Omit<DietaryPreferences, "userId" | "updatedAt">) => {
      const response = await apiClient.put<DietaryPreferences>("/food/preferences", preferences);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DIETARY_PREFS_KEY] });
    },
  });
};
