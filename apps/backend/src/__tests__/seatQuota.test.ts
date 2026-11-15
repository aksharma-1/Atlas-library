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
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { env } from '../config/env';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Seat } from '../models/Seat';
import { AUTH_COOKIE } from '../controllers/auth.controller';

const TEST_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_test';
const app = createApp();

describe('Phase 2 — Task 2: Enforce SaaS Seat Limits', () => {
  let tenant1: any;
  let tenant2: any;
  let ownerUser1: any;
  let ownerUser2: any;
  let authCookie1: string;
  let authCookie2: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_URI);
    }
  });

  afterAll(async () => {
    await Tenant.deleteMany({ slug: { $in: ['seat-quota-lib-1', 'seat-quota-lib-2'] } });
    await User.deleteMany({ email: { $in: ['quota1@lib.com', 'quota2@lib.com'] } });
    await Seat.deleteMany({});
  });

  beforeEach(async () => {
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Seat.deleteMany({});

    const passwordHash = await bcrypt.hash('Secret123!', 10);

    // Tenant 1 has maxSeats = 5
    tenant1 = await Tenant.create({
      name: 'Quota Library 1',
      slug: 'seat-quota-lib-1',
      email: 'quota1@lib.com',
      isActive: true,
      maxSeats: 5,
    });

    ownerUser1 = await User.create({
      tenantId: tenant1._id,
      name: 'Quota Owner 1',
      email: 'quota1@lib.com',
      passwordHash,
      role: 'owner',
      isActive: true,
    });

    const token1 = jwt.sign(
      {
        userId: ownerUser1._id.toString(),
        tenantId: tenant1._id.toString(),
        email: ownerUser1.email,
        role: ownerUser1.role,
        subscriptionStatus: 'active',
        subscriptionTier: 'starter',
        isActive: true,
      },
      env.JWT_SECRET,
    );
    authCookie1 = `${AUTH_COOKIE}=${token1}`;

    // Tenant 2 has maxSeats = 10
    tenant2 = await Tenant.create({
      name: 'Quota Library 2',
      slug: 'seat-quota-lib-2',
      email: 'quota2@lib.com',
      isActive: true,
      maxSeats: 10,
    });

    ownerUser2 = await User.create({
      tenantId: tenant2._id,
      name: 'Quota Owner 2',
      email: 'quota2@lib.com',
      passwordHash,
      role: 'owner',
      isActive: true,
    });

    const token2 = jwt.sign(
      {
        userId: ownerUser2._id.toString(),
        tenantId: tenant2._id.toString(),
        email: ownerUser2.email,
        role: ownerUser2.role,
        subscriptionStatus: 'active',
        subscriptionTier: 'growth',
        isActive: true,
      },
      env.JWT_SECRET,
    );
    authCookie2 = `${AUTH_COOKIE}=${token2}`;
  });

  it('allows creating seats within the limit', async () => {
    // Create 3 seats out of 5 allowed
    const res = await request(app)
      .post('/api/v1/seats')
      .set('Cookie', authCookie1)
      .send({ seatNumber: 'A-01', section: 'Main Hall' });

    expect(res.status).toBe(201);
    expect(res.body.seat.seatNumber).toBe('A-01');

    const count = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(count).toBe(1);
  });

  it('allows creating seats up to the exact limit', async () => {
    // Fill up all 5 seats (bulk create 1..5)
    const res = await request(app)
      .post('/api/v1/seats/bulk')
      .set('Cookie', authCookie1)
      .send({ startNumber: 1, endNumber: 5, prefix: 'S-', section: 'Main Hall' });

    expect(res.status).toBe(201);
    expect(res.body.createdCount).toBe(5);

    const count = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(count).toBe(5);
  });

  it('returns HTTP 403 when exceeding the limit through single seat creation', async () => {
    // Pre-create 5 seats (reaches maxSeats: 5)
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'D-01', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'D-02', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'D-03', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'D-04', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'D-05', status: 'available' },
    ]);

    // Attempt 6th seat
    const res = await request(app)
      .post('/api/v1/seats')
      .set('Cookie', authCookie1)
      .send({ seatNumber: 'D-06', section: 'Main Hall' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/limit is 5 seats/i);
    expect(res.body.currentSeatCount).toBe(5);
    expect(res.body.maxSeats).toBe(5);

    // Existing seats remain unchanged
    const count = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(count).toBe(5);
  });

  it('returns HTTP 403 when exceeding the limit through bulk seat creation', async () => {
    // Already has 3 seats
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'B-01', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'B-02', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'B-03', status: 'available' },
    ]);

    // Request 3 more (total 6 > maxSeats 5)
    const res = await request(app)
      .post('/api/v1/seats/bulk')
      .set('Cookie', authCookie1)
      .send({ startNumber: 4, endNumber: 6, prefix: 'B-', section: 'Main Hall' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/limit is 5 seats/i);
    expect(res.body.currentSeatCount).toBe(3);
    expect(res.body.maxSeats).toBe(5);

    // No seats were created from the rejected bulk request
    const count = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(count).toBe(3);
  });

  it('safely handles concurrent seat creation near the limit', async () => {
    // Pre-create 4 seats out of 5 and sync tenant currentSeatCount
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'C-01', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'C-02', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'C-03', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'C-04', status: 'available' },
    ]);
    await Tenant.updateOne({ _id: tenant1._id }, { $set: { currentSeatCount: 4 } });

    // Send 3 concurrent requests to create the 5th seat
    const results = await Promise.all([
      request(app)
        .post('/api/v1/seats')
        .set('Cookie', authCookie1)
        .send({ seatNumber: 'C-05A', section: 'Main Hall' }),
      request(app)
        .post('/api/v1/seats')
        .set('Cookie', authCookie1)
        .send({ seatNumber: 'C-05B', section: 'Main Hall' }),
      request(app)
        .post('/api/v1/seats')
        .set('Cookie', authCookie1)
        .send({ seatNumber: 'C-05C', section: 'Main Hall' }),
    ]);

    const statuses = results.map((r) => r.status);
    // At most 1 should succeed with 201, while the rest are blocked with 403 (or 409 if duplicate)
    const successfulCount = statuses.filter((s) => s === 201).length;
    const forbiddenCount = statuses.filter((s) => s === 403).length;

    expect(successfulCount).toBeLessThanOrEqual(1);
    expect(forbiddenCount).toBeGreaterThanOrEqual(2);

    const totalInDb = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(totalInDb).toBeLessThanOrEqual(5);
  });

  it('guarantees strict tenant isolation for seat quotas', async () => {
    // Fill Tenant 1 to capacity (5/5)
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'T1-01', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'T1-02', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'T1-03', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'T1-04', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'T1-05', status: 'available' },
    ]);

    // Tenant 1 cannot create more
    const res1 = await request(app)
      .post('/api/v1/seats')
      .set('Cookie', authCookie1)
      .send({ seatNumber: 'T1-06', section: 'Main Hall' });
    expect(res1.status).toBe(403);

    // Tenant 2 has 0 seats and maxSeats: 10, so Tenant 2 can freely create seats
    const res2 = await request(app)
      .post('/api/v1/seats')
      .set('Cookie', authCookie2)
      .send({ seatNumber: 'T2-01', section: 'Main Hall' });
    expect(res2.status).toBe(201);
    expect(res2.body.seat.seatNumber).toBe('T2-01');

    const t1Count = await Seat.countDocuments({ tenantId: tenant1._id });
    const t2Count = await Seat.countDocuments({ tenantId: tenant2._id });
    expect(t1Count).toBe(5);
    expect(t2Count).toBe(1);
  });

  it('does not delete or deactivate existing seats if a tenant is already above limit', async () => {
    // Legacy state: tenant has 7 seats when maxSeats is 5
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'L-01', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'L-02', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'L-03', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'L-04', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'L-05', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'L-06', status: 'occupied' },
      { tenantId: tenant1._id, seatNumber: 'L-07', status: 'available' },
    ]);

    // Listing seats works normally without deleting anything
    const listRes = await request(app).get('/api/v1/seats').set('Cookie', authCookie1);
    expect(listRes.status).toBe(200);
    expect(listRes.body.seats.length).toBe(7);

    // Further seat creation is blocked
    const addRes = await request(app)
      .post('/api/v1/seats')
      .set('Cookie', authCookie1)
      .send({ seatNumber: 'L-08', section: 'Main Hall' });
    expect(addRes.status).toBe(403);
    expect(addRes.body.currentSeatCount).toBe(7);
    expect(addRes.body.maxSeats).toBe(5);

    // All 7 existing seats remain intact
    const count = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(count).toBe(7);
  });

  it('correctly handles existing tenant near capacity (95 seats, 100 limit)', async () => {
    // Setup tenant with 100 maxSeats and 95 existing seats in DB (simulating existing production tenant)
    await Tenant.updateOne({ _id: tenant2._id }, { $set: { maxSeats: 100, currentSeatCount: undefined } });

    const seatDocs = [];
    for (let i = 1; i <= 95; i++) {
      seatDocs.push({
        tenantId: tenant2._id,
        seatNumber: `PROD-${String(i).padStart(3, '0')}`,
        status: 'available' as const,
      });
    }
    await Seat.insertMany(seatDocs);

    // Creating 5 more seats should succeed (exact 100 limit)
    const res1 = await request(app)
      .post('/api/v1/seats/bulk')
      .set('Cookie', authCookie2)
      .send({ startNumber: 96, endNumber: 100, prefix: 'PROD-', section: 'Main Hall' });

    expect(res1.status).toBe(201);
    expect(res1.body.createdCount).toBe(5);

    // Creating the 101st seat must be blocked with 403
    const res2 = await request(app)
      .post('/api/v1/seats')
      .set('Cookie', authCookie2)
      .send({ seatNumber: 'PROD-101', section: 'Main Hall' });

    expect(res2.status).toBe(403);
    expect(res2.body.currentSeatCount).toBe(100);
    expect(res2.body.maxSeats).toBe(100);
  });

  it('automatically reconciles missing currentSeatCount on startup or on demand', async () => {
    // Unset currentSeatCount on tenant1
    await Tenant.updateOne({ _id: tenant1._id }, { $unset: { currentSeatCount: 1 } });

    // Pre-populate 3 seats
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'UNSET-1', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'UNSET-2', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'UNSET-3', status: 'available' },
    ]);

    const { initializeMissingTenantSeatCounts } = await import('../services/seatQuota.service');
    await initializeMissingTenantSeatCounts();

    const updated = await Tenant.findById(tenant1._id);
    expect(updated?.currentSeatCount).toBe(3);
  });

  it('updates currentSeatCount when super-admin approves and seeds initial seats', async () => {
    const { SaasPlan } = await import('../models/SaasPlan');

    await SaasPlan.create({
      code: 'starter',
      name: 'Starter Plan',
      monthlyPrice: 499,
      maxDesks: 50,
      features: ['50 Desks'],
      isActive: true,
      sortOrder: 1,
    });

    const newTenant = await Tenant.create({
      name: 'New Approval Library',
      slug: 'approval-lib-1',
      email: 'approval@lib.com',
      isActive: true,
      subscriptionTier: 'starter',
      subscriptionStatus: 'pending_approval',
      maxSeats: 50,
      currentSeatCount: 0,
    });

    const superUser = await User.create({
      tenantId: newTenant._id,
      name: 'Super User',
      email: 'super@test.com',
      passwordHash: 'fake',
      role: 'superadmin',
      isActive: true,
    });

    const token = jwt.sign(
      {
        userId: superUser._id.toString(),
        tenantId: newTenant._id.toString(),
        email: superUser.email,
        role: 'superadmin',
        subscriptionStatus: 'active',
        subscriptionTier: 'starter',
        isActive: true,
      },
      env.JWT_SECRET,
    );
    const superCookie = `${AUTH_COOKIE}=${token}`;

    const res = await request(app)
      .post(`/api/v1/superadmin/tenants/${newTenant._id}/approve`)
      .set('Cookie', superCookie)
      .send({ days: 30 });

    expect(res.status).toBe(200);

    // Initial 30 seats seeded
    const tenantDoc = await Tenant.findById(newTenant._id);
    expect(tenantDoc?.currentSeatCount).toBe(30);

    const actualSeats = await Seat.countDocuments({ tenantId: newTenant._id });
    expect(actualSeats).toBe(30);
  });

  it('updates currentSeatCount on single and bulk seat deletions', async () => {
    // Create 3 seats on tenant1
    const s1 = await Seat.create({ tenantId: tenant1._id, seatNumber: 'DEL-1', section: 'DelSection', status: 'available' });
    await Seat.create({ tenantId: tenant1._id, seatNumber: 'DEL-2', section: 'DelSection', status: 'available' });
    await Seat.create({ tenantId: tenant1._id, seatNumber: 'DEL-3', section: 'OtherSection', status: 'available' });
    await Tenant.updateOne({ _id: tenant1._id }, { $set: { currentSeatCount: 3 } });

    // Single delete
    const delRes1 = await request(app)
      .delete(`/api/v1/seats/${s1._id}`)
      .set('Cookie', authCookie1);
    expect(delRes1.status).toBe(200);

    let tenantDoc = await Tenant.findById(tenant1._id);
    expect(tenantDoc?.currentSeatCount).toBe(2);

    // Bulk delete section
    const delRes2 = await request(app)
      .delete('/api/v1/seats/section/bulk?section=DelSection')
      .set('Cookie', authCookie1);
    expect(delRes2.status).toBe(200);

    tenantDoc = await Tenant.findById(tenant1._id);
    expect(tenantDoc?.currentSeatCount).toBe(1);

    const remainingSeats = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(remainingSeats).toBe(1);
  });

  it('preserves counter consistency when an operation fails or rolls back', async () => {
    await Tenant.updateOne({ _id: tenant1._id }, { $set: { currentSeatCount: 2 } });
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'ROLL-1', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'ROLL-2', status: 'available' },
    ]);

    // Attempt to insert duplicate seatNumber 'ROLL-1'
    const failRes = await request(app)
      .post('/api/v1/seats')
      .set('Cookie', authCookie1)
      .send({ seatNumber: 'ROLL-1', section: 'Main Hall' });

    expect(failRes.status).toBe(409);

    // Counter must remain 2, not incremented
    const tenantDoc = await Tenant.findById(tenant1._id);
    expect(tenantDoc?.currentSeatCount).toBe(2);
  });

  it('safely handles concurrent initialization and seat creation near limit', async () => {
    // Tenant has maxSeats = 5, has 4 existing seats, but currentSeatCount is uninitialized (missing)
    await Tenant.updateOne({ _id: tenant1._id }, { $unset: { currentSeatCount: 1 } });
    await Seat.create([
      { tenantId: tenant1._id, seatNumber: 'INIT-1', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'INIT-2', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'INIT-3', status: 'available' },
      { tenantId: tenant1._id, seatNumber: 'INIT-4', status: 'available' },
    ]);

    // Send 3 concurrent seat creation requests while counter is uninitialized
    const results = await Promise.all([
      request(app)
        .post('/api/v1/seats')
        .set('Cookie', authCookie1)
        .send({ seatNumber: 'INIT-5A', section: 'Main Hall' }),
      request(app)
        .post('/api/v1/seats')
        .set('Cookie', authCookie1)
        .send({ seatNumber: 'INIT-5B', section: 'Main Hall' }),
      request(app)
        .post('/api/v1/seats')
        .set('Cookie', authCookie1)
        .send({ seatNumber: 'INIT-5C', section: 'Main Hall' }),
    ]);

    const statuses = results.map((r) => r.status);
    const successCount = statuses.filter((s) => s === 201).length;
    const forbiddenCount = statuses.filter((s) => s === 403).length;

    // At most 1 should succeed (reaching 5/5), remaining blocked by quota (403)
    expect(successCount).toBeLessThanOrEqual(1);
    expect(forbiddenCount).toBeGreaterThanOrEqual(2);

    const countInDb = await Seat.countDocuments({ tenantId: tenant1._id });
    expect(countInDb).toBeLessThanOrEqual(5);

    const tenantDoc = await Tenant.findById(tenant1._id);
    expect(tenantDoc?.currentSeatCount).toBe(countInDb);
  });

  it('safely handles concurrent initialization across multiple simulated backend instances', async () => {
    // Unset counter on tenant2 with 7 existing seats
    await Tenant.updateOne({ _id: tenant2._id }, { $unset: { currentSeatCount: 1 } });
    for (let i = 1; i <= 7; i++) {
      await Seat.create({ tenantId: tenant2._id, seatNumber: `MULTI-${i}`, status: 'available' });
    }

    const { initializeMissingTenantSeatCounts } = await import('../services/seatQuota.service');

    // Simulate 4 backend instances starting up and calling initializeMissingTenantSeatCounts concurrently
    await Promise.all([
      initializeMissingTenantSeatCounts(),
      initializeMissingTenantSeatCounts(),
      initializeMissingTenantSeatCounts(),
      initializeMissingTenantSeatCounts(),
    ]);

    const updated = await Tenant.findById(tenant2._id);
    expect(updated?.currentSeatCount).toBe(7);
  });

  it('rolls back counter changes when single deletion fails in transaction', async () => {
    const { Membership } = await import('../models/Membership');
    const { Plan } = await import('../models/Plan');

    const plan = await Plan.create({
      tenantId: tenant1._id,
      name: 'Plan 1',
      seatType: 'reserved',
      feePaise: 50000,
    });

    const s = await Seat.create({ tenantId: tenant1._id, seatNumber: 'NODEL-1', status: 'occupied' });
    await Tenant.updateOne({ _id: tenant1._id }, { $set: { currentSeatCount: 1 } });

    // Active student membership on this seat prevents deletion
    await Membership.create({
      tenantId: tenant1._id,
      studentId: new mongoose.Types.ObjectId(),
      planId: plan._id,
      seatId: s._id,
      seatType: 'reserved',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      feePaise: 50000,
      paidPaise: 50000,
    });

    const delRes = await request(app)
      .delete(`/api/v1/seats/${s._id}`)
      .set('Cookie', authCookie1);

    expect(delRes.status).toBe(400);

    const tenantDoc = await Tenant.findById(tenant1._id);
    expect(tenantDoc?.currentSeatCount).toBe(1);

    const seatInDb = await Seat.findById(s._id);
    expect(seatInDb).not.toBeNull();
  });
});
