import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    CardActions,
    Chip,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    IconButton,
    Divider,
    Tabs,
    Tab,
} from "@mui/material";
import {
    Phone as PhoneIcon,
    Add as AddIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Stop as StopIcon,
    Refresh as RefreshIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    HourglassEmpty as PendingIcon,
} from "@mui/icons-material";
import {
    useCalls,
    usePendingCalls,
    useCreateCall,
    useApproveCall,
    useEndCall,
    useDeleteCall,
    useScriptTemplates,
    type CallRecord,
    type CallType,
    type CallStatus,
} from "../hooks/useCalls";

const CALL_TYPE_LABELS: Record<CallType, string> = {
    appointment_booking: "Appointment Booking",
    customer_service: "Customer Service",
    bill_negotiation: "Bill Negotiation",
    order_followup: "Order Follow-up",
    general_inquiry: "General Inquiry",
};

const STATUS_CONFIG: Record<
    CallStatus,
    { label: string; color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"; icon: React.ReactNode }
> = {
    pending: { label: "Pending Approval", color: "warning", icon: <PendingIcon /> },
    approved: { label: "Approved", color: "info", icon: <CheckIcon /> },
    in_progress: { label: "In Progress", color: "primary", icon: <PhoneIcon /> },
    completed: { label: "Completed", color: "success", icon: <CheckCircleIcon /> },
    failed: { label: "Failed", color: "error", icon: <ErrorIcon /> },
    cancelled: { label: "Cancelled", color: "default", icon: <CloseIcon /> },
};

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

const Calls = () => {
    const [tabValue, setTabValue] = useState(0);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        to: "",
        purpose: "",
        scriptType: "appointment_booking" as CallType,
        variables: {} as Record<string, string>,
        notes: "",
    });

    // Queries and mutations
    const { data: callsData, isLoading: loadingCalls, refetch: refetchCalls } = useCalls();
    const { data: pendingCalls, isLoading: loadingPending } = usePendingCalls();
    const { data: templates } = useScriptTemplates();
    const createCall = useCreateCall();
    const approveCall = useApproveCall();
    const endCall = useEndCall();
    const deleteCall = useDeleteCall();

    const calls = callsData?.calls || [];

    // Poll for status updates when there are in-progress calls
    useEffect(() => {
        const inProgressCalls = calls.filter((c) => c.status === "in_progress");
        if (inProgressCalls.length === 0) return;

        const interval = setInterval(() => {
            refetchCalls();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [calls, refetchCalls]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleCreateCall = async () => {
        try {
            await createCall.mutateAsync({
                to: formData.to,
                purpose: formData.purpose,
                scriptType: formData.scriptType,
                variables: formData.variables,
                notes: formData.notes,
            });
            setCreateDialogOpen(false);
            setFormData({
                to: "",
                purpose: "",
                scriptType: "appointment_booking",
                variables: {},
                notes: "",
            });
        } catch (error) {
            console.error("Failed to create call:", error);
        }
    };

    const handleApproveCall = async (callId: string, approved: boolean) => {
        try {
            await approveCall.mutateAsync({ callId, approved });
        } catch (error) {
            console.error("Failed to approve call:", error);
        }
    };

    const handleEndCall = async (callId: string) => {
        try {
            await endCall.mutateAsync(callId);
        } catch (error) {
            console.error("Failed to end call:", error);
        }
    };

    const handleDeleteCall = async (callId: string) => {
        try {
            await deleteCall.mutateAsync(callId);
        } catch (error) {
            console.error("Failed to delete call:", error);
        }
    };

    const handleViewDetails = (call: CallRecord) => {
        setSelectedCall(call);
        setDetailDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "N/A";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const selectedTemplate = templates?.find((t) => t.type === formData.scriptType);

    const renderCallCard = (call: CallRecord) => {
        const statusConfig = STATUS_CONFIG[call.status];

        return (
            <Card key={call.callId} sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {call.purpose}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                To: {call.to}
                            </Typography>
                        </Box>
                        <Chip
                            icon={statusConfig.icon as React.ReactElement}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            size="small"
                        />
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Chip
                            label={CALL_TYPE_LABELS[call.scriptType]}
                            variant="outlined"
                            size="small"
                        />
                        {call.duration && (
                            <Chip
                                label={`Duration: ${formatDuration(call.duration)}`}
                                variant="outlined"
                                size="small"
                            />
                        )}
                        <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(call.createdAt)}
                        </Typography>
                    </Box>

                    {call.outcome && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: "background.default", borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>Outcome:</strong> {call.outcome.success ? "Success" : "Unsuccessful"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {call.outcome.summary}
                            </Typography>
                        </Box>
                    )}
                </CardContent>

                <CardActions>
                    <Button size="small" onClick={() => handleViewDetails(call)}>
                        View Details
                    </Button>
                    {call.status === "pending" && (
                        <>
                            <Button
                                size="small"
                                color="success"
                                startIcon={<CheckIcon />}
                                onClick={() => handleApproveCall(call.callId, true)}
                                disabled={approveCall.isPending}
                            >
                                Approve
                            </Button>
                            <Button
                                size="small"
                                color="error"
                                startIcon={<CloseIcon />}
                                onClick={() => handleApproveCall(call.callId, false)}
                                disabled={approveCall.isPending}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {call.status === "in_progress" && (
                        <Button
                            size="small"
                            color="error"
                            startIcon={<StopIcon />}
                            onClick={() => handleEndCall(call.callId)}
                            disabled={endCall.isPending}
                        >
                            End Call
                        </Button>
                    )}
                    {(call.status === "completed" || call.status === "failed" || call.status === "cancelled") && (
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCall(call.callId)}
                            disabled={deleteCall.isPending}
                        >
                            <DeleteIcon />
                        </IconButton>
                    )}
                </CardActions>
            </Card>
        );
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4">Phone Calls</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton onClick={() => refetchCalls()}>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        New Call
                    </Button>
                </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                Quinn can make phone calls on your behalf to book appointments, handle customer service inquiries, negotiate bills, and more. All calls require your approval before being made.
            </Alert>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label={`Pending (${pendingCalls?.length || 0})`} />
                    <Tab label="All Calls" />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                {loadingPending ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : pendingCalls && pendingCalls.length > 0 ? (
                    pendingCalls.map(renderCallCard)
                ) : (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <ScheduleIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No pending calls
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create a new call request to get started
                        </Typography>
                    </Paper>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                {loadingCalls ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : calls.length > 0 ? (
                    calls.map(renderCallCard)
                ) : (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                        <PhoneIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No calls yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create your first call request
                        </Typography>
                    </Paper>
                )}
            </TabPanel>

            {/* Create Call Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Call</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                        <TextField
                            label="Phone Number"
                            value={formData.to}
                            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                            placeholder="+44..."
                            fullWidth
                            required
                        />

                        <TextField
                            label="Purpose"
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="e.g., Book dentist appointment"
                            fullWidth
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Call Type</InputLabel>
                            <Select
                                value={formData.scriptType}
                                label="Call Type"
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        scriptType: e.target.value as CallType,
                                        variables: {},
                                    })
                                }
                            >
                                {Object.entries(CALL_TYPE_LABELS).map(([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {selectedTemplate && selectedTemplate.requiredVariables.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Required Information
                                </Typography>
                                {selectedTemplate.requiredVariables.map((variable) => (
                                    <TextField
                                        key={variable}
                                        label={variable.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                        value={formData.variables[variable] || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                variables: { ...formData.variables, [variable]: e.target.value },
                                            })
                                        }
                                        fullWidth
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                ))}
                            </Box>
                        )}

                        <TextField
                            label="Notes (optional)"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            multiline
                            rows={2}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateCall}
                        disabled={!formData.to || !formData.purpose || createCall.isPending}
                    >
                        {createCall.isPending ? <CircularProgress size={24} /> : "Create Call"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Call Details Dialog */}
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Call Details</DialogTitle>
                <DialogContent>
                    {selectedCall && (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Purpose
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {selectedCall.purpose}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Phone Number
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {selectedCall.to}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Call Type
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {CALL_TYPE_LABELS[selectedCall.scriptType]}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Chip
                                        label={STATUS_CONFIG[selectedCall.status].label}
                                        color={STATUS_CONFIG[selectedCall.status].color}
                                        size="small"
                                    />
                                </Grid>
                                {selectedCall.duration && (
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Duration
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {formatDuration(selectedCall.duration)}
                                        </Typography>
                                    </Grid>
                                )}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {formatDate(selectedCall.createdAt)}
                                    </Typography>
                                </Grid>
                                {selectedCall.startedAt && (
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Started
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {formatDate(selectedCall.startedAt)}
                                        </Typography>
                                    </Grid>
                                )}
                                {selectedCall.completedAt && (
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Completed
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {formatDate(selectedCall.completedAt)}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>

                            {selectedCall.outcome && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Outcome
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: "background.default" }}>
                                        <Typography variant="body1">
                                            <strong>Result:</strong> {selectedCall.outcome.success ? "Successful" : "Unsuccessful"}
                                        </Typography>
                                        <Typography variant="body1" sx={{ mt: 1 }}>
                                            {selectedCall.outcome.summary}
                                        </Typography>
                                        {selectedCall.outcome.appointmentBooked && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2">Appointment Booked:</Typography>
                                                <Typography variant="body2">
                                                    Date: {selectedCall.outcome.appointmentBooked.date}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Time: {selectedCall.outcome.appointmentBooked.time}
                                                </Typography>
                                                {selectedCall.outcome.appointmentBooked.confirmationNumber && (
                                                    <Typography variant="body2">
                                                        Confirmation: {selectedCall.outcome.appointmentBooked.confirmationNumber}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Paper>
                                </Box>
                            )}

                            {selectedCall.transcript && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Transcript
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: "background.default", maxHeight: 300, overflow: "auto" }}>
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                            {selectedCall.transcript}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            {selectedCall.notes && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Notes
                                    </Typography>
                                    <Typography variant="body2">{selectedCall.notes}</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Calls;
