const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Document = require('../models/Document');
const bcrypt = require('bcryptjs');
const path = require('path');

describe('Document Management Tests', () => {
  let testUser;
  let testUser2;
  let authToken;
  let testDocument;

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user'
    });

    testUser2 = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password: hashedPassword,
      role: 'user'
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!'
      });

    authToken = loginResponse.body.data.token;

    // Create test document
    testDocument = await Document.create({
      ownerId: testUser._id,
      fileName: 'test.pdf',
      fileType: 'pdf',
      fileSize: 1024,
      contentText: 'This is a test document content for testing purposes.',
      uploadDate: new Date()
    });
  });

  describe('POST /api/documents/upload', () => {
    test('should upload a document successfully', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('document', Buffer.from('Test PDF content'), {
          filename: 'test.pdf',
          contentType: 'application/pdf'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document).toHaveProperty('id');
      expect(response.body.data.document.fileName).toBe('test.pdf');
      expect(response.body.data.document.fileType).toBe('pdf');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('Test content'), {
          filename: 'test.pdf',
          contentType: 'application/pdf'
        })
        .expect(401);

      expect(response.body.error).toBe('Yetkilendirme hatası');
    });

    test('should fail without file', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Dosya hatası');
    });
  });

  describe('GET /api/documents', () => {
    test('should get user documents', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toHaveProperty('currentPage');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(401);

      expect(response.body.error).toBe('Yetkilendirme hatası');
    });
  });

  describe('GET /api/documents/:id', () => {
    test('should get document by id', async () => {
      const response = await request(app)
        .get(`/api/documents/${testDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.document._id).toBe(testDocument._id.toString());
    });

    test('should fail accessing other user document', async () => {
      // Create document for different user
      const otherDocument = await Document.create({
        ownerId: testUser2._id,
        fileName: 'other.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        contentText: 'Other user document',
        uploadDate: new Date()
      });

      const response = await request(app)
        .get(`/api/documents/${otherDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Doküman bulunamadı');
    });
  });

  describe('POST /api/documents/:id/summary', () => {
    test('should generate summary for document', async () => {
      const response = await request(app)
        .post(`/api/documents/${testDocument._id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBe('Mocked summary');
      expect(response.body.data.cached).toBe(false);
    });

    test('should return cached summary if exists', async () => {
      // First request to generate summary
      await request(app)
        .post(`/api/documents/${testDocument._id}/summary`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second request should return cached
      const response = await request(app)
        .post(`/api/documents/${testDocument._id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cached).toBe(true);
    });
  });

  describe('POST /api/documents/:id/keywords', () => {
    test('should extract keywords from document', async () => {
      const response = await request(app)
        .post(`/api/documents/${testDocument._id}/keywords`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.keywords).toEqual(['mock', 'keyword', 'test']);
      expect(response.body.data.cached).toBe(false);
    });

    test('should return cached keywords if exist', async () => {
      // First request to extract keywords
      await request(app)
        .post(`/api/documents/${testDocument._id}/keywords`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second request should return cached
      const response = await request(app)
        .post(`/api/documents/${testDocument._id}/keywords`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cached).toBe(true);
    });
  });

  describe('POST /api/documents/:id/search', () => {
    test('should search within document', async () => {
      const response = await request(app)
        .post(`/api/documents/${testDocument._id}/search`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'test content' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeInstanceOf(Array);
      expect(response.body.data.totalResults).toBe(1);
    });

    test('should fail with empty query', async () => {
      const response = await request(app)
        .post(`/api/documents/${testDocument._id}/search`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: '' })
        .expect(400);

      expect(response.body.error).toBe('Arama sorgusu gerekli');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    test('should delete user document', async () => {
      const response = await request(app)
        .delete(`/api/documents/${testDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Doküman başarıyla silindi.');
    });

    test('should fail deleting other user document', async () => {
      const otherDocument = await Document.create({
        ownerId: testUser2._id,
        fileName: 'other.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        contentText: 'Other user document',
        uploadDate: new Date()
      });

      const response = await request(app)
        .delete(`/api/documents/${otherDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Doküman bulunamadı');
    });
  });
}); 