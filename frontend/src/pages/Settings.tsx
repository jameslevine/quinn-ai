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
} from "@mui/material";
import { useStore } from "../store";

export default function Settings() {
    const { isDarkMode, toggleDarkMode } = useStore();

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
                                control={
                                    <Switch checked={isDarkMode} onChange={toggleDarkMode} />
                                }
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
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Notifications
                            </Typography>
                            <FormControlLabel
                                control={<Switch defaultChecked />}
                                label="Email Notifications"
                            />
                            <FormControlLabel
                                control={<Switch defaultChecked />}
                                label="Push Notifications"
                            />
                            <FormControlLabel
                                control={<Switch />}
                                label="SMS Notifications"
                            />
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
                                            <MenuItem value="auto_review">
                                                Auto with Review
                                            </MenuItem>
                                            <MenuItem value="full_auto">Full Auto</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Phone Calls</InputLabel>
                                        <Select defaultValue="suggest" label="Phone Calls">
                                            <MenuItem value="suggest">Suggest Only</MenuItem>
                                            <MenuItem value="auto_review">
                                                Auto with Review
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Payments</InputLabel>
                                        <Select defaultValue="suggest" label="Payments">
                                            <MenuItem value="suggest">Suggest Only</MenuItem>
                                            <MenuItem value="auto_review">
                                                Auto with Review
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Food Orders</InputLabel>
                                        <Select defaultValue="suggest" label="Food Orders">
                                            <MenuItem value="suggest">Suggest Only</MenuItem>
                                            <MenuItem value="auto_review">
                                                Auto with Review
                                            </MenuItem>
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
                                    startAdornment: (
                                        <Typography sx={{ mr: 1 }}>£</Typography>
                                    ),
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
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body1" fontWeight={500}>
                                            Gmail
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Not connected
                                        </Typography>
                                    </Box>
                                    <Button variant="outlined" size="small">
                                        Connect
                                    </Button>
                                </Box>
                                <Divider />
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body1" fontWeight={500}>
                                            Bank Account
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Not connected
                                        </Typography>
                                    </Box>
                                    <Button variant="outlined" size="small">
                                        Connect
                                    </Button>
                                </Box>
                                <Divider />
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body1" fontWeight={500}>
                                            Google Calendar
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Not connected
                                        </Typography>
                                    </Box>
                                    <Button variant="outlined" size="small">
                                        Connect
                                    </Button>
                                </Box>
                            </Box>
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
        </Box>
    );
}
