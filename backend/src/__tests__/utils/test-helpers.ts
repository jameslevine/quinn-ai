// Test helper utilities
import { Request, Response } from "express";

// Create a mock Express request
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: {
    sub: "test-user-id",
    email: "test@example.com",
    "cognito:username": "test@example.com",
  },
  ...overrides,
});

// Create a mock Express response
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

// Create a mock next function
export const createMockNext = () => jest.fn();

// Generate a random UUID for testing
export const generateTestId = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create a mock user
export const createMockUser = (overrides = {}) => ({
  userId: generateTestId(),
  email: "test@example.com",
  cognitoSub: "cognito-sub-123",
  firstName: "Test",
  lastName: "User",
  settings: {
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    approvalModes: {
      email: "suggest",
      call: "suggest",
      payment: "suggest",
      food: "suggest",
    },
    spendingLimits: {
      perTransaction: 50,
      daily: 100,
      monthly: 500,
    },
    theme: "light",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create a mock action
export const createMockAction = (overrides = {}) => ({
  actionId: generateTestId(),
  userId: "test-user-id",
  type: "email",
  status: "pending",
  priority: "medium",
  title: "Test Action",
  description: "Test action description",
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create a mock integration
export const createMockIntegration = (overrides = {}) => ({
  integrationId: generateTestId(),
  userId: "test-user-id",
  type: "gmail",
  status: "connected",
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
  email: "test@gmail.com",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Wait for async operations
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Create mock DynamoDB response
export const createMockDynamoDBResponse = (items: any[] = []) => ({
  Items: items,
  Count: items.length,
  ScannedCount: items.length,
});
