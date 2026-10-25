import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

// createApp() is a pure factory — no real server port is opened by Supertest
const app = createApp();

describe('GET /api/v1/health', () => {
  it('responds 200 with status "ok" and required fields', async () => {
    const { status, body } = await request(app).get('/api/v1/health');

    expect(status).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      environment: 'test',
    });
    // timestamp must be a valid ISO 8601 string
    expect(typeof body.timestamp).toBe('string');
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
    // version is present
    expect(typeof body.version).toBe('string');
  });

  it('sets Content-Type to application/json', async () => {
    const { headers } = await request(app).get('/api/v1/health');
    expect(headers['content-type']).toMatch(/application\/json/);
  });
});

describe('Unknown routes', () => {
  it('responds 404 with a JSON error body for unregistered paths', async () => {
    const { status, body } = await request(app).get('/api/v1/does-not-exist');

    expect(status).toBe(404);
    expect(body).toMatchObject({ error: 'Not Found' });
    expect(typeof body.path).toBe('string');
  });

  it('responds 404 for the root path', async () => {
    const { status } = await request(app).get('/');
    expect(status).toBe(404);
  });
});
