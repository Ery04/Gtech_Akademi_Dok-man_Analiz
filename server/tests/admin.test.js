const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Document = require('../models/Document');
const bcrypt = require('bcryptjs');

describe('Admin Functionality Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Create admin user
    const adminPassword = await bcrypt.hash('AdminPass123!', 10);
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create regular user
    const userPassword = await bcrypt.hash('UserPass123!', 10);
    regularUser = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: userPassword,
      role: 'user'
    });

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      });

    adminToken = adminLoginResponse.body.data.token;

    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'UserPass123!'
      });

    userToken = userLoginResponse.body.data.token;
  });

  describe('GET /api/admin/users', () => {
    test('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toHaveProperty('currentPage');
    });

    test('should fail for regular user', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Erişim reddedildi');
      expect(response.body.message).toBe('Bu işlem için admin yetkisi gerekiyor.');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.error).toBe('Yetkilendirme hatası');
    });
  });

  describe('GET /api/admin/stats', () => {
    test('should get system stats for admin', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalDocuments');
      expect(response.body.data).toHaveProperty('adminUsers');
      expect(response.body.data).toHaveProperty('newUsersThisWeek');
    });

    test('should fail for regular user', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Erişim reddedildi');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    test('should delete user and their documents', async () => {
      // Create a document for the user to be deleted
      await Document.create({
        ownerId: regularUser._id,
        fileName: 'test.pdf',
        fileType: 'pdf',
        fileSize: 1024,
        contentText: 'Test content',
        uploadDate: new Date()
      });

      const response = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Kullanıcı ve tüm dokümanları başarıyla silindi.');

      // Verify user is deleted
      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();

      // Verify user's documents are deleted
      const userDocuments = await Document.find({ ownerId: regularUser._id });
      expect(userDocuments).toHaveLength(0);
    });

    test('should fail when admin tries to delete themselves', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.error).toBe('Silme hatası');
      expect(response.body.message).toBe('Kendi hesabınızı silemezsiniz.');
    });

    test('should fail for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Kullanıcı bulunamadı');
    });

    test('should fail for regular user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Erişim reddedildi');
    });
  });

  describe('Admin Middleware', () => {
    test('should allow admin access to protected routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should deny regular user access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Erişim reddedildi');
    });

    test('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.error).toBe('Yetkilendirme hatası');
    });
  });
}); 