import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    Divider,
    TextField,
    Button,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Slider,
    Alert,
    Snackbar,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    FormGroup,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Notifications as NotificationsIcon,
    Send as SendIcon,
} from "@mui/icons-material";
import { useStore } from "../store";
import {
    useIntegrations,
    useGmailAuthUrl,
    useDisconnectIntegration,
    getIntegration,
} from "../hooks/useIntegrations";
import {
    useBankConnections,
    useLinkToken,
    useConnectBank,
    useDisconnectBank,
} from "../hooks/useBanking";
import {
    useSMSStatus,
    useVerifiedNumbers,
    useRegisterPhone,
    useVerifyPhone,
    useUnregisterPhone,
    validatePhoneNumber,
    formatPhoneNumber,
} from "../hooks/useSMS";
import {
    useDevices,
    useNotificationPreferences,
    useUpdateNotificationPreferences,
    useSendTestNotification,
    useUnregisterDevice,
    requestNotificationPermission,
    isNotificationSupported,
    getNotificationPermission,
} from "../hooks/useNotifications";

export default function Settings() {
    const { isDarkMode, toggleDarkMode } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info";
    }>({ open: false, message: "", severity: "info" });

    // Phone registration state
    const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [phoneStep, setPhoneStep] = useState<"enter" | "verify">("enter");

    // Integrations
    const { data: integrations, isLoading: integrationsLoading } = useIntegrations();
    const gmailAuthMutation = useGmailAuthUrl();
    const disconnectMutation = useDisconnectIntegration();

    // Banking
    const { data: bankConnections } = useBankConnections();
    const linkTokenMutation = useLinkToken();
    const connectBankMutation = useConnectBank();
    const disconnectBankMutation = useDisconnectBank();

    // SMS
    const { data: smsStatus, isLoading: smsLoading } = useSMSStatus();
    const { data: verifiedNumbers, isLoading: verifiedNumbersLoading } = useVerifiedNumbers();
    const registerPhoneMutation = useRegisterPhone();
    const verifyPhoneMutation = useVerifyPhone();
    const unregisterPhoneMutation = useUnregisterPhone();

    // Notifications
    const { data: devices, isLoading: devicesLoading } = useDevices();
    const { data: notificationPrefs, isLoading: prefsLoading } = useNotificationPreferences();
    const updatePrefsMutation = useUpdateNotificationPreferences();
    const testNotificationMutation = useSendTestNotification();
    const unregisterDeviceMutation = useUnregisterDevice();

    // Handle OAuth callback messages
    useEffect(() => {
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        if (success === "gmail_connected") {
            // Use setTimeout to avoid calling setState directly in effect
            setTimeout(() => {
                setSnackbar({
                    open: true,
                    message: "Gmail connected successfully!",
                    severity: "success",
                });
            }, 0);
            setSearchParams({});
        } else if (error === "gmail_auth_denied") {
            setTimeout(() => {
                setSnackbar({
                    open: true,
                    message: "Gmail authorization was denied",
                    severity: "error",
                });
            }, 0);
            setSearchParams({});
        } else if (error === "gmail_auth_failed") {
            setTimeout(() => {
                setSnackbar({
                    open: true,
                    message: "Gmail authorization failed. Please try again.",
                    severity: "error",
                });
            }, 0);
            setSearchParams({});
        }
    }, [searchParams, setSearchParams]);

    const handleConnectGmail = async () => {
        try {
            const authUrl = await gmailAuthMutation.mutateAsync();
            window.location.href = authUrl;
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to start Gmail authorization",
                severity: "error",
            });
        }
    };

    const handleDisconnectGmail = async () => {
        try {
            await disconnectMutation.mutateAsync("gmail");
            setSnackbar({
                open: true,
                message: "Gmail disconnected successfully",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to disconnect Gmail",
                severity: "error",
            });
        }
    };

    const handleConnectBank = async () => {
        try {
            const linkToken = await linkTokenMutation.mutateAsync();
            if (linkToken && window.Plaid) {
                const handler = window.Plaid.create({
                    token: linkToken,
                    onSuccess: async (publicToken, metadata) => {
                        try {
                            await connectBankMutation.mutateAsync({
                                publicToken,
                                institutionId: metadata.institution?.institution_id || "",
                            });
                            setSnackbar({
                                open: true,
                                message: "Bank connected successfully!",
                                severity: "success",
                            });
                        } catch {
                            setSnackbar({
                                open: true,
                                message: "Failed to connect bank",
                                severity: "error",
                            });
                        }
                    },
                    onExit: () => { },
                });
                handler.open();
            } else {
                setSnackbar({
                    open: true,
                    message: "Plaid not loaded. Please refresh the page.",
                    severity: "error",
                });
            }
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to start bank connection",
                severity: "error",
            });
        }
    };

    const handleDisconnectBank = async (connectionId: string) => {
        try {
            await disconnectBankMutation.mutateAsync(connectionId);
            setSnackbar({
                open: true,
                message: "Bank disconnected successfully",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to disconnect bank",
                severity: "error",
            });
        }
    };

    // Phone registration handlers
    const handleRegisterPhone = async () => {
        if (!validatePhoneNumber(phoneNumber)) {
            setSnackbar({
                open: true,
                message: "Please enter a valid phone number",
                severity: "error",
            });
            return;
        }

        try {
            await registerPhoneMutation.mutateAsync(phoneNumber);
            setPhoneStep("verify");
            setSnackbar({
                open: true,
                message: "Verification code sent!",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to register phone number",
                severity: "error",
            });
        }
    };

    const handleVerifyPhone = async () => {
        try {
            await verifyPhoneMutation.mutateAsync(verificationCode);
            setPhoneDialogOpen(false);
            setPhoneStep("enter");
            setPhoneNumber("");
            setVerificationCode("");
            setSnackbar({
                open: true,
                message: "Phone number verified!",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Invalid verification code",
                severity: "error",
            });
        }
    };

    const handleUnregisterPhone = async () => {
        try {
            await unregisterPhoneMutation.mutateAsync();
            setSnackbar({
                open: true,
                message: "Phone number removed",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to remove phone number",
                severity: "error",
            });
        }
    };

    // Push notification handlers
    const handleEnablePush = async () => {
        const permission = await requestNotificationPermission();
        if (permission === "granted") {
            setSnackbar({
                open: true,
                message: "Push notifications enabled!",
                severity: "success",
            });
        } else {
            setSnackbar({
                open: true,
                message: "Push notification permission denied",
                severity: "error",
            });
        }
    };

    const handleTestNotification = async () => {
        try {
            await testNotificationMutation.mutateAsync({
                title: "Test Notification",
                body: "This is a test notification from Quinn!",
            });
            setSnackbar({
                open: true,
                message: "Test notification sent!",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to send test notification",
                severity: "error",
            });
        }
    };

    const handleUpdateNotificationChannel = async (channel: string, enabled: boolean) => {
        try {
            await updatePrefsMutation.mutateAsync({
                channels: {
                    push: notificationPrefs?.channels?.push ?? true,
                    sms: notificationPrefs?.channels?.sms ?? false,
                    whatsapp: notificationPrefs?.channels?.whatsapp ?? false,
                    email: notificationPrefs?.channels?.email ?? true,
                    [channel]: enabled,
                },
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to update notification settings",
                severity: "error",
            });
        }
    };

    const gmailIntegration = getIntegration(integrations, "gmail");
    const isGmailConnected = gmailIntegration?.status === "connected";
    const pushSupported = isNotificationSupported();
    const pushPermission = getNotificationPermission();

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Customize how Quinn works for you.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Appearance */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Appearance
                            </Typography>
                            <FormControlLabel
                                control={<Switch checked={isDarkMode} onChange={toggleDarkMode} />}
                                label="Dark Mode"
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Switch between light and dark themes.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Notifications */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <NotificationsIcon />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Notifications
                                </Typography>
                            </Box>

                            {prefsLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationPrefs?.channels?.email ?? true}
                                                onChange={(e) => handleUpdateNotificationChannel("email", e.target.checked)}
                                            />
                                        }
                                        label="Email Notifications"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationPrefs?.channels?.push ?? true}
                                                onChange={(e) => handleUpdateNotificationChannel("push", e.target.checked)}
                                                disabled={!pushSupported || pushPermission !== "granted"}
                                            />
                                        }
                                        label={
                                            <Box>
                                                Push Notifications
                                                {!pushSupported && (
                                                    <Chip label="Not Supported" size="small" sx={{ ml: 1 }} />
                                                )}
                                                {pushSupported && pushPermission !== "granted" && (
                                                    <Button size="small" onClick={handleEnablePush} sx={{ ml: 1 }}>
                                                        Enable
                                                    </Button>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={notificationPrefs?.channels?.sms ?? false}
                                                onChange={(e) => handleUpdateNotificationChannel("sms", e.target.checked)}
                                                disabled={!smsStatus?.phoneVerified}
                                            />
                                        }
                                        label={
                                            <Box>
                                                SMS Notifications
                                                {!smsStatus?.phoneVerified && (
                                                    <Button size="small" onClick={() => setPhoneDialogOpen(true)} sx={{ ml: 1 }}>
                                                        Add Phone
                                                    </Button>
                                                )}
                                            </Box>
                                        }
                                    />
                                </FormGroup>
                            )}

                            {(devices?.length ?? 0) > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<SendIcon />}
                                        onClick={handleTestNotification}
                                        disabled={testNotificationMutation.isPending}
                                    >
                                        Send Test Notification
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* SMS Settings */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <PhoneIcon />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    SMS Settings
                                </Typography>
                            </Box>

                            {smsLoading ? (
                                <CircularProgress size={24} />
                            ) : smsStatus?.phoneVerified ? (
                                <Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                        <Typography variant="body1">
                                            {formatPhoneNumber(smsStatus.phoneNumber || "")}
                                        </Typography>
                                        <Chip label="Verified" color="success" size="small" />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        You can receive SMS notifications and approve actions via text message.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        size="small"
                                        onClick={handleUnregisterPhone}
                                        disabled={unregisterPhoneMutation.isPending}
                                    >
                                        Remove Phone Number
                                    </Button>
                                </Box>
                            ) : smsStatus?.phoneNumber ? (
                                <Box>
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Phone number pending verification
                                    </Alert>
                                    <Button variant="contained" size="small" onClick={() => setPhoneDialogOpen(true)}>
                                        Enter Verification Code
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Add your phone number to receive SMS notifications and approve actions via text.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<PhoneIcon />}
                                        onClick={() => setPhoneDialogOpen(true)}
                                    >
                                        Add Phone Number
                                    </Button>
                                </Box>
                            )}

                            {/* AWS Verified Numbers (Sandbox Mode) */}
                            {!verifiedNumbersLoading && verifiedNumbers?.sandboxMode && (
                                <Box sx={{ mt: 3 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            AWS Sandbox Verified Numbers
                                        </Typography>
                                        <Chip label="Sandbox Mode" size="small" color="warning" />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                        SMS can only be sent to these verified numbers while in sandbox mode.
                                    </Typography>
                                    {verifiedNumbers.verifiedNumbers.length > 0 ? (
                                        <List dense>
                                            {verifiedNumbers.verifiedNumbers.map((num, index) => (
                                                <ListItem key={index} sx={{ px: 0 }}>
                                                    <ListItemText
                                                        primary={num.formattedPhoneNumber}
                                                        secondary={`Status: ${num.status}${num.verifiedAt ? ` • Verified: ${new Date(num.verifiedAt).toLocaleDateString()}` : ""}`}
                                                    />
                                                    {num.status === "VERIFIED" && (
                                                        <Chip label="Verified" color="success" size="small" />
                                                    )}
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No verified numbers in AWS sandbox.
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Registered Devices */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Registered Devices
                            </Typography>

                            {devicesLoading ? (
                                <CircularProgress size={24} />
                            ) : (devices?.length ?? 0) > 0 ? (
                                <List dense>
                                    {devices?.map((device, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={device.platform.toUpperCase()}
                                                secondary={`Last used: ${new Date(device.lastUsedAt).toLocaleDateString()}`}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => unregisterDeviceMutation.mutate(device.token)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No devices registered for push notifications.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Approval Settings */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Approval Settings
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Configure how Quinn handles different types of actions.
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Email Actions</InputLabel>
                                        <Select defaultValue="suggest" label="Email Actions">
                                            <MenuItem value="suggest">Suggest Only</MenuItem>
                                            <MenuItem value="auto_review">Auto with Review</MenuItem>
                                            <MenuItem value="full_auto">Full Auto</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Phone Calls</InputLabel>
                                        <Select defaultValue="suggest" label="Phone Calls">
                                            <MenuItem value="suggest">Suggest Only</MenuItem>
                                            <MenuItem value="auto_review">Auto with Review</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Payments</InputLabel>
                                        <Select defaultValue="suggest" label="Payments">
                                            <MenuItem value="suggest">Suggest Only</MenuItem>
                                            <MenuItem value="auto_review">Auto with Review</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Food Orders</InputLabel>
                                        <Select defaultValue="suggest" label="Food Orders">
                                            <MenuItem value="suggest">Suggest Only</MenuItem>
                                            <MenuItem value="auto_review">Auto with Review</MenuItem>
                                            <MenuItem value="full_auto">Full Auto</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Spending Limits */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Spending Limits
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" gutterBottom>
                                    Per Transaction Limit
                                </Typography>
                                <Slider
                                    defaultValue={50}
                                    min={10}
                                    max={200}
                                    step={10}
                                    marks={[
                                        { value: 10, label: "£10" },
                                        { value: 100, label: "£100" },
                                        { value: 200, label: "£200" },
                                    ]}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `£${value}`}
                                />
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" gutterBottom>
                                    Daily Spending Limit
                                </Typography>
                                <Slider
                                    defaultValue={100}
                                    min={20}
                                    max={500}
                                    step={20}
                                    marks={[
                                        { value: 20, label: "£20" },
                                        { value: 250, label: "£250" },
                                        { value: 500, label: "£500" },
                                    ]}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `£${value}`}
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Monthly Budget"
                                defaultValue="500"
                                size="small"
                                InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1 }}>£</Typography>,
                                }}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Connected Accounts */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Connected Accounts
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Connect your accounts to enable Quinn to act on your behalf.
                            </Alert>
                            {integrationsLoading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    {/* Gmail */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body1" fontWeight={500}>
                                                    Gmail
                                                </Typography>
                                                {isGmailConnected && (
                                                    <Chip label="Connected" color="success" size="small" />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {isGmailConnected
                                                    ? gmailIntegration?.email || "Connected"
                                                    : "Not connected"}
                                            </Typography>
                                        </Box>
                                        {isGmailConnected ? (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="error"
                                                onClick={handleDisconnectGmail}
                                                disabled={disconnectMutation.isPending}
                                            >
                                                {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleConnectGmail}
                                                disabled={gmailAuthMutation.isPending}
                                            >
                                                {gmailAuthMutation.isPending ? "Loading..." : "Connect"}
                                            </Button>
                                        )}
                                    </Box>
                                    <Divider />

                                    {/* Google Calendar */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body1" fontWeight={500}>
                                                    Google Calendar
                                                </Typography>
                                                {isGmailConnected && (
                                                    <Chip label="Connected" color="success" size="small" />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {isGmailConnected
                                                    ? "Uses same Google account as Gmail"
                                                    : "Connect Gmail to enable Calendar"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Divider />

                                    {/* Banking (Plaid) */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body1" fontWeight={500}>
                                                    Banking
                                                </Typography>
                                                {bankConnections && bankConnections.length > 0 && (
                                                    <Chip label="Connected" color="success" size="small" />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {bankConnections && bankConnections.length > 0
                                                    ? `${bankConnections.length} bank(s) connected`
                                                    : "Connect your bank via Plaid"}
                                            </Typography>
                                        </Box>
                                        {bankConnections && bankConnections.length > 0 ? (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="error"
                                                onClick={() => handleDisconnectBank(bankConnections[0].connectionId)}
                                                disabled={disconnectBankMutation.isPending}
                                            >
                                                {disconnectBankMutation.isPending ? "Disconnecting..." : "Disconnect"}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleConnectBank}
                                                disabled={linkTokenMutation.isPending}
                                            >
                                                {linkTokenMutation.isPending ? "Loading..." : "Connect"}
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Save Button */}
                <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                        <Button variant="outlined">Cancel</Button>
                        <Button variant="contained">Save Changes</Button>
                    </Box>
                </Grid>
            </Grid>

            {/* Phone Registration Dialog */}
            <Dialog open={phoneDialogOpen} onClose={() => setPhoneDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    {phoneStep === "enter" ? "Add Phone Number" : "Verify Phone Number"}
                </DialogTitle>
                <DialogContent>
                    {phoneStep === "enter" ? (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Enter your phone number to receive SMS notifications and approve actions via text.
                            </Typography>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                placeholder="+44 7XXX XXXXXX"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                helperText="Include country code (e.g., +44 for UK)"
                            />
                        </Box>
                    ) : (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Enter the 6-digit verification code sent to your phone.
                            </Typography>
                            <TextField
                                fullWidth
                                label="Verification Code"
                                placeholder="123456"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                inputProps={{ maxLength: 6 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPhoneDialogOpen(false)}>Cancel</Button>
                    {phoneStep === "enter" ? (
                        <Button
                            variant="contained"
                            onClick={handleRegisterPhone}
                            disabled={registerPhoneMutation.isPending}
                        >
                            {registerPhoneMutation.isPending ? "Sending..." : "Send Code"}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleVerifyPhone}
                            disabled={verifyPhoneMutation.isPending}
                        >
                            {verifyPhoneMutation.isPending ? "Verifying..." : "Verify"}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
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
