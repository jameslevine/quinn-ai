import { useState, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    LinearProgress,
} from "@mui/material";
import {
    AccountBalance as BankIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Sync as SyncIcon,
    TrendingUp as IncomeIcon,
    TrendingDown as ExpenseIcon,
    AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { usePlaidLink } from "react-plaid-link";
import type { PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import {
    useBankConnections,
    useBankAccounts,
    useTransactions,
    useSpendingSummary,
    useLinkToken,
    useConnectBank,
    useDisconnectBank,
    useSyncTransactions,
} from "../hooks/useBanking";

// Plaid Link Component
const PlaidLinkButton = ({ onSuccess }: { onSuccess: () => void }) => {
    const linkTokenMutation = useLinkToken();
    const connectBankMutation = useConnectBank();
    const [linkToken, setLinkToken] = useState<string | null>(null);

    const handleGetLinkToken = async () => {
        try {
            const token = await linkTokenMutation.mutateAsync();
            if (token) {
                setLinkToken(token);
            }
        } catch (error) {
            console.error("Failed to get link token:", error);
        }
    };

    const onPlaidSuccess = useCallback(
        async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
            try {
                if (!metadata.institution) {
                    console.error("No institution in metadata");
                    return;
                }
                await connectBankMutation.mutateAsync({
                    publicToken,
                    institutionId: metadata.institution.institution_id,
                });
                onSuccess();
                setLinkToken(null);
            } catch (error) {
                console.error("Failed to connect bank:", error);
            }
        },
        [connectBankMutation, onSuccess]
    );

    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: onPlaidSuccess,
        onExit: () => setLinkToken(null),
    });

    // Auto-open Plaid Link when token is ready
    if (linkToken && ready) {
        open();
    }

    return (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleGetLinkToken}
            disabled={linkTokenMutation.isPending || connectBankMutation.isPending}
        >
            {linkTokenMutation.isPending ? "Loading..." : "Connect Bank"}
        </Button>
    );
};

// Format currency
const formatCurrency = (amount: number | null, currency: string | null = "USD") => {
    if (amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
    }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function Banking() {
    const { data: connections, isLoading: connectionsLoading, refetch: refetchConnections } = useBankConnections();
    const { data: accounts, isLoading: accountsLoading } = useBankAccounts();
    const { data: transactions, isLoading: transactionsLoading } = useTransactions({ limit: 20 });
    const { data: spendingSummary, isLoading: summaryLoading } = useSpendingSummary();
    const disconnectMutation = useDisconnectBank();
    const syncMutation = useSyncTransactions();

    const handleDisconnect = async (connectionId: string) => {
        if (window.confirm("Are you sure you want to disconnect this bank?")) {
            await disconnectMutation.mutateAsync(connectionId);
        }
    };

    const handleSync = async (connectionId: string) => {
        await syncMutation.mutateAsync(connectionId);
    };

    const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0) || 0;

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Banking & Finance
                </Typography>
                <PlaidLinkButton onSuccess={() => refetchConnections()} />
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <WalletIcon color="primary" sx={{ mr: 1 }} />
                                <Typography color="text.secondary" variant="body2">
                                    Total Balance
                                </Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">
                                {accountsLoading ? <CircularProgress size={20} /> : formatCurrency(totalBalance)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <IncomeIcon color="success" sx={{ mr: 1 }} />
                                <Typography color="text.secondary" variant="body2">
                                    Income (30d)
                                </Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                {summaryLoading ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    formatCurrency(spendingSummary?.totalIncome || 0)
                                )}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <ExpenseIcon color="error" sx={{ mr: 1 }} />
                                <Typography color="text.secondary" variant="body2">
                                    Spending (30d)
                                </Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold" color="error.main">
                                {summaryLoading ? (
                                    <CircularProgress size={20} />
                                ) : (
                                    formatCurrency(spendingSummary?.totalSpending || 0)
                                )}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                <BankIcon color="info" sx={{ mr: 1 }} />
                                <Typography color="text.secondary" variant="body2">
                                    Connected Banks
                                </Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">
                                {connectionsLoading ? <CircularProgress size={20} /> : connections?.length || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Connected Banks */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Connected Banks
                        </Typography>

                        {connectionsLoading ? (
                            <CircularProgress />
                        ) : connections?.length === 0 ? (
                            <Alert severity="info">
                                No banks connected yet. Click "Connect Bank" to get started.
                            </Alert>
                        ) : (
                            <List>
                                {connections?.map((conn) => (
                                    <ListItem key={conn.connectionId} divider>
                                        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                                            {conn.institutionLogo ? (
                                                <img
                                                    src={`data:image/png;base64,${conn.institutionLogo}`}
                                                    alt={conn.institutionName}
                                                    style={{ width: 40, height: 40, borderRadius: 8 }}
                                                />
                                            ) : (
                                                <BankIcon sx={{ fontSize: 40 }} />
                                            )}
                                        </Box>
                                        <ListItemText
                                            primary={conn.institutionName}
                                            secondary={
                                                <>
                                                    <Chip
                                                        label={conn.status}
                                                        size="small"
                                                        color={conn.status === "active" ? "success" : "error"}
                                                        sx={{ mr: 1 }}
                                                    />
                                                    {conn.lastSyncAt && `Last synced: ${formatDate(conn.lastSyncAt)}`}
                                                </>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                onClick={() => handleSync(conn.connectionId)}
                                                disabled={syncMutation.isPending}
                                                title="Sync transactions"
                                            >
                                                <SyncIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDisconnect(conn.connectionId)}
                                                disabled={disconnectMutation.isPending}
                                                color="error"
                                                title="Disconnect"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Accounts */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Accounts
                        </Typography>

                        {accountsLoading ? (
                            <CircularProgress />
                        ) : accounts?.length === 0 ? (
                            <Alert severity="info">No accounts found. Connect a bank to see your accounts.</Alert>
                        ) : (
                            <List>
                                {accounts?.map((account) => (
                                    <ListItem key={account.accountId} divider>
                                        <ListItemText
                                            primary={account.name}
                                            secondary={
                                                <>
                                                    {account.type} {account.mask && `•••• ${account.mask}`}
                                                </>
                                            }
                                        />
                                        <Typography variant="h6" fontWeight="bold">
                                            {formatCurrency(account.currentBalance, account.isoCurrencyCode)}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Spending by Category */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Spending by Category (30 days)
                        </Typography>

                        {summaryLoading ? (
                            <CircularProgress />
                        ) : !spendingSummary?.byCategory?.length ? (
                            <Alert severity="info">No spending data available yet.</Alert>
                        ) : (
                            <List>
                                {spendingSummary.byCategory.slice(0, 5).map((cat) => (
                                    <ListItem key={cat.category}>
                                        <ListItemText
                                            primary={cat.category}
                                            secondary={
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(cat.amount / spendingSummary.totalSpending) * 100}
                                                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                                                />
                                            }
                                        />
                                        <Typography variant="body1" fontWeight="bold" sx={{ ml: 2 }}>
                                            {formatCurrency(cat.amount)}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Transactions */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Recent Transactions
                        </Typography>

                        {transactionsLoading ? (
                            <CircularProgress />
                        ) : transactions?.length === 0 ? (
                            <Alert severity="info">No transactions found. Sync your bank to see transactions.</Alert>
                        ) : (
                            <List>
                                {transactions?.slice(0, 10).map((tx) => (
                                    <ListItem key={tx.transactionId} divider>
                                        <ListItemText
                                            primary={tx.merchantName || tx.name}
                                            secondary={
                                                <>
                                                    {formatDate(tx.date)}
                                                    {tx.pending && (
                                                        <Chip label="Pending" size="small" sx={{ ml: 1 }} />
                                                    )}
                                                </>
                                            }
                                        />
                                        <Typography
                                            variant="body1"
                                            fontWeight="bold"
                                            color={tx.amount > 0 ? "error.main" : "success.main"}
                                        >
                                            {tx.amount > 0 ? "-" : "+"}
                                            {formatCurrency(Math.abs(tx.amount), tx.isoCurrencyCode)}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
