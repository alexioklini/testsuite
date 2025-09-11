import request from 'supertest';
import app from '../../server';

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'testpass123',
          real_name: 'Test User',
          email: 'test@example.com'
        })
        .expect(200);

      expect(response.body.message).toBe('User registered');
    });

    it('should return 400 for duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          password: 'testpass123',
          real_name: 'Test User 2',
          email: 'test2@example.com'
        });

      // Second registration with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          password: 'testpass123',
          real_name: 'Test User 2',
          email: 'test2@example.com'
        })
        .expect(400);

      expect(response.body.error).toBe('Username already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register a user first
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          password: 'loginpass123',
          real_name: 'Login User',
          email: 'login@example.com'
        });

      // Login with the registered user
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'loginpass123'
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpass'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});