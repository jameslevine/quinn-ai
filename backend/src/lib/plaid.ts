import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  TransactionsGetRequest,
  AccountsGetRequest,
} from "plaid";

// Plaid configuration
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || "";
const PLAID_SECRET = process.env.PLAID_SECRET || "";
const PLAID_ENV = process.env.PLAID_ENV || "sandbox";

// Create Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Types
export interface PlaidAccount {
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    isoCurrencyCode: string | null;
  };
}

export interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  categoryId: string | null;
  pending: boolean;
  isoCurrencyCode: string | null;
  paymentChannel: string;
  location: {
    address: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  };
}

// Create Link Token for Plaid Link
export const createLinkToken = async (userId: string, redirectUri?: string): Promise<string> => {
  const request: LinkTokenCreateRequest = {
    user: {
      client_user_id: userId,
    },
    client_name: "Quinn AI",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us, CountryCode.Gb],
    language: "en",
    redirect_uri: redirectUri,
  };

  const response = await plaidClient.linkTokenCreate(request);
  return response.data.link_token;
};

// Exchange public token for access token
export const exchangePublicToken = async (
  publicToken: string
): Promise<{ accessToken: string; itemId: string }> => {
  const request: ItemPublicTokenExchangeRequest = {
    public_token: publicToken,
  };

  const response = await plaidClient.itemPublicTokenExchange(request);
  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
};

// Get accounts for an item
export const getAccounts = async (accessToken: string): Promise<PlaidAccount[]> => {
  const request: AccountsGetRequest = {
    access_token: accessToken,
  };

  const response = await plaidClient.accountsGet(request);

  return response.data.accounts.map((account) => ({
    accountId: account.account_id,
    name: account.name,
    officialName: account.official_name,
    type: account.type,
    subtype: account.subtype,
    mask: account.mask,
    balances: {
      available: account.balances.available,
      current: account.balances.current,
      limit: account.balances.limit,
      isoCurrencyCode: account.balances.iso_currency_code,
    },
  }));
};

// Get transactions
export const getTransactions = async (
  accessToken: string,
  startDate: string,
  endDate: string,
  options?: { accountIds?: string[]; count?: number; offset?: number }
): Promise<{ transactions: PlaidTransaction[]; totalTransactions: number }> => {
  const request: TransactionsGetRequest = {
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: {
      account_ids: options?.accountIds,
      count: options?.count || 100,
      offset: options?.offset || 0,
    },
  };

  const response = await plaidClient.transactionsGet(request);

  const transactions: PlaidTransaction[] = response.data.transactions.map((tx) => ({
    transactionId: tx.transaction_id,
    accountId: tx.account_id,
    amount: tx.amount,
    date: tx.date,
    name: tx.name,
    merchantName: tx.merchant_name ?? null,
    category: tx.category || [],
    categoryId: tx.category_id ?? null,
    pending: tx.pending,
    isoCurrencyCode: tx.iso_currency_code,
    paymentChannel: tx.payment_channel,
    location: {
      address: tx.location?.address ?? null,
      city: tx.location?.city ?? null,
      region: tx.location?.region ?? null,
      postalCode: tx.location?.postal_code ?? null,
      country: tx.location?.country ?? null,
    },
  }));

  return {
    transactions,
    totalTransactions: response.data.total_transactions,
  };
};

// Get institution info
export const getInstitution = async (
  institutionId: string
): Promise<{ name: string; logo: string | null; primaryColor: string | null }> => {
  const response = await plaidClient.institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Us, CountryCode.Gb],
    options: {
      include_optional_metadata: true,
    },
  });

  return {
    name: response.data.institution.name,
    logo: response.data.institution.logo ?? null,
    primaryColor: response.data.institution.primary_color ?? null,
  };
};

// Remove item (disconnect bank)
export const removeItem = async (accessToken: string): Promise<void> => {
  await plaidClient.itemRemove({
    access_token: accessToken,
  });
};

// Sync transactions (for webhooks)
export const syncTransactions = async (
  accessToken: string,
  cursor?: string
): Promise<{
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: string[];
  nextCursor: string;
  hasMore: boolean;
}> => {
  const response = await plaidClient.transactionsSync({
    access_token: accessToken,
    cursor: cursor,
  });

  const mapTransaction = (tx: any): PlaidTransaction => ({
    transactionId: tx.transaction_id,
    accountId: tx.account_id,
    amount: tx.amount,
    date: tx.date,
    name: tx.name,
    merchantName: tx.merchant_name ?? null,
    category: tx.category || [],
    categoryId: tx.category_id ?? null,
    pending: tx.pending,
    isoCurrencyCode: tx.iso_currency_code ?? null,
    paymentChannel: tx.payment_channel,
    location: {
      address: tx.location?.address ?? null,
      city: tx.location?.city ?? null,
      region: tx.location?.region ?? null,
      postalCode: tx.location?.postal_code ?? null,
      country: tx.location?.country ?? null,
    },
  });

  return {
    added: response.data.added.map(mapTransaction),
    modified: response.data.modified.map(mapTransaction),
    removed: response.data.removed.map((r) => r.transaction_id),
    nextCursor: response.data.next_cursor,
    hasMore: response.data.has_more,
  };
};
