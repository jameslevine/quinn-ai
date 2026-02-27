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
    ListItemAvatar,
    Avatar,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    Stack,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from "@mui/material";
import {
    People as PeopleIcon,
    Event as EventIcon,
    CalendarMonth as CalendarIcon,
    Flight as FlightIcon,
    CardGiftcard as GiftIcon,
    Add as AddIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Cake as CakeIcon,
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import {
    useContacts,
    useSocialEvents,
    useAppointments,
    useTravelPlans,
    useGifts,
    useCreateContact,
    useCreateSocialEvent,
    useCreateAppointment,
    useCreateTravelPlan,
    useCreateGift,
    useDeleteContact,
    useDeleteSocialEvent,
    useDeleteAppointment,
    useDeleteTravelPlan,
    useDeleteGift,
} from "../hooks/useLife";
import type {
    Contact,
    SocialEvent,
    Appointment,
    TravelPlan,
    Gift,
} from "../hooks/useLife";

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

const Life = () => {
    const [tabValue, setTabValue] = useState(0);
    const [addContactOpen, setAddContactOpen] = useState(false);
    const [addEventOpen, setAddEventOpen] = useState(false);
    const [addAppointmentOpen, setAddAppointmentOpen] = useState(false);
    const [addTravelOpen, setAddTravelOpen] = useState(false);
    const [addGiftOpen, setAddGiftOpen] = useState(false);

    // Form states
    const [newContact, setNewContact] = useState<Partial<Contact>>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        relationship: "friend",
        birthday: "",
        tags: [],
    });

    const [newEvent, setNewEvent] = useState<Partial<SocialEvent>>({
        title: "",
        eventType: "dinner",
        date: new Date().toISOString().split("T")[0],
        time: "",
        location: "",
        budget: 0,
        attendees: [],
        reminders: [],
        status: "planned",
    });

    const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
        title: "",
        appointmentType: "doctor",
        provider: "",
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        duration: 30,
        status: "scheduled",
        reminders: [],
    });

    const [newTravel, setNewTravel] = useState<Partial<TravelPlan>>({
        tripName: "",
        destination: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        budget: 0,
        travelers: [],
        flights: [],
        accommodations: [],
        activities: [],
        documents: [],
        status: "planning",
    });

    const [newGift, setNewGift] = useState<Partial<Gift>>({
        recipientName: "",
        occasion: "",
        occasionDate: new Date().toISOString().split("T")[0],
        giftIdea: "",
        budget: 0,
        status: "idea",
    });

    // Queries
    const { data: contacts, isLoading: contactsLoading } = useContacts();
    const { data: events, isLoading: eventsLoading } = useSocialEvents();
    const { data: appointments, isLoading: appointmentsLoading } = useAppointments();
    const { data: travelPlans, isLoading: travelLoading } = useTravelPlans();
    const { data: gifts, isLoading: giftsLoading } = useGifts();

    // Mutations
    const createContact = useCreateContact();
    const createEvent = useCreateSocialEvent();
    const createAppointment = useCreateAppointment();
    const createTravel = useCreateTravelPlan();
    const createGift = useCreateGift();
    const deleteContact = useDeleteContact();
    const deleteEvent = useDeleteSocialEvent();
    const deleteAppointment = useDeleteAppointment();
    const deleteTravel = useDeleteTravelPlan();
    const deleteGift = useDeleteGift();

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
            case "confirmed":
            case "given":
                return "success";
            case "planned":
            case "scheduled":
            case "planning":
            case "idea":
                return "info";
            case "cancelled":
                return "error";
            case "booked":
            case "purchased":
                return "warning";
            default:
                return "default";
        }
    };

    const getRelationshipColor = (relationship: string) => {
        switch (relationship) {
            case "family":
                return "error";
            case "friend":
                return "primary";
            case "colleague":
                return "secondary";
            default:
                return "default";
        }
    };

    // Helper to safely get array data
    const contactsList = Array.isArray(contacts) ? contacts : [];
    const eventsList = Array.isArray(events) ? events : [];
    const appointmentsList = Array.isArray(appointments) ? appointments : [];
    const travelList = Array.isArray(travelPlans) ? travelPlans : [];
    const giftsList = Array.isArray(gifts) ? gifts : [];

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                Life Admin
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Manage contacts, events, appointments, travel, and gifts
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">{contactsList.length}</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Contacts</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <EventIcon color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    {eventsList.filter((e) => e.status !== "completed" && e.status !== "cancelled").length}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Upcoming Events</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <CalendarIcon color="success" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    {appointmentsList.filter((a) => a.status === "scheduled" || a.status === "confirmed").length}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Appointments</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <FlightIcon color="warning" sx={{ mr: 1 }} />
                                <Typography variant="h6">
                                    {travelList.filter((t) => t.status !== "completed" && t.status !== "cancelled").length}
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Travel Plans</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <GiftIcon color="error" sx={{ mr: 1 }} />
                                <Typography variant="h6">{giftsList.filter((g) => g.status !== "given").length}</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">Pending Gifts</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                    <Tab label="Contacts" icon={<PeopleIcon />} iconPosition="start" />
                    <Tab label="Events" icon={<EventIcon />} iconPosition="start" />
                    <Tab label="Appointments" icon={<CalendarIcon />} iconPosition="start" />
                    <Tab label="Travel" icon={<FlightIcon />} iconPosition="start" />
                    <Tab label="Gifts" icon={<GiftIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Contacts Tab */}
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Your Contacts</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddContactOpen(true)}>
                        Add Contact
                    </Button>
                </Box>

                {contactsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                ) : contactsList.length > 0 ? (
                    <Grid container spacing={2}>
                        {contactsList.map((contact) => (
                            <Grid item xs={12} sm={6} md={4} key={contact.contactId}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                                                {contact.firstName[0]}{contact.lastName[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1">{contact.firstName} {contact.lastName}</Typography>
                                                <Chip label={contact.relationship} size="small" color={getRelationshipColor(contact.relationship) as "primary" | "secondary" | "error" | "default"} />
                                            </Box>
                                        </Box>
                                        {contact.email && (
                                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                <EmailIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                                <Typography variant="body2">{contact.email}</Typography>
                                            </Box>
                                        )}
                                        {contact.phone && (
                                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                <PhoneIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                                <Typography variant="body2">{contact.phone}</Typography>
                                            </Box>
                                        )}
                                        {contact.birthday && (
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <CakeIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                                <Typography variant="body2">{contact.birthday}</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                    <CardActions>
                                        <IconButton size="small" color="error" onClick={() => deleteContact.mutate(contact.contactId)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">No contacts yet. Add your first contact to get started!</Alert>
                )}
            </TabPanel>

            {/* Events Tab */}
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Social Events</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddEventOpen(true)}>
                        Add Event
                    </Button>
                </Box>

                {eventsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                ) : eventsList.length > 0 ? (
                    <Grid container spacing={2}>
                        {eventsList.map((event) => (
                            <Grid item xs={12} md={6} key={event.eventId}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                            <Typography variant="h6">{event.title}</Typography>
                                            <Chip label={event.status} size="small" color={getStatusColor(event.status) as "success" | "info" | "error" | "warning" | "default"} />
                                        </Box>
                                        <Chip label={event.eventType.replace("_", " ")} size="small" variant="outlined" sx={{ mb: 2 }} />
                                        <Stack spacing={1}>
                                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                                <CalendarIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                                <Typography variant="body2">{event.date} {event.time && `at ${event.time}`}</Typography>
                                            </Box>
                                            {event.location && (
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <LocationIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                                    <Typography variant="body2">{event.location}</Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </CardContent>
                                    <CardActions>
                                        <IconButton size="small" color="error" onClick={() => deleteEvent.mutate(event.eventId)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">No events yet. Plan your first social event!</Alert>
                )}
            </TabPanel>

            {/* Appointments Tab */}
            <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Appointments</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddAppointmentOpen(true)}>
                        Add Appointment
                    </Button>
                </Box>

                {appointmentsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                ) : appointmentsList.length > 0 ? (
                    <List>
                        {appointmentsList.map((apt) => (
                            <Paper key={apt.appointmentId} sx={{ mb: 2 }}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton edge="end" color="error" onClick={() => deleteAppointment.mutate(apt.appointmentId)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "primary.main" }}><CalendarIcon /></Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="subtitle1">{apt.title}</Typography>
                                                <Chip label={apt.status} size="small" color={getStatusColor(apt.status) as "success" | "info" | "error" | "warning" | "default"} />
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                    {apt.date}
                                                </Box>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                    {apt.time}
                                                </Box>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            </Paper>
                        ))}
                    </List>
                ) : (
                    <Alert severity="info">No appointments yet. Schedule your first appointment!</Alert>
                )}
            </TabPanel>

            {/* Travel Tab */}
            <TabPanel value={tabValue} index={3}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Travel Plans</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddTravelOpen(true)}>
                        Plan Trip
                    </Button>
                </Box>

                {travelLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                ) : travelList.length > 0 ? (
                    <Grid container spacing={3}>
                        {travelList.map((trip) => (
                            <Grid item xs={12} md={6} key={trip.travelPlanId}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                            <Typography variant="h6">{trip.tripName}</Typography>
                                            <Chip label={trip.status} size="small" color={getStatusColor(trip.status) as "success" | "info" | "error" | "warning" | "default"} />
                                        </Box>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                            <LocationIcon sx={{ mr: 1, color: "text.secondary" }} />
                                            <Typography variant="body1">{trip.destination}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {trip.startDate} - {trip.endDate}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <IconButton size="small" color="error" onClick={() => deleteTravel.mutate(trip.travelPlanId)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">No travel plans yet. Start planning your next adventure!</Alert>
                )}
            </TabPanel>

            {/* Gifts Tab */}
            <TabPanel value={tabValue} index={4}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Typography variant="h6">Gift Ideas & Tracking</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddGiftOpen(true)}>
                        Add Gift
                    </Button>
                </Box>

                {giftsLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
                ) : giftsList.length > 0 ? (
                    <Grid container spacing={2}>
                        {giftsList.map((gift) => (
                            <Grid item xs={12} sm={6} md={4} key={gift.giftId}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                                            <Typography variant="subtitle1">{gift.recipientName}</Typography>
                                            <Chip label={gift.status} size="small" color={getStatusColor(gift.status) as "success" | "info" | "error" | "warning" | "default"} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {gift.occasion} - {gift.occasionDate}
                                        </Typography>
                                        {gift.giftIdea && <Typography variant="body2">Idea: {gift.giftIdea}</Typography>}
                                    </CardContent>
                                    <CardActions>
                                        <IconButton size="small" color="error" onClick={() => deleteGift.mutate(gift.giftId)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">No gifts tracked yet. Add gift ideas for upcoming occasions!</Alert>
                )}
            </TabPanel>

            {/* Add Contact Dialog */}
            <Dialog open={addContactOpen} onClose={() => setAddContactOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField label="First Name" fullWidth value={newContact.firstName || ""} onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Last Name" fullWidth value={newContact.lastName || ""} onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Email" type="email" fullWidth value={newContact.email || ""} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Phone" fullWidth value={newContact.phone || ""} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Relationship</InputLabel>
                                <Select value={newContact.relationship || "friend"} label="Relationship" onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value as Contact["relationship"] })}>
                                    <MenuItem value="friend">Friend</MenuItem>
                                    <MenuItem value="family">Family</MenuItem>
                                    <MenuItem value="colleague">Colleague</MenuItem>
                                    <MenuItem value="acquaintance">Acquaintance</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Birthday" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newContact.birthday || ""} onChange={(e) => setNewContact({ ...newContact, birthday: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddContactOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { createContact.mutate(newContact as Omit<Contact, "contactId" | "userId" | "createdAt" | "updatedAt">); setAddContactOpen(false); }} disabled={!newContact.firstName || !newContact.lastName}>Add Contact</Button>
                </DialogActions>
            </Dialog>

            {/* Add Event Dialog */}
            <Dialog open={addEventOpen} onClose={() => setAddEventOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Social Event</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField label="Event Title" fullWidth value={newEvent.title || ""} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Event Type</InputLabel>
                                <Select value={newEvent.eventType || "dinner"} label="Event Type" onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as SocialEvent["eventType"] })}>
                                    <MenuItem value="date_night">Date Night</MenuItem>
                                    <MenuItem value="dinner">Dinner</MenuItem>
                                    <MenuItem value="party">Party</MenuItem>
                                    <MenuItem value="meetup">Meetup</MenuItem>
                                    <MenuItem value="birthday">Birthday</MenuItem>
                                    <MenuItem value="anniversary">Anniversary</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newEvent.date || ""} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={newEvent.time || ""} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Location" fullWidth value={newEvent.location || ""} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddEventOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { createEvent.mutate(newEvent as Omit<SocialEvent, "eventId" | "userId" | "createdAt" | "updatedAt">); setAddEventOpen(false); }} disabled={!newEvent.title}>Add Event</Button>
                </DialogActions>
            </Dialog>

            {/* Add Appointment Dialog */}
            <Dialog open={addAppointmentOpen} onClose={() => setAddAppointmentOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Appointment</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField label="Title" fullWidth value={newAppointment.title || ""} onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select value={newAppointment.appointmentType || "doctor"} label="Type" onChange={(e) => setNewAppointment({ ...newAppointment, appointmentType: e.target.value as Appointment["appointmentType"] })}>
                                    <MenuItem value="doctor">Doctor</MenuItem>
                                    <MenuItem value="dentist">Dentist</MenuItem>
                                    <MenuItem value="car_service">Car Service</MenuItem>
                                    <MenuItem value="home_repair">Home Repair</MenuItem>
                                    <MenuItem value="haircut">Haircut</MenuItem>
                                    <MenuItem value="vet">Vet</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Provider" fullWidth value={newAppointment.provider || ""} onChange={(e) => setNewAppointment({ ...newAppointment, provider: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newAppointment.date || ""} onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Time" type="time" fullWidth InputLabelProps={{ shrink: true }} value={newAppointment.time || ""} onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddAppointmentOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { createAppointment.mutate(newAppointment as Omit<Appointment, "appointmentId" | "userId" | "createdAt" | "updatedAt">); setAddAppointmentOpen(false); }} disabled={!newAppointment.title}>Add Appointment</Button>
                </DialogActions>
            </Dialog>

            {/* Add Travel Dialog */}
            <Dialog open={addTravelOpen} onClose={() => setAddTravelOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Plan New Trip</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField label="Trip Name" fullWidth value={newTravel.tripName || ""} onChange={(e) => setNewTravel({ ...newTravel, tripName: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Destination" fullWidth value={newTravel.destination || ""} onChange={(e) => setNewTravel({ ...newTravel, destination: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newTravel.startDate || ""} onChange={(e) => setNewTravel({ ...newTravel, startDate: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newTravel.endDate || ""} onChange={(e) => setNewTravel({ ...newTravel, endDate: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Budget (£)" type="number" fullWidth value={newTravel.budget || 0} onChange={(e) => setNewTravel({ ...newTravel, budget: parseInt(e.target.value) || 0 })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddTravelOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { createTravel.mutate(newTravel as Omit<TravelPlan, "travelPlanId" | "userId" | "createdAt" | "updatedAt">); setAddTravelOpen(false); }} disabled={!newTravel.tripName || !newTravel.destination}>Plan Trip</Button>
                </DialogActions>
            </Dialog>

            {/* Add Gift Dialog */}
            <Dialog open={addGiftOpen} onClose={() => setAddGiftOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Gift Idea</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField label="Recipient Name" fullWidth value={newGift.recipientName || ""} onChange={(e) => setNewGift({ ...newGift, recipientName: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Occasion" fullWidth value={newGift.occasion || ""} onChange={(e) => setNewGift({ ...newGift, occasion: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField label="Occasion Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newGift.occasionDate || ""} onChange={(e) => setNewGift({ ...newGift, occasionDate: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Gift Idea" fullWidth value={newGift.giftIdea || ""} onChange={(e) => setNewGift({ ...newGift, giftIdea: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Budget (£)" type="number" fullWidth value={newGift.budget || 0} onChange={(e) => setNewGift({ ...newGift, budget: parseInt(e.target.value) || 0 })} />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddGiftOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => { createGift.mutate(newGift as Omit<Gift, "giftId" | "userId" | "createdAt" | "updatedAt">); setAddGiftOpen(false); }} disabled={!newGift.recipientName || !newGift.occasion}>Add Gift</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Life;
