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
} from "@mui/material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    AttachMoney as MoneyIcon,
    Restaurant as FoodIcon,
    Check as ApproveIcon,
    Close as RejectIcon,
    Edit as EditIcon,
} from "@mui/icons-material";

interface PendingApproval {
    id: string;
    type: "email" | "call" | "payment" | "food";
    title: string;
    description: string;
    details: string;
    amount?: string;
    createdAt: string;
}

const mockApprovals: PendingApproval[] = [
    {
        id: "1",
        type: "email",
        title: "Send email reply",
        description: "Reply to John Smith about meeting",
        details:
            "Hi John, Thank you for your email. I would be happy to meet next Tuesday at 2pm. Please let me know if this works for you. Best regards.",
        createdAt: "2026-02-10T08:30:00Z",
    },
    {
        id: "2",
        type: "food",
        title: "Place grocery order",
        description: "Weekly groceries from Ocado",
        details: "12 items including milk, bread, eggs, vegetables, and chicken.",
        amount: "£67.50",
        createdAt: "2026-02-10T07:00:00Z",
    },
    {
        id: "3",
        type: "payment",
        title: "Pay utility bill",
        description: "Electric bill to British Gas",
        details: "Monthly electricity bill for February 2026.",
        amount: "£85.00",
        createdAt: "2026-02-09T16:00:00Z",
    },
    {
        id: "4",
        type: "call",
        title: "Schedule appointment",
        description: "Book car service at local garage",
        details: "Annual service and MOT. Proposed date: March 20, 2026 at 9:00 AM.",
        createdAt: "2026-02-09T14:00:00Z",
    },
];

const getApprovalIcon = (type: PendingApproval["type"]) => {
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

const getTypeColor = (type: PendingApproval["type"]) => {
    switch (type) {
        case "email":
            return "#667eea";
        case "call":
            return "#10b981";
        case "payment":
            return "#f59e0b";
        case "food":
            return "#ef4444";
    }
};

export default function Approvals() {
    const handleApprove = (id: string) => {
        console.log("Approved:", id);
        // TODO: Implement approval logic
    };

    const handleReject = (id: string) => {
        console.log("Rejected:", id);
        // TODO: Implement rejection logic
    };

    const handleEdit = (id: string) => {
        console.log("Edit:", id);
        // TODO: Implement edit logic
    };

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

            {mockApprovals.length === 0 ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                    All caught up! No pending approvals at the moment.
                </Alert>
            ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                    You have {mockApprovals.length} action(s) waiting for your approval.
                </Alert>
            )}

            <List disablePadding>
                {mockApprovals.map((approval) => (
                    <Card key={approval.id} sx={{ mb: 2 }}>
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

                            {approval.amount && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Amount:{" "}
                                        <Typography
                                            component="span"
                                            fontWeight={600}
                                            color="text.primary"
                                        >
                                            {approval.amount}
                                        </Typography>
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<RejectIcon />}
                                    onClick={() => handleReject(approval.id)}
                                >
                                    Reject
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => handleEdit(approval.id)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<ApproveIcon />}
                                    onClick={() => handleApprove(approval.id)}
                                >
                                    Approve
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </List>
        </Box>
    );
}
