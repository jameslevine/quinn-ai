import { useState, useRef, useEffect } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Drawer,
    AppBar,
    Toolbar,
    Divider,
    CircularProgress,
    Chip,
    Card,
    CardContent,
    Button,
    Alert,
} from "@mui/material";
import {
    Send as SendIcon,
    Add as AddIcon,
    Menu as MenuIcon,
    Delete as DeleteIcon,
    SmartToy as BotIcon,
    Person as PersonIcon,
} from "@mui/icons-material";
import {
    useConversations,
    useConversation,
    useCreateConversation,
    useSendMessage,
    useDeleteConversation,
} from "../hooks/useChat";
import type { ChatMessage, SuggestedAction, Conversation } from "../hooks/useChat";
import { useCreateAction } from "../hooks/useActions";

const DRAWER_WIDTH = 280;

const Chat = () => {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Queries and mutations
    const { data: conversationsData, isLoading: loadingConversations } = useConversations();
    const { data: currentConversation, isLoading: loadingConversation } =
        useConversation(selectedConversationId);
    const createConversation = useCreateConversation();
    const sendMessage = useSendMessage(selectedConversationId || "");
    const deleteConversation = useDeleteConversation();
    const createAction = useCreateAction();

    const conversations = conversationsData?.conversations || [];
    const messages = currentConversation?.messages || [];

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNewConversation = async () => {
        try {
            const result = await createConversation.mutateAsync({});
            setSelectedConversationId(result.conversation.conversationId);
            setMobileOpen(false);
        } catch (error) {
            console.error("Failed to create conversation:", error);
        }
    };

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId);
        setMobileOpen(false);
    };

    const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteConversation.mutateAsync(conversationId);
            if (selectedConversationId === conversationId) {
                setSelectedConversationId(null);
            }
        } catch (error) {
            console.error("Failed to delete conversation:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const messageToSend = inputMessage;
        setInputMessage("");

        try {
            if (!selectedConversationId) {
                // Create new conversation with initial message
                const result = await createConversation.mutateAsync({ message: messageToSend });
                setSelectedConversationId(result.conversation.conversationId);
            } else {
                // Send message to existing conversation
                await sendMessage.mutateAsync(messageToSend);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            setInputMessage(messageToSend); // Restore message on error
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCreateActionFromSuggestion = async (suggestion: SuggestedAction) => {
        try {
            await createAction.mutateAsync({
                type: suggestion.type,
                title: suggestion.title,
                description: suggestion.description,
            });
        } catch (error) {
            console.error("Failed to create action:", error);
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Toolbar>
                <Typography variant="h6" noWrap>
                    Conversations
                </Typography>
            </Toolbar>
            <Divider />
            <Box sx={{ p: 1 }}>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewConversation}
                    disabled={createConversation.isPending}
                >
                    New Chat
                </Button>
            </Box>
            <Divider />
            <List sx={{ flex: 1, overflow: "auto" }}>
                {loadingConversations ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : conversations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                        No conversations yet
                    </Typography>
                ) : (
                    conversations.map((conv: Conversation) => (
                        <ListItem
                            key={conv.conversationId}
                            disablePadding
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={(e) => handleDeleteConversation(conv.conversationId, e)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            }
                        >
                            <ListItemButton
                                selected={selectedConversationId === conv.conversationId}
                                onClick={() => handleSelectConversation(conv.conversationId)}
                            >
                                <ListItemText
                                    primary={conv.title || "New Conversation"}
                                    secondary={`${conv.messageCount} messages`}
                                    primaryTypographyProps={{ noWrap: true }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))
                )}
            </List>
        </Box>
    );

    const renderMessage = (message: ChatMessage) => {
        const isUser = message.role === "user";

        return (
            <Box
                key={message.messageId}
                sx={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    mb: 2,
                }}
            >
                <Box
                    sx={{
                        maxWidth: "70%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isUser ? "flex-end" : "flex-start",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        {!isUser && <BotIcon sx={{ mr: 1, color: "primary.main" }} fontSize="small" />}
                        <Typography variant="caption" color="text.secondary">
                            {isUser ? "You" : "Quinn"} • {formatTime(message.timestamp)}
                        </Typography>
                        {isUser && <PersonIcon sx={{ ml: 1, color: "text.secondary" }} fontSize="small" />}
                    </Box>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            bgcolor: isUser ? "primary.main" : "background.paper",
                            color: isUser ? "primary.contrastText" : "text.primary",
                            borderRadius: 2,
                        }}
                    >
                        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                            {message.content}
                        </Typography>
                    </Paper>

                    {/* Suggested Actions */}
                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {message.suggestedActions.map((suggestion, index) => (
                                <Card key={index} variant="outlined" sx={{ maxWidth: 300 }}>
                                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                            <Chip
                                                label={suggestion.type}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ mr: 1 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {Math.round(suggestion.confidence * 100)}% confident
                                            </Typography>
                                        </Box>
                                        <Typography variant="subtitle2">{suggestion.title}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {suggestion.description}
                                        </Typography>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => handleCreateActionFromSuggestion(suggestion)}
                                            disabled={createAction.isPending}
                                        >
                                            Create Action
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
                }}
            >
                {drawer}
            </Drawer>

            {/* Desktop drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: "none", md: "block" },
                    "& .MuiDrawer-paper": {
                        width: DRAWER_WIDTH,
                        position: "relative",
                        height: "100%",
                    },
                }}
                open
            >
                {drawer}
            </Drawer>

            {/* Main chat area */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Mobile app bar */}
                <AppBar
                    position="static"
                    color="default"
                    elevation={0}
                    sx={{ display: { md: "none" }, borderBottom: 1, borderColor: "divider" }}
                >
                    <Toolbar>
                        <IconButton edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap>
                            {currentConversation?.title || "Quinn AI"}
                        </Typography>
                    </Toolbar>
                </AppBar>

                {/* Messages area */}
                <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                    {loadingConversation ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                            <CircularProgress />
                        </Box>
                    ) : messages.length === 0 ? (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                                textAlign: "center",
                            }}
                        >
                            <BotIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
                            <Typography variant="h5" gutterBottom>
                                Hi, I'm Quinn!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                                Your AI personal assistant. I can help you manage tasks, draft emails, schedule
                                appointments, and more. How can I help you today?
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {messages.map(renderMessage)}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </Box>

                {/* Input area */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
                    {(sendMessage.isPending || createConversation.isPending) && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Quinn is thinking...
                        </Alert>
                    )}
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={4}
                            placeholder="Type your message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={sendMessage.isPending || createConversation.isPending}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 3,
                                },
                            }}
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || sendMessage.isPending || createConversation.isPending}
                            sx={{
                                bgcolor: "primary.main",
                                color: "white",
                                "&:hover": { bgcolor: "primary.dark" },
                                "&:disabled": { bgcolor: "action.disabledBackground" },
                            }}
                        >
                            {sendMessage.isPending || createConversation.isPending ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                <SendIcon />
                            )}
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default Chat;
