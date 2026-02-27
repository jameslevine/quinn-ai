import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Stack,
    Tooltip,
} from "@mui/material";
import {
    CalendarMonth as CalendarIcon,
    Add as AddIcon,
    Event as EventIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    People as PeopleIcon,
    Delete as DeleteIcon,
    OpenInNew as OpenInNewIcon,
    Today as TodayIcon,
    DateRange as DateRangeIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";
import {
    useTodayEvents,
    useUpcomingEvents,
    useCreateEvent,
    useQuickAddEvent,
    useDeleteEvent,
    formatEventTime,
    formatEventDate,
    getEventColor,
    isAllDayEvent,
    type CalendarEvent,
} from "../hooks/useCalendar";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

export default function Calendar() {
    const [tabValue, setTabValue] = useState(0);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [createEventOpen, setCreateEventOpen] = useState(false);
    const [quickAddText, setQuickAddText] = useState("");
    const [newEvent, setNewEvent] = useState({
        summary: "",
        description: "",
        location: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        allDay: false,
    });

    const { data: todayEvents, isLoading: loadingToday, error: todayError } = useTodayEvents();
    const {
        data: upcomingEvents,
        isLoading: loadingUpcoming,
        error: upcomingError,
    } = useUpcomingEvents(7);

    const quickAddMutation = useQuickAddEvent();
    const createEventMutation = useCreateEvent();
    const deleteEventMutation = useDeleteEvent();

    const handleQuickAdd = async () => {
        if (!quickAddText.trim()) return;

        try {
            await quickAddMutation.mutateAsync({ text: quickAddText });
            setQuickAddText("");
            setQuickAddOpen(false);
        } catch (error) {
            console.error("Error quick adding event:", error);
        }
    };

    const handleCreateEvent = async () => {
        if (!newEvent.summary.trim()) return;

        try {
            // Get local timezone
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const event: Omit<CalendarEvent, "id"> = {
                summary: newEvent.summary,
                description: newEvent.description || undefined,
                location: newEvent.location || undefined,
                start: newEvent.allDay
                    ? { date: newEvent.startDate }
                    : {
                        dateTime: new Date(`${newEvent.startDate}T${newEvent.startTime}`).toISOString(),
                        timeZone,
                    },
                end: newEvent.allDay
                    ? { date: newEvent.endDate || newEvent.startDate }
                    : {
                        dateTime: new Date(
                            `${newEvent.endDate || newEvent.startDate}T${newEvent.endTime || newEvent.startTime}`
                        ).toISOString(),
                        timeZone,
                    },
            };

            await createEventMutation.mutateAsync({ event });
            setNewEvent({
                summary: "",
                description: "",
                location: "",
                startDate: "",
                startTime: "",
                endDate: "",
                endTime: "",
                allDay: false,
            });
            setCreateEventOpen(false);
        } catch (error) {
            console.error("Error creating event:", error);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            await deleteEventMutation.mutateAsync({ eventId });
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const renderEventCard = (event: CalendarEvent) => (
        <Card
            key={event.id}
            sx={{
                mb: 2,
                borderLeft: 4,
                borderColor: getEventColor(event),
            }}
        >
            <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                            {event.summary}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}>
                            <Chip
                                icon={<TodayIcon />}
                                label={formatEventDate(event)}
                                size="small"
                                variant="outlined"
                            />
                            <Chip
                                icon={<TimeIcon />}
                                label={formatEventTime(event)}
                                size="small"
                                variant="outlined"
                            />
                            {isAllDayEvent(event) && <Chip label="All Day" size="small" color="primary" />}
                        </Stack>

                        {event.location && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                                <LocationIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {event.location}
                                </Typography>
                            </Box>
                        )}

                        {event.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {event.description}
                            </Typography>
                        )}

                        {event.attendees && event.attendees.length > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                                <PeopleIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Box>
                        {event.htmlLink && (
                            <Tooltip title="Open in Google Calendar">
                                <IconButton
                                    size="small"
                                    onClick={() => window.open(event.htmlLink, "_blank")}
                                    color="primary"
                                >
                                    <OpenInNewIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Delete event">
                            <IconButton
                                size="small"
                                onClick={() => event.id && handleDeleteEvent(event.id)}
                                color="error"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const renderEventList = (events: CalendarEvent[] | undefined, loading: boolean, error: Error | null) => {
        if (loading) {
            return (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            const errorMessage = error?.message || "Failed to load events";
            const needsAuth = errorMessage.toLowerCase().includes("not connected") ||
                errorMessage.toLowerCase().includes("please connect") ||
                errorMessage.toLowerCase().includes("reconnect");

            return (
                <Alert
                    severity={needsAuth ? "warning" : "error"}
                    sx={{ mb: 2 }}
                >
                    <Box>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                            {needsAuth
                                ? "Google Calendar Not Connected"
                                : "Error Loading Events"}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {needsAuth
                                ? "To use Calendar features, you need to connect your Google account with Calendar permissions. If you've already connected Gmail, you may need to reconnect to grant Calendar access."
                                : errorMessage}
                        </Typography>
                        {needsAuth && (
                            <Button
                                variant="contained"
                                size="small"
                                href="/settings"
                                sx={{ mt: 1 }}
                            >
                                Go to Settings to Connect
                            </Button>
                        )}
                    </Box>
                </Alert>
            );
        }

        if (!events || events.length === 0) {
            return (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                    <EventIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No events found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Your calendar is clear!
                    </Typography>
                </Paper>
            );
        }

        return events.map(renderEventCard);
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CalendarIcon sx={{ fontSize: 32, color: "primary.main" }} />
                    <Typography variant="h4">Calendar</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="outlined" startIcon={<ScheduleIcon />} onClick={() => setQuickAddOpen(true)}>
                        Quick Add
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateEventOpen(true)}>
                        New Event
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tab icon={<TodayIcon />} label="Today" iconPosition="start" />
                    <Tab icon={<DateRangeIcon />} label="Upcoming (7 days)" iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 2 }}>
                    <TabPanel value={tabValue} index={0}>
                        {renderEventList(todayEvents, loadingToday, todayError)}
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        {renderEventList(upcomingEvents, loadingUpcoming, upcomingError)}
                    </TabPanel>
                </Box>
            </Paper>

            {/* Quick Add Dialog */}
            <Dialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Quick Add Event</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Type your event in natural language, e.g., "Meeting with John tomorrow at 3pm"
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Event description"
                        value={quickAddText}
                        onChange={(e) => setQuickAddText(e.target.value)}
                        placeholder="Lunch with Sarah on Friday at noon"
                        onKeyPress={(e) => e.key === "Enter" && handleQuickAdd()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQuickAddOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleQuickAdd}
                        variant="contained"
                        disabled={!quickAddText.trim() || quickAddMutation.isPending}
                    >
                        {quickAddMutation.isPending ? "Adding..." : "Add Event"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Event Dialog */}
            <Dialog open={createEventOpen} onClose={() => setCreateEventOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Event title"
                            value={newEvent.summary}
                            onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            multiline
                            rows={2}
                        />
                        <TextField
                            fullWidth
                            label="Location"
                            value={newEvent.location}
                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                        />
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                type="date"
                                value={newEvent.startDate}
                                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                            {!newEvent.allDay && (
                                <TextField
                                    fullWidth
                                    label="Start Time"
                                    type="time"
                                    value={newEvent.startTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <TextField
                                fullWidth
                                label="End Date"
                                type="date"
                                value={newEvent.endDate}
                                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                            {!newEvent.allDay && (
                                <TextField
                                    fullWidth
                                    label="End Time"
                                    type="time"
                                    value={newEvent.endTime}
                                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateEventOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateEvent}
                        variant="contained"
                        disabled={!newEvent.summary.trim() || !newEvent.startDate || createEventMutation.isPending}
                    >
                        {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
