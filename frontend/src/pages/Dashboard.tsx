import {
    Box,
    Card,
    CardContent,
    Grid,
    Typography,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Button,
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    AttachMoney as MoneyIcon,
    Restaurant as FoodIcon,
    CheckCircle as CheckIcon,
    Schedule as PendingIcon,
    TrendingUp as TrendingIcon,
} from "@mui/icons-material";
import { useStore } from "../store";

// Stats card component
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    progress?: number;
}

function StatCard({ title, value, subtitle, icon, color, progress }: StatCardProps) {
    return (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                            {value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: `${color}20`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color,
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
                {progress !== undefined && (
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: `${color}20`,
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: color,
                            },
                        }}
                    />
                )}
            </CardContent>
        </Card>
    );
}

// Recent activity item
interface ActivityItem {
    id: string;
    type: "email" | "call" | "payment" | "food";
    title: string;
    description: string;
    time: string;
    status: "completed" | "pending";
}

const recentActivity: ActivityItem[] = [
    {
        id: "1",
        type: "email",
        title: "Email Draft Ready",
        description: "Reply to John Smith about meeting",
        time: "2 min ago",
        status: "pending",
    },
    {
        id: "2",
        type: "call",
        title: "Appointment Booked",
        description: "Dentist appointment for March 15",
        time: "1 hour ago",
        status: "completed",
    },
    {
        id: "3",
        type: "payment",
        title: "Bill Payment Scheduled",
        description: "Electric bill - £85.00",
        time: "3 hours ago",
        status: "completed",
    },
    {
        id: "4",
        type: "food",
        title: "Grocery Order Prepared",
        description: "Weekly groceries from Ocado",
        time: "5 hours ago",
        status: "pending",
    },
];

const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
        case "email":
            return <EmailIcon />;
        case "call":
            return <PhoneIcon />;
        case "payment":
            return <MoneyIcon />;
        case "food":
            return <FoodIcon />;
    }
};

export default function Dashboard() {
    const { pendingActions } = useStore();

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Welcome back! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Here's what Quinn has been working on for you.
                </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Approvals"
                        value={pendingActions.length || 4}
                        subtitle="Actions waiting for you"
                        icon={<PendingIcon />}
                        color="#f59e0b"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Completed Today"
                        value={12}
                        subtitle="Tasks done automatically"
                        icon={<CheckIcon />}
                        color="#10b981"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Time Saved"
                        value="3.5h"
                        subtitle="This week"
                        icon={<TrendingIcon />}
                        color="#667eea"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Monthly Budget"
                        value="£320"
                        subtitle="of £500 used"
                        icon={<MoneyIcon />}
                        color="#764ba2"
                        progress={64}
                    />
                </Grid>
            </Grid>

            {/* Main Content Grid */}
            <Grid container spacing={3}>
                {/* Recent Activity */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 2,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Recent Activity
                                </Typography>
                                <Button size="small">View All</Button>
                            </Box>
                            <List disablePadding>
                                {recentActivity.map((activity) => (
                                    <ListItem
                                        key={activity.id}
                                        sx={{
                                            px: 0,
                                            borderBottom: "1px solid",
                                            borderColor: "divider",
                                            "&:last-child": { borderBottom: "none" },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 40,
                                                color:
                                                    activity.status === "completed"
                                                        ? "success.main"
                                                        : "warning.main",
                                            }}
                                        >
                                            {getActivityIcon(activity.type)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={activity.title}
                                            secondary={activity.description}
                                            primaryTypographyProps={{ fontWeight: 500 }}
                                        />
                                        <Box sx={{ textAlign: "right" }}>
                                            <Chip
                                                label={activity.status}
                                                size="small"
                                                color={
                                                    activity.status === "completed"
                                                        ? "success"
                                                        : "warning"
                                                }
                                                sx={{ mb: 0.5 }}
                                            />
                                            <Typography
                                                variant="caption"
                                                display="block"
                                                color="text.secondary"
                                            >
                                                {activity.time}
                                            </Typography>
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Quick Actions
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<EmailIcon />}
                                    fullWidth
                                    sx={{ justifyContent: "flex-start" }}
                                >
                                    Check Emails
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<PhoneIcon />}
                                    fullWidth
                                    sx={{ justifyContent: "flex-start" }}
                                >
                                    Schedule a Call
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<FoodIcon />}
                                    fullWidth
                                    sx={{ justifyContent: "flex-start" }}
                                >
                                    Order Groceries
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<MoneyIcon />}
                                    fullWidth
                                    sx={{ justifyContent: "flex-start" }}
                                >
                                    Review Budget
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Upcoming */}
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Upcoming
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        Dentist Appointment
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Tomorrow at 10:00 AM
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        Grocery Delivery
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Wednesday, 2-3 PM
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                        Electric Bill Due
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        March 15, 2026
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
