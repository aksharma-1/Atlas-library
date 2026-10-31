import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../app';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

// ── Test database ─────────────────────────────────────────────────────────────
const TEST_URI =
  process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_test';

const app = createApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────
const TENANT_DATA = {
  name: 'Test Library',
  slug: 'test-library',
  email: 'test@library.com',
};

const ADMIN_DATA = {
  name: 'Test Admin',
  email: 'admin@test.com',
  password: 'Test@1234',
};

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Tenant.deleteMany({});
  await User.deleteMany({});
});

async function createFixtures() {
  const tenant = await Tenant.create(TENANT_DATA);
  const passwordHash = await bcrypt.hash(ADMIN_DATA.password, 4); // low cost for speed
  const user = await User.create({
    tenantId: tenant._id,
    name: ADMIN_DATA.name,
    email: ADMIN_DATA.email,
    passwordHash,
    role: 'owner',
  });
  return { tenant, user };
}

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  it('returns 200 and sets cookie on valid credentials', async () => {
    await createFixtures();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_DATA.email, password: ADMIN_DATA.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(ADMIN_DATA.email);
    expect(res.body.user.role).toBe('owner');
    // Cookie must be set
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies = res.headers['set-cookie'];
    const cookie = Array.isArray(cookies) ? cookies[0] : (cookies as unknown as string);
    expect(cookie).toContain('atlas_token');
    expect(cookie).toContain('HttpOnly');
  });

  it('returns 401 on wrong password', async () => {
    await createFixtures();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_DATA.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('returns 401 on unknown email (no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'any-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 400 on missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'notanemail' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
  });
});

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  it('returns 200 and user data with valid cookie', async () => {
    await createFixtures();

    // Login first to get cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_DATA.email, password: ADMIN_DATA.password });

    const cookies = loginRes.headers['set-cookie'];
    const cookie = Array.isArray(cookies) ? cookies[0] : (cookies as unknown as string);

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(ADMIN_DATA.email);
    expect(meRes.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });
});

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
describe('POST /api/v1/auth/logout', () => {
  it('returns 200 and clears the cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
    // Cookie should be cleared (expires=0 or max-age=0)
    const cookies = res.headers['set-cookie'];
    const cookie = Array.isArray(cookies) ? cookies[0] : (cookies as unknown as string | undefined);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/atlas_token=;/);
  });
});
