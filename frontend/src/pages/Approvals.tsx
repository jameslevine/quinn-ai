import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    List,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Snackbar,
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    AttachMoney as MoneyIcon,
    Restaurant as FoodIcon,
    Check as ApproveIcon,
    Close as RejectIcon,
    Event as EventIcon,
    Task as TaskIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { usePendingApprovals, useApproveAction, useRejectAction } from "../hooks/useApprovals";
import type { Action } from "../hooks/useActions";

const getApprovalIcon = (type: string) => {
    switch (type) {
        case "email":
            return <EmailIcon />;
        case "call":
        case "phone":
            return <PhoneIcon />;
        case "payment":
            return <MoneyIcon />;
        case "food":
            return <FoodIcon />;
        case "appointment":
        case "calendar":
        case "event":
            return <EventIcon />;
        default:
            return <TaskIcon />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case "email":
            return "#667eea";
        case "call":
        case "phone":
            return "#10b981";
        case "payment":
            return "#f59e0b";
        case "food":
            return "#ef4444";
        case "appointment":
        case "calendar":
        case "event":
            return "#8b5cf6";
        default:
            return "#6b7280";
    }
};

export default function Approvals() {
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });

    const { data: approvals, isLoading, error } = usePendingApprovals();
    const approveAction = useApproveAction();
    const rejectAction = useRejectAction();

    const approvalsList = Array.isArray(approvals) ? approvals : [];

    const handleApprove = async (actionId: string) => {
        try {
            await approveAction.mutateAsync(actionId);
            setSnackbar({
                open: true,
                message: "Action approved successfully!",
                severity: "success",
            });
        } catch (err) {
            console.error("Failed to approve:", err);
            setSnackbar({
                open: true,
                message: "Failed to approve action",
                severity: "error",
            });
        }
    };

    const handleReject = async (actionId: string) => {
        try {
            await rejectAction.mutateAsync(actionId);
            setSnackbar({
                open: true,
                message: "Action rejected",
                severity: "success",
            });
        } catch (err) {
            console.error("Failed to reject:", err);
            setSnackbar({
                open: true,
                message: "Failed to reject action",
                severity: "error",
            });
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
                <Alert severity="error">Failed to load pending approvals. Please try again.</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Pending Approvals
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Review and approve actions before Quinn executes them.
                </Typography>
            </Box>

            {approvalsList.length === 0 ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                    All caught up! No pending approvals at the moment.
                </Alert>
            ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                    You have {approvalsList.length} action(s) waiting for your approval.
                </Alert>
            )}

            <List disablePadding>
                {approvalsList.map((approval: Action) => (
                    <Card key={approval.actionId} sx={{ mb: 2 }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 2,
                                        backgroundColor: `${getTypeColor(approval.type)}20`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: getTypeColor(approval.type),
                                        mr: 2,
                                    }}
                                >
                                    {getApprovalIcon(approval.type)}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {approval.title}
                                        </Typography>
                                        <Chip
                                            label={approval.type}
                                            size="small"
                                            sx={{
                                                backgroundColor: `${getTypeColor(approval.type)}20`,
                                                color: getTypeColor(approval.type),
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {approval.description}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {approval.details && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            backgroundColor: "background.default",
                                            p: 2,
                                            borderRadius: 1,
                                            fontStyle: "italic",
                                        }}
                                    >
                                        {approval.details}
                                    </Typography>
                                </Box>
                            )}

                            {approval.amount && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Amount:{" "}
                                        <Typography
                                            component="span"
                                            fontWeight={600}
                                            color="text.primary"
                                        >
                                            {approval.currency || "£"}{approval.amount}
                                        </Typography>
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="caption" color="text.secondary">
                                    Created: {new Date(approval.createdAt).toLocaleString()}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<RejectIcon />}
                                        onClick={() => handleReject(approval.actionId)}
                                        disabled={rejectAction.isPending}
                                    >
                                        {rejectAction.isPending ? "Rejecting..." : "Reject"}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<ApproveIcon />}
                                        onClick={() => handleApprove(approval.actionId)}
                                        disabled={approveAction.isPending}
                                    >
                                        {approveAction.isPending ? "Approving..." : "Approve"}
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </List>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
