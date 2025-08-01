const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Mock Gemini service
jest.mock('../services/geminiService', () => ({
  summarizeText: jest.fn().mockResolvedValue('Mocked summary'),
  extractKeywords: jest.fn().mockResolvedValue(['mock', 'keyword', 'test']),
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]),
  searchInDocument: jest.fn().mockResolvedValue([
    {
      text: 'Mocked search result',
      description: 'Mocked description',
      importance: 8
    }
  ]),
  calculateSimilarity: jest.fn().mockReturnValue(0.85)
}));

// Connect to test database
beforeAll(async () => {
  const testDbUrl = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
  await mongoose.connect(testDbUrl);
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Close connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
}); 