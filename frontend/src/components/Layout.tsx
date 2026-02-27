import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    Badge,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    PlayArrow as ActionsIcon,
    CheckCircle as ApprovalsIcon,
    Email as EmailIcon,
    AccountBalance as BankingIcon,
    Restaurant as FoodIcon,
    EventNote as LifeIcon,
    SmartToy as ChatIcon,
    Phone as CallsIcon,
    CalendarMonth as CalendarIcon,
    Settings as SettingsIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Notifications as NotificationsIcon,
    Logout as LogoutIcon,
} from "@mui/icons-material";
import { useStore } from "../store";

const DRAWER_WIDTH = 260;

interface LayoutProps {
    user: { username: string; userId: string } | undefined;
    signOut: (() => void) | undefined;
}

const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Chat with Quinn", icon: <ChatIcon />, path: "/chat" },
    { text: "Actions", icon: <ActionsIcon />, path: "/actions" },
    { text: "Approvals", icon: <ApprovalsIcon />, path: "/approvals" },
    { text: "Emails", icon: <EmailIcon />, path: "/emails" },
    { text: "Calendar", icon: <CalendarIcon />, path: "/calendar" },
    { text: "Banking", icon: <BankingIcon />, path: "/banking" },
    { text: "Food", icon: <FoodIcon />, path: "/food" },
    { text: "Life", icon: <LifeIcon />, path: "/life" },
    { text: "Phone Calls", icon: <CallsIcon />, path: "/calls" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Layout({ user, signOut }: LayoutProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode, toggleDarkMode, sidebarOpen, setSidebarOpen, pendingActions } =
        useStore();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleDrawerToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        signOut?.();
    };

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Toolbar sx={{ justifyContent: "center", py: 2 }}>
                <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" component="div" sx={{ fontSize: "2.5rem" }}>
                        🤖
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        Quinn
                    </Typography>
                </Box>
            </Toolbar>
            <Divider />
            <List sx={{ flex: 1, px: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setSidebarOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                "&.Mui-selected": {
                                    backgroundColor: "primary.main",
                                    color: "white",
                                    "&:hover": {
                                        backgroundColor: "primary.dark",
                                    },
                                    "& .MuiListItemIcon-root": {
                                        color: "white",
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                            {item.text === "Approvals" && pendingActions.length > 0 && (
                                <Badge badgeContent={pendingActions.length} color="error" />
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Quinn AI v0.1.0
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
                    ml: { md: `${sidebarOpen ? DRAWER_WIDTH : 0}px` },
                    backgroundColor: "background.paper",
                    color: "text.primary",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find((item) => item.path === location.pathname)?.text ||
                            "Dashboard"}
                    </Typography>
                    <IconButton color="inherit" onClick={toggleDarkMode} sx={{ mr: 1 }}>
                        {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                    <IconButton color="inherit" sx={{ mr: 1 }}>
                        <Badge badgeContent={pendingActions.length} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    <IconButton onClick={handleMenuOpen}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.username}</Typography>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => navigate("/settings")}>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            Settings
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { md: sidebarOpen ? DRAWER_WIDTH : 0 }, flexShrink: 0 }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={isMobile && sidebarOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: "block", md: "none" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: DRAWER_WIDTH,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                {/* Desktop drawer */}
                <Drawer
                    variant="persistent"
                    open={sidebarOpen}
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: DRAWER_WIDTH,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { md: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` },
                    mt: "64px",
                    backgroundColor: "background.default",
                    minHeight: "calc(100vh - 64px)",
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
