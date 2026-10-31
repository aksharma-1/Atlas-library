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
import { Shift } from '../models/Shift';
import { Plan } from '../models/Plan';
import { Seat } from '../models/Seat';

const TEST_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_test';
const app = createApp();

let authCookie: string;
let otherAuthCookie: string;

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
  await Shift.deleteMany({});
  await Plan.deleteMany({});
  await Seat.deleteMany({});

  // Tenant 1
  const t1 = await Tenant.create({ name: 'Library A', slug: 'lib-a', email: 'a@lib.com' });
  const hash = await bcrypt.hash('pass123', 4);
  await User.create({ tenantId: t1._id, name: 'Admin A', email: 'admin@a.com', passwordHash: hash, role: 'owner' });

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'admin@a.com', password: 'pass123' });
  const cookies = loginRes.headers['set-cookie'];
  authCookie = Array.isArray(cookies) ? cookies[0] : (cookies ? String(cookies) : '');

  // Tenant 2
  const t2 = await Tenant.create({ name: 'Library B', slug: 'lib-b', email: 'b@lib.com' });
  await User.create({ tenantId: t2._id, name: 'Admin B', email: 'admin@b.com', passwordHash: hash, role: 'owner' });
  const login2Res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@b.com', password: 'pass123' });
  const cookies2 = login2Res.headers['set-cookie'];
  otherAuthCookie = Array.isArray(cookies2) ? cookies2[0] : (cookies2 ? String(cookies2) : '');
});

describe('Shifts API', () => {
  it('creates and lists shifts within the tenant', async () => {
    const createRes = await request(app)
      .post('/api/v1/shifts')
      .set('Cookie', authCookie)
      .send({ name: 'Morning Shift', startTime: '07:00', endTime: '15:00' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.shift.name).toBe('Morning Shift');

    const listRes = await request(app).get('/api/v1/shifts').set('Cookie', authCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.shifts.length).toBe(1);

    // Other tenant cannot see Tenant A's shifts
    const otherListRes = await request(app).get('/api/v1/shifts').set('Cookie', otherAuthCookie);
    expect(otherListRes.body.shifts.length).toBe(0);
  });
});

describe('Plans API', () => {
  it('creates plans and stores fee in integer paise', async () => {
    const shiftRes = await request(app)
      .post('/api/v1/shifts')
      .set('Cookie', authCookie)
      .send({ name: 'Full Day', startTime: '07:00', endTime: '23:00' });

    const shiftId = shiftRes.body.shift._id;

    const createRes = await request(app)
      .post('/api/v1/plans')
      .set('Cookie', authCookie)
      .send({
        name: 'Full Day Reserved',
        seatType: 'reserved',
        shiftIds: [shiftId],
        feePaise: 60000, // ₹600.00
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.plan.feePaise).toBe(60000);

    const listRes = await request(app).get('/api/v1/plans').set('Cookie', authCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.plans.length).toBe(1);
  });
});

describe('Seats API & Visual Grid', () => {
  it('bulk creates seats and toggles seat status', async () => {
    const bulkRes = await request(app)
      .post('/api/v1/seats/bulk')
      .set('Cookie', authCookie)
      .send({ startNumber: 1, endNumber: 20, prefix: '', section: 'Main Hall' });

    expect(bulkRes.status).toBe(201);
    expect(bulkRes.body.createdCount).toBe(20);

    const listRes = await request(app).get('/api/v1/seats').set('Cookie', authCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.seats.length).toBe(20);

    const seatId = listRes.body.seats[0]._id;

    // Toggle to maintenance
    const patchRes = await request(app)
      .patch(`/api/v1/seats/${seatId}/status`)
      .set('Cookie', authCookie)
      .send({ status: 'maintenance' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.seat.status).toBe('maintenance');
  });
});

describe('Dashboard Stats API', () => {
  it('calculates aggregate stats accurately for the tenant', async () => {
    // Generate 10 seats (9 available, 1 maintenance)
    await request(app)
      .post('/api/v1/seats/bulk')
      .set('Cookie', authCookie)
      .send({ startNumber: 1, endNumber: 10 });

    const listRes = await request(app).get('/api/v1/seats').set('Cookie', authCookie);
    await request(app)
      .patch(`/api/v1/seats/${listRes.body.seats[0]._id}/status`)
      .set('Cookie', authCookie)
      .send({ status: 'maintenance' });

    const statsRes = await request(app).get('/api/v1/dashboard/stats').set('Cookie', authCookie);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.stats.totalSeats).toBe(10);
    expect(statsRes.body.stats.availableSeats).toBe(9);
    expect(statsRes.body.stats.maintenanceSeats).toBe(1);
    expect(statsRes.body.stats.occupiedSeats).toBe(0);
  });
});
