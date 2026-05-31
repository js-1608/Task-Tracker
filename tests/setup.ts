// tests/setup.ts
// Load test environment variables before all tests
import 'dotenv/config';

// Increase timeout for integration tests
jest.setTimeout(30000);
