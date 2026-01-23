/**
 * Jest test setup
 * Configures test environment, database, and mocks
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-minimum-32-characters-long';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/selorg-test';
process.env.API_VERSION = '1.0.0-test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Setup before all tests
beforeAll(async () => {
  // Clear all Mongoose models to prevent "Cannot overwrite model" errors
  mongoose.models = {};
  mongoose.modelSchemas = {};

  // Use in-memory MongoDB for tests
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URI = mongoUri;

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Failed to setup test database:', error);
    // Fallback to regular MongoDB if memory server fails
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch (error) {
      // Ignore errors during cleanup
    }
  }

  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  // Stop in-memory server if it was created
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Cleanup after each test (optional - can be disabled for performance)
// Uncomment if you want to clean between tests
// afterEach(async () => {
//   const collections = mongoose.connection.collections;
//   for (const key in collections) {
//     try {
//       await collections[key].deleteMany({});
//     } catch (error) {
//       // Ignore errors
//     }
//   }
// });

// Suppress logger during tests (use silent logger)
const logger = require('../src/core/utils/logger');
// Mock logger to be silent during tests
logger.info = jest.fn();
logger.debug = jest.fn();
logger.warn = jest.fn();
logger.error = jest.fn();

// Suppress console logs during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};