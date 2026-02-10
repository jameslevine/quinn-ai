import { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    AttachMoney as MoneyIcon,
    Restaurant as FoodIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
} from "@mui/icons-material";

interface Action {
    id: string;
    type: "email" | "call" | "payment" | "food";
    title: string;
    description: string;
    status: "pending" | "completed" | "failed";
    createdAt: string;
}

const mockActions: Action[] = [
    {
        id: "1",
        type: "email",
        title: "Draft reply to John Smith",
        description: "Re: Meeting follow-up",
        status: "pending",
        createdAt: "2026-02-10T08:30:00Z",
    },
    {
        id: "2",
        type: "call",
        title: "Book dentist appointment",
        description: "Annual checkup",
        status: "completed",
        createdAt: "2026-02-10T07:15:00Z",
    },
    {
        id: "3",
        type: "payment",
        title: "Pay electric bill",
        description: "£85.00 to British Gas",
        status: "completed",
        createdAt: "2026-02-09T14:00:00Z",
    },
    {
        id: "4",
        type: "food",
        title: "Order weekly groceries",
        description: "From Ocado - £67.50",
        status: "pending",
        createdAt: "2026-02-09T10:00:00Z",
    },
    {
        id: "5",
        type: "email",
        title: "Unsubscribe from newsletters",
        description: "5 newsletters identified",
        status: "completed",
        createdAt: "2026-02-08T16:30:00Z",
    },
    {
        id: "6",
        type: "call",
        title: "Negotiate internet bill",
        description: "Call to BT for better rate",
        status: "failed",
        createdAt: "2026-02-08T11:00:00Z",
    },
];

const getActionIcon = (type: Action["type"]) => {
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

const getStatusColor = (status: Action["status"]) => {
    switch (status) {
        case "pending":
            return "warning";
        case "completed":
            return "success";
        case "failed":
            return "error";
    }
};

export default function Actions() {
    const [tabValue, setTabValue] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredActions = mockActions.filter((action) => {
        const matchesSearch =
            action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            action.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (tabValue === 0) return matchesSearch;
        if (tabValue === 1) return matchesSearch && action.status === "pending";
        if (tabValue === 2) return matchesSearch && action.status === "completed";
        if (tabValue === 3) return matchesSearch && action.status === "failed";
        return matchesSearch;
    });

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Actions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    View and manage all actions Quinn has taken on your behalf.
                </Typography>
            </Box>

            <Card>
                <CardContent>
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            placeholder="Search actions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                    </Box>

                    <Tabs
                        value={tabValue}
                        onChange={(_, newValue) => setTabValue(newValue)}
                        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
                    >
                        <Tab label={`All (${mockActions.length})`} />
                        <Tab
                            label={`Pending (${mockActions.filter((a) => a.status === "pending").length})`}
                        />
                        <Tab
                            label={`Completed (${mockActions.filter((a) => a.status === "completed").length})`}
                        />
                        <Tab
                            label={`Failed (${mockActions.filter((a) => a.status === "failed").length})`}
                        />
                    </Tabs>

                    <List disablePadding>
                        {filteredActions.map((action) => (
                            <ListItem
                                key={action.id}
                                sx={{
                                    px: 0,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    "&:last-child": { borderBottom: "none" },
                                }}
                                secondaryAction={
                                    <IconButton edge="end">
                                        <ViewIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getActionIcon(action.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={action.title}
                                    secondary={action.description}
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                />
                                <Chip
                                    label={action.status}
                                    size="small"
                                    color={getStatusColor(action.status)}
                                    sx={{ mr: 2 }}
                                />
                            </ListItem>
                        ))}
                        {filteredActions.length === 0 && (
                            <Box sx={{ py: 4, textAlign: "center" }}>
                                <Typography color="text.secondary">
                                    No actions found matching your criteria.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
}
