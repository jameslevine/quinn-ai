import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Divider,
    Stack,
    Tooltip,
} from "@mui/material";
import {
    Email as EmailIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Archive as ArchiveIcon,
    Send as SendIcon,
    Create as ComposeIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon,
    Inbox as InboxIcon,
} from "@mui/icons-material";
import { useEmails, useSendEmail, useMarkAsRead, useArchiveEmail, useDeleteEmail, type Email } from "../hooks/useEmails";
import { useIntegrations } from "../hooks/useIntegrations";

const Emails = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });

    // Check if Gmail is connected
    const { data: integrations, isLoading: integrationsLoading } = useIntegrations();
    const gmailIntegration = integrations?.find((i) => i.type === "gmail");
    const isGmailConnected = gmailIntegration?.status === "connected";

    // Fetch emails
    const { data: emails, isLoading: emailsLoading, error: emailsError, refetch } = useEmails({
        maxResults: 20,
        query: searchQuery || undefined,
    });

    // Mutations
    const sendEmail = useSendEmail();
    const markAsRead = useMarkAsRead();
    const archiveEmail = useArchiveEmail();
    const deleteEmail = useDeleteEmail();

    const handleRefresh = () => {
        refetch();
    };

    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
        if (!email.isRead) {
            markAsRead.mutate(email.id);
        }
    };

    const handleArchive = (email: Email) => {
        archiveEmail.mutate(email.id);
        if (selectedEmail?.id === email.id) {
            setSelectedEmail(null);
        }
    };

    const handleDelete = (email: Email) => {
        deleteEmail.mutate(email.id);
        if (selectedEmail?.id === email.id) {
            setSelectedEmail(null);
        }
    };

    const handleCompose = () => {
        setComposeData({ to: "", subject: "", body: "" });
        setComposeOpen(true);
    };

    const handleSend = async () => {
        if (!composeData.to || !composeData.subject || !composeData.body) return;

        try {
            await sendEmail.mutateAsync(composeData);
            setComposeOpen(false);
            setComposeData({ to: "", subject: "", body: "" });
        } catch (error) {
            console.error("Failed to send email:", error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const extractSenderName = (from: string) => {
        const match = from.match(/^([^<]+)/);
        return match ? match[1].trim() : from;
    };

    if (integrationsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!isGmailConnected) {
        return (
            <Box>
                <Typography variant="h4" gutterBottom>
                    Emails
                </Typography>
                <Alert severity="info" sx={{ mt: 2 }}>
                    Gmail is not connected. Please go to{" "}
                    <a href="/settings" style={{ color: "inherit" }}>
                        Settings
                    </a>{" "}
                    to connect your Gmail account.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Emails</Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        startIcon={<ComposeIcon />}
                        onClick={handleCompose}
                    >
                        Compose
                    </Button>
                    <IconButton onClick={handleRefresh} disabled={emailsLoading}>
                        <RefreshIcon />
                    </IconButton>
                </Stack>
            </Box>

            {/* Search */}
            <TextField
                fullWidth
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 3 }}
            />

            {emailsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load emails: {emailsError.message}
                </Alert>
            )}

            <Box display="flex" gap={2} sx={{ height: "calc(100vh - 300px)" }}>
                {/* Email List */}
                <Paper sx={{ flex: 1, overflow: "auto" }}>
                    {emailsLoading ? (
                        <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress />
                        </Box>
                    ) : emails && emails.length > 0 ? (
                        <List disablePadding>
                            {emails.map((email, index) => (
                                <Box key={email.id}>
                                    <ListItem
                                        button
                                        selected={selectedEmail?.id === email.id}
                                        onClick={() => handleEmailClick(email)}
                                        sx={{
                                            bgcolor: !email.isRead ? "action.hover" : "transparent",
                                            "&:hover": { bgcolor: "action.selected" },
                                        }}
                                    >
                                        <ListItemIcon>
                                            {email.isStarred ? (
                                                <StarIcon color="warning" />
                                            ) : (
                                                <StarBorderIcon />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={!email.isRead ? 700 : 400}
                                                        noWrap
                                                        sx={{ maxWidth: "150px" }}
                                                    >
                                                        {extractSenderName(email.from)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(email.date)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={!email.isRead ? 600 : 400}
                                                        noWrap
                                                    >
                                                        {email.subject}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        noWrap
                                                        component="div"
                                                    >
                                                        {email.snippet}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < emails.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    ) : (
                        <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                            <InboxIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography color="text.secondary">No emails found</Typography>
                        </Box>
                    )}
                </Paper>

                {/* Email Detail */}
                <Paper sx={{ flex: 2, overflow: "auto", p: 3 }}>
                    {selectedEmail ? (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Typography variant="h5">{selectedEmail.subject}</Typography>
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Archive">
                                        <IconButton onClick={() => handleArchive(selectedEmail)}>
                                            <ArchiveIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => handleDelete(selectedEmail)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">
                                    From: {selectedEmail.from}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    To: {selectedEmail.to}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Date: {new Date(selectedEmail.date).toLocaleString()}
                                </Typography>
                            </Box>

                            <Box display="flex" gap={1} mb={2}>
                                {selectedEmail.labelIds.map((label) => (
                                    <Chip key={label} label={label} size="small" variant="outlined" />
                                ))}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box
                                sx={{
                                    "& a": { color: "primary.main" },
                                    "& img": { maxWidth: "100%" },
                                }}
                                dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.snippet }}
                            />
                        </Box>
                    ) : (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                            <EmailIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                            <Typography color="text.secondary">Select an email to read</Typography>
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* Compose Dialog */}
            <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Compose Email</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="To"
                            fullWidth
                            value={composeData.to}
                            onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                            placeholder="recipient@example.com"
                        />
                        <TextField
                            label="Subject"
                            fullWidth
                            value={composeData.subject}
                            onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                        />
                        <TextField
                            label="Message"
                            fullWidth
                            multiline
                            rows={10}
                            value={composeData.body}
                            onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={handleSend}
                        disabled={!composeData.to || !composeData.subject || !composeData.body || sendEmail.isPending}
                    >
                        {sendEmail.isPending ? "Sending..." : "Send"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Emails;
