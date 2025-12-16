import request from 'supertest';

// Mock better-auth/node before importing app
jest.mock('better-auth/node', () => ({
  toNodeHandler: jest.fn(() => (req: unknown, res: unknown, next: () => void) => next()),
}));

// Mock the auth module - use .ts extension for ts-jest
jest.mock('../src/lib/auth.js', () => ({
  auth: {
    handler: jest.fn(),
  },
}));

import { app } from '../src/index';

describe('Server API', () => {
  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        message: 'Server is running'
      });
    });
  });

  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Welcome to Orbital CLI AI API'
      });
    });
  });
});
