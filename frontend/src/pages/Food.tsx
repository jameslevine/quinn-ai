import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Checkbox,
    CircularProgress,
    Alert,
    Stack,
} from "@mui/material";
import {
    Restaurant as RestaurantIcon,
    CalendarMonth as CalendarIcon,
    ShoppingCart as ShoppingCartIcon,
    LocalShipping as DeliveryIcon,
    Add as AddIcon,
    Favorite as FavoriteIcon,
    FavoriteBorder as FavoriteBorderIcon,
    AccessTime as TimeIcon,
    People as PeopleIcon,
} from "@mui/icons-material";
import {
    useRecipes,
    useMealPlans,
    useGroceryLists,
    useFoodOrders,
    useCreateRecipe,
    useDeleteRecipe,
    useUpdateRecipe,
    useUpdateGroceryList,
    useCreateMealPlan,
    useCreateGroceryList,
    useGenerateGroceryList,
} from "../hooks/useFood";
import type { Recipe, GroceryList, MealPlan } from "../hooks/useFood";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const Food = () => {
    const [tabValue, setTabValue] = useState(0);
    const [addRecipeOpen, setAddRecipeOpen] = useState(false);
    const [addMealPlanOpen, setAddMealPlanOpen] = useState(false);
    const [addGroceryListOpen, setAddGroceryListOpen] = useState(false);
    const [newMealPlanDate, setNewMealPlanDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [newGroceryListName, setNewGroceryListName] = useState("");
    const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
    const [selectedGroceryList, setSelectedGroceryList] = useState<GroceryList | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [newRecipe, setNewRecipe] = useState({
        name: "",
        description: "",
        prepTime: 15,
        cookTime: 30,
        servings: 2,
        cuisine: "",
        ingredients: [] as { name: string; quantity: number; unit: string }[],
        instructions: [] as string[],
        dietaryTags: [] as string[],
        isFavorite: false,
    });

    const { data: recipes, isLoading: recipesLoading } = useRecipes();
    const { data: mealPlans, isLoading: mealPlansLoading } = useMealPlans();
    const { data: groceryLists, isLoading: groceryListsLoading } = useGroceryLists();
    const { data: orders, isLoading: ordersLoading } = useFoodOrders(10);

    const createRecipe = useCreateRecipe();
    const deleteRecipe = useDeleteRecipe();
    const updateRecipe = useUpdateRecipe();
    const updateGroceryList = useUpdateGroceryList();
    const createMealPlan = useCreateMealPlan();
    const createGroceryList = useCreateGroceryList();
    const generateGroceryList = useGenerateGroceryList();

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleToggleFavorite = (recipe: Recipe) => {
        updateRecipe.mutate({
            recipeId: recipe.recipeId,
            updates: { isFavorite: !recipe.isFavorite },
        });
    };

    const handleToggleGroceryItem = (groceryList: GroceryList, itemId: string) => {
        const updatedItems = groceryList.items.map((item) =>
            item.itemId === itemId ? { ...item, checked: !item.checked } : item
        );
        updateGroceryList.mutate({
            groceryListId: groceryList.groceryListId,
            updates: { items: updatedItems },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "delivered":
                return "success";
            case "delivering":
            case "preparing":
                return "warning";
            case "pending":
            case "confirmed":
                return "info";
            case "cancelled":
                return "error";
            default:
                return "default";
        }
    };

    const getServiceName = (service: string) => {
        const names: Record<string, string> = {
            deliveroo: "Deliveroo",
            uber_eats: "Uber Eats",
            just_eat: "Just Eat",
            ocado: "Ocado",
            tesco: "Tesco",
            amazon_fresh: "Amazon Fresh",
        };
        return names[service] || service;
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Food & Meals
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Plan meals, manage recipes, and order groceries
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <RestaurantIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">{recipes?.length || 0}</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Saved Recipes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <CalendarIcon color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    {mealPlans?.filter((p) => p.status === "active").length || 0}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Active Meal Plans
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <ShoppingCartIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    {groceryLists?.filter((l) => l.status === "draft" || l.status === "ready").length || 0}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Pending Lists
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <DeliveryIcon color="warning" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    {orders?.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length || 0}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Active Orders
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                    <Tab label="Recipes" icon={<RestaurantIcon />} iconPosition="start" />
                    <Tab label="Meal Plans" icon={<CalendarIcon />} iconPosition="start" />
                    <Tab label="Grocery Lists" icon={<ShoppingCartIcon />} iconPosition="start" />
                    <Tab label="Orders" icon={<DeliveryIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Recipes Tab */}
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Your Recipes</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddRecipeOpen(true)}>
                        Add Recipe
                    </Button>
                </Box>

                {recipesLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : recipes && recipes.length > 0 ? (
                    <Grid container spacing={3}>
                        {recipes.map((recipe) => (
                            <Grid item xs={12} sm={6} md={4} key={recipe.recipeId}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <Typography variant="h6" gutterBottom>
                                                {recipe.name}
                                            </Typography>
                                            <IconButton size="small" onClick={() => handleToggleFavorite(recipe)}>
                                                {recipe.isFavorite ? (
                                                    <FavoriteIcon color="error" />
                                                ) : (
                                                    <FavoriteBorderIcon />
                                                )}
                                            </IconButton>
                                        </Box>
                                        {recipe.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {recipe.description}
                                            </Typography>
                                        )}
                                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                <Typography variant="body2">
                                                    {recipe.prepTime + recipe.cookTime} min
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                <Typography variant="body2">{recipe.servings} servings</Typography>
                                            </Box>
                                        </Stack>
                                        {recipe.dietaryTags.length > 0 && (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {recipe.dietaryTags.map((tag) => (
                                                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => setSelectedRecipe(recipe)}>View</Button>
                                        <Button size="small" color="error" onClick={() => deleteRecipe.mutate(recipe.recipeId)}>
                                            Delete
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">
                        No recipes yet. Add your first recipe to get started with meal planning!
                    </Alert>
                )}
            </TabPanel>

            {/* Meal Plans Tab */}
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Meal Plans</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddMealPlanOpen(true)}>
                        Create Plan
                    </Button>
                </Box>

                {mealPlansLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : mealPlans && mealPlans.length > 0 ? (
                    <Grid container spacing={3}>
                        {mealPlans.map((plan) => (
                            <Grid item xs={12} md={6} key={plan.mealPlanId}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                            <Typography variant="h6">Week of {plan.weekStartDate}</Typography>
                                            <Chip
                                                label={plan.status}
                                                color={plan.status === "active" ? "success" : plan.status === "completed" ? "default" : "warning"}
                                                size="small"
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {plan.meals.filter((m) => m.recipeId).length} meals planned
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => setSelectedMealPlan(plan)}>View Plan</Button>
                                        <Button
                                            size="small"
                                            onClick={() => generateGroceryList.mutate(plan.mealPlanId)}
                                            disabled={generateGroceryList.isPending}
                                        >
                                            {generateGroceryList.isPending ? "Generating..." : "Generate Grocery List"}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">
                        No meal plans yet. Create a weekly meal plan to organize your cooking!
                    </Alert>
                )}
            </TabPanel>

            {/* Grocery Lists Tab */}
            <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Grocery Lists</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddGroceryListOpen(true)}>
                        New List
                    </Button>
                </Box>

                {groceryListsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : groceryLists && groceryLists.length > 0 ? (
                    <Grid container spacing={3}>
                        {groceryLists.map((list) => (
                            <Grid item xs={12} md={6} key={list.groceryListId}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                            <Typography variant="h6">{list.name}</Typography>
                                            <Chip
                                                label={list.status}
                                                color={getStatusColor(list.status) as "success" | "warning" | "info" | "error" | "default"}
                                                size="small"
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {list.items.filter((i) => i.checked).length} / {list.items.length} items checked
                                        </Typography>
                                        <List dense>
                                            {list.items.slice(0, 5).map((item) => (
                                                <ListItem key={item.itemId} disablePadding>
                                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                                        <Checkbox
                                                            edge="start"
                                                            checked={item.checked}
                                                            onChange={() => handleToggleGroceryItem(list, item.itemId)}
                                                            size="small"
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={item.name}
                                                        secondary={`${item.quantity} ${item.unit}`}
                                                        sx={{ textDecoration: item.checked ? "line-through" : "none" }}
                                                    />
                                                </ListItem>
                                            ))}
                                            {list.items.length > 5 && (
                                                <ListItem>
                                                    <ListItemText
                                                        primary={`+${list.items.length - 5} more items`}
                                                        primaryTypographyProps={{ color: "text.secondary", variant: "body2" }}
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => setSelectedGroceryList(list)}>View All</Button>
                                        {list.status === "ready" && (
                                            <Button size="small" color="primary">
                                                Order from Store
                                            </Button>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">
                        No grocery lists yet. Create a list or generate one from a meal plan!
                    </Alert>
                )}
            </TabPanel>

            {/* Orders Tab */}
            <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                    Recent Orders
                </Typography>

                {ordersLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : orders && orders.length > 0 ? (
                    <List>
                        {orders.map((order) => (
                            <Paper key={order.orderId} sx={{ mb: 2 }}>
                                <ListItem>
                                    <ListItemIcon>
                                        {order.orderType === "delivery" ? <RestaurantIcon /> : <ShoppingCartIcon />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {order.restaurant || order.store || getServiceName(order.service)}
                                                </Typography>
                                                <Chip
                                                    label={order.status}
                                                    color={getStatusColor(order.status) as "success" | "warning" | "info" | "error" | "default"}
                                                    size="small"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" component="span">
                                                    {getServiceName(order.service)} • {order.items.length} items • £{order.total.toFixed(2)}
                                                </Typography>
                                                <br />
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Button size="small">View Details</Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </Paper>
                        ))}
                    </List>
                ) : (
                    <Alert severity="info">
                        No orders yet. Order food delivery or groceries to see them here!
                    </Alert>
                )}
            </TabPanel>

            {/* View Recipe Dialog */}
            <Dialog open={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedRecipe?.name}</DialogTitle>
                <DialogContent>
                    {selectedRecipe?.description && (
                        <Typography variant="body1" sx={{ mb: 2 }}>{selectedRecipe.description}</Typography>
                    )}
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Chip icon={<TimeIcon />} label={`${(selectedRecipe?.prepTime || 0) + (selectedRecipe?.cookTime || 0)} min`} />
                        <Chip icon={<PeopleIcon />} label={`${selectedRecipe?.servings} servings`} />
                        {selectedRecipe?.cuisine && <Chip label={selectedRecipe.cuisine} />}
                    </Stack>
                    {selectedRecipe?.dietaryTags && selectedRecipe.dietaryTags.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Dietary Tags</Typography>
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                {selectedRecipe.dietaryTags.map((tag) => (
                                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                                ))}
                            </Box>
                        </Box>
                    )}
                    {selectedRecipe?.ingredients && selectedRecipe.ingredients.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Ingredients</Typography>
                            <List dense>
                                {selectedRecipe.ingredients.map((ing, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemText primary={`${ing.quantity} ${ing.unit} ${ing.name}`} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                    {selectedRecipe?.instructions && selectedRecipe.instructions.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>Instructions</Typography>
                            <List dense>
                                {selectedRecipe.instructions.map((step, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemText primary={`${idx + 1}. ${step}`} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedRecipe(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* View Meal Plan Dialog */}
            <Dialog open={!!selectedMealPlan} onClose={() => setSelectedMealPlan(null)} maxWidth="md" fullWidth>
                <DialogTitle>Meal Plan - Week of {selectedMealPlan?.weekStartDate}</DialogTitle>
                <DialogContent>
                    <Chip
                        label={selectedMealPlan?.status}
                        color={selectedMealPlan?.status === "active" ? "success" : selectedMealPlan?.status === "completed" ? "default" : "warning"}
                        sx={{ mb: 2 }}
                    />
                    {selectedMealPlan?.meals && selectedMealPlan.meals.length > 0 ? (
                        <List>
                            {selectedMealPlan.meals.map((meal, idx) => (
                                <ListItem key={idx}>
                                    <ListItemText
                                        primary={`${meal.day.charAt(0).toUpperCase() + meal.day.slice(1)} - ${meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}`}
                                        secondary={meal.recipeName || meal.notes || "No meal planned"}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Alert severity="info">No meals added to this plan yet. Edit the plan to add meals.</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedMealPlan(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* View Grocery List Dialog */}
            <Dialog open={!!selectedGroceryList} onClose={() => setSelectedGroceryList(null)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedGroceryList?.name}</DialogTitle>
                <DialogContent>
                    <Chip
                        label={selectedGroceryList?.status}
                        color={getStatusColor(selectedGroceryList?.status || "") as "success" | "warning" | "info" | "error" | "default"}
                        sx={{ mb: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedGroceryList?.items.filter((i) => i.checked).length} / {selectedGroceryList?.items.length} items checked
                    </Typography>
                    {selectedGroceryList?.items && selectedGroceryList.items.length > 0 ? (
                        <List dense>
                            {selectedGroceryList.items.map((item) => (
                                <ListItem key={item.itemId} disablePadding>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Checkbox
                                            edge="start"
                                            checked={item.checked}
                                            onChange={() => handleToggleGroceryItem(selectedGroceryList, item.itemId)}
                                            size="small"
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.name}
                                        secondary={`${item.quantity} ${item.unit} - ${item.category}`}
                                        sx={{ textDecoration: item.checked ? "line-through" : "none" }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Alert severity="info">No items in this list yet.</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedGroceryList(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Add Meal Plan Dialog */}
            <Dialog open={addMealPlanOpen} onClose={() => setAddMealPlanOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Meal Plan</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Week Start Date"
                        type="date"
                        fullWidth
                        value={newMealPlanDate}
                        onChange={(e) => setNewMealPlanDate(e.target.value)}
                        sx={{ mt: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        This will create a new weekly meal plan starting from the selected date.
                        You can add meals to each day after creating the plan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddMealPlanOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            createMealPlan.mutate({
                                weekStartDate: newMealPlanDate,
                                meals: [],
                                status: "draft",
                            });
                            setAddMealPlanOpen(false);
                            setNewMealPlanDate(new Date().toISOString().split("T")[0]);
                        }}
                        disabled={!newMealPlanDate}
                    >
                        Create Plan
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Grocery List Dialog */}
            <Dialog open={addGroceryListOpen} onClose={() => setAddGroceryListOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Grocery List</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="List Name"
                        fullWidth
                        value={newGroceryListName}
                        onChange={(e) => setNewGroceryListName(e.target.value)}
                        placeholder="e.g., Weekly Groceries, Party Supplies"
                        sx={{ mt: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Create an empty grocery list that you can add items to manually,
                        or generate one from a meal plan.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddGroceryListOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            createGroceryList.mutate({
                                name: newGroceryListName,
                                items: [],
                                status: "draft",
                            });
                            setAddGroceryListOpen(false);
                            setNewGroceryListName("");
                        }}
                        disabled={!newGroceryListName}
                    >
                        Create List
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Recipe Dialog */}
            <Dialog open={addRecipeOpen} onClose={() => setAddRecipeOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Recipe</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Recipe Name"
                        fullWidth
                        value={newRecipe.name}
                        onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={2}
                        value={newRecipe.description}
                        onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <TextField
                                label="Prep Time (min)"
                                type="number"
                                fullWidth
                                value={newRecipe.prepTime}
                                onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: parseInt(e.target.value) || 0 })}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="Cook Time (min)"
                                type="number"
                                fullWidth
                                value={newRecipe.cookTime}
                                onChange={(e) => setNewRecipe({ ...newRecipe, cookTime: parseInt(e.target.value) || 0 })}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="Servings"
                                type="number"
                                fullWidth
                                value={newRecipe.servings}
                                onChange={(e) => setNewRecipe({ ...newRecipe, servings: parseInt(e.target.value) || 1 })}
                            />
                        </Grid>
                    </Grid>
                    <TextField
                        margin="dense"
                        label="Cuisine"
                        fullWidth
                        value={newRecipe.cuisine}
                        onChange={(e) => setNewRecipe({ ...newRecipe, cuisine: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddRecipeOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            createRecipe.mutate({
                                ...newRecipe,
                                ingredients: [],
                                instructions: [],
                            });
                            setAddRecipeOpen(false);
                            setNewRecipe({
                                name: "",
                                description: "",
                                prepTime: 15,
                                cookTime: 30,
                                servings: 2,
                                cuisine: "",
                                ingredients: [],
                                instructions: [],
                                dietaryTags: [],
                                isFavorite: false,
                            });
                        }}
                        disabled={!newRecipe.name}
                    >
                        Add Recipe
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Food;
