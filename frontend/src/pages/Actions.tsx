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
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    AttachMoney as MoneyIcon,
    Restaurant as FoodIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Event as EventIcon,
    Task as TaskIcon,
} from "@mui/icons-material";
import { useActions, useUpdateActionStatus } from "../hooks/useActions";
import type { Action, ActionStatus } from "../hooks/useActions";

const getActionIcon = (type: string) => {
    switch (type) {
        case "email":
            return <EmailIcon />;
        case "call":
        case "phone":
            return <PhoneIcon />;
        case "payment":
        case "banking":
            return <MoneyIcon />;
        case "food":
            return <FoodIcon />;
        case "calendar":
        case "event":
        case "appointment":
            return <EventIcon />;
        case "task":
        case "other":
        default:
            return <TaskIcon />;
    }
};

const getStatusColor = (status: string): "warning" | "success" | "error" | "info" | "default" => {
    switch (status) {
        case "pending":
            return "warning";
        case "completed":
        case "approved":
            return "success";
        case "failed":
        case "rejected":
            return "error";
        default:
            return "default";
    }
};

export default function Actions() {
    const [tabValue, setTabValue] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const { data: actions, isLoading, error } = useActions();
    const updateActionStatus = useUpdateActionStatus();

    const actionsList = Array.isArray(actions) ? actions : [];

    const filteredActions = actionsList.filter((action) => {
        const matchesSearch =
            action.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            action.description?.toLowerCase().includes(searchQuery.toLowerCase());

        if (tabValue === 0) return matchesSearch;
        if (tabValue === 1) return matchesSearch && action.status === "pending";
        if (tabValue === 2) return matchesSearch && (action.status === "completed" || action.status === "approved");
        if (tabValue === 3) return matchesSearch && (action.status === "failed" || action.status === "rejected");
        return matchesSearch;
    });

    const pendingCount = actionsList.filter((a) => a.status === "pending").length;
    const completedCount = actionsList.filter((a) => a.status === "completed" || a.status === "approved").length;
    const failedCount = actionsList.filter((a) => a.status === "failed" || a.status === "rejected").length;

    const handleViewDetails = (action: Action) => {
        setSelectedAction(action);
        setDetailsOpen(true);
    };

    const handleApprove = async (actionId: string) => {
        try {
            await updateActionStatus.mutateAsync({ actionId, status: "approved" as ActionStatus });
        } catch (err) {
            console.error("Failed to approve action:", err);
        }
    };

    const handleReject = async (actionId: string) => {
        try {
            await updateActionStatus.mutateAsync({ actionId, status: "rejected" as ActionStatus });
        } catch (err) {
            console.error("Failed to reject action:", err);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ py: 4 }}>
                <Alert severity="error">Failed to load actions. Please try again.</Alert>
            </Box>
        );
    }

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
                        <Tab label={`All (${actionsList.length})`} />
                        <Tab label={`Pending (${pendingCount})`} />
                        <Tab label={`Completed (${completedCount})`} />
                        <Tab label={`Failed (${failedCount})`} />
                    </Tabs>

                    <List disablePadding>
                        {filteredActions.map((action) => (
                            <ListItem
                                key={action.actionId}
                                sx={{
                                    px: 0,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    "&:last-child": { borderBottom: "none" },
                                }}
                                secondaryAction={
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        {action.status === "pending" && (
                                            <>
                                                <IconButton
                                                    edge="end"
                                                    color="success"
                                                    onClick={() => handleApprove(action.actionId)}
                                                    disabled={updateActionStatus.isPending}
                                                >
                                                    <ApproveIcon />
                                                </IconButton>
                                                <IconButton
                                                    edge="end"
                                                    color="error"
                                                    onClick={() => handleReject(action.actionId)}
                                                    disabled={updateActionStatus.isPending}
                                                >
                                                    <RejectIcon />
                                                </IconButton>
                                            </>
                                        )}
                                        <IconButton edge="end" onClick={() => handleViewDetails(action)}>
                                            <ViewIcon />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getActionIcon(action.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={action.title}
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {action.description}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(action.createdAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    }
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
                                    {actionsList.length === 0
                                        ? "No actions yet. Quinn will create actions as you interact with the AI."
                                        : "No actions found matching your criteria."}
                                </Typography>
                            </Box>
                        )}
                    </List>
                </CardContent>
            </Card>

            {/* Action Details Dialog */}
            <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Action Details</DialogTitle>
                <DialogContent>
                    {selectedAction && (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedAction.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {selectedAction.description}
                            </Typography>
                            {selectedAction.details && (
                                <Typography variant="body2" paragraph>
                                    {selectedAction.details}
                                </Typography>
                            )}
                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                <Chip label={selectedAction.type} variant="outlined" />
                                <Chip
                                    label={selectedAction.status}
                                    color={getStatusColor(selectedAction.status)}
                                />
                                {selectedAction.amount && (
                                    <Chip
                                        label={`${selectedAction.currency || "£"}${selectedAction.amount}`}
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                Created: {new Date(selectedAction.createdAt).toLocaleString()}
                            </Typography>
                            {selectedAction.completedAt && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                    Completed: {new Date(selectedAction.completedAt).toLocaleString()}
                                </Typography>
                            )}
                            {selectedAction.metadata && Object.keys(selectedAction.metadata).length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Additional Details
                                    </Typography>
                                    <pre style={{ fontSize: "12px", overflow: "auto", background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                                        {JSON.stringify(selectedAction.metadata, null, 2)}
                                    </pre>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
