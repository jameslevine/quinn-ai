// Jest setup file for backend tests

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.AWS_REGION = "eu-west-2";
process.env.DYNAMODB_TABLE = "quinn-main-test";
process.env.COGNITO_USER_POOL_ID = "test-pool-id";
process.env.COGNITO_CLIENT_ID = "test-client-id";
process.env.FRONTEND_URL = "http://localhost:3000";

// Mock AWS SDK
jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: jest.fn(),
    }),
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  QueryCommand: jest.fn(),
  ScanCommand: jest.fn(),
}));

// Suppress console.log in tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console.log = jest.fn();
  global.console.info = jest.fn();
  global.console.debug = jest.fn();
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
