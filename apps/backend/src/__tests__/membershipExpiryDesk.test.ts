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
import { Plan } from '../models/Plan';
import { Seat } from '../models/Seat';
import { Student } from '../models/Student';
import { Membership } from '../models/Membership';
import { Payment } from '../models/Payment';
import { syncExpiredMemberships } from '../services/membershipSync.service';
import { getStartOfTodayIST, normalizeDateBoundaries } from '../utils/date';

const TEST_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_test';
const app = createApp();

let authCookie: string;
let tenantId: string;

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
  await Plan.deleteMany({});
  await Seat.deleteMany({});
  await Student.deleteMany({});
  await Membership.deleteMany({});
  await Payment.deleteMany({});

  const t = await Tenant.create({ name: 'Atlas Indore', slug: 'atlas-indore', email: 'owner@atlas.com' });
  tenantId = t._id.toString();
  const hash = await bcrypt.hash('secret123', 4);
  await User.create({ tenantId: t._id, name: 'Owner', email: 'owner@atlas.com', passwordHash: hash, role: 'owner' });

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'owner@atlas.com', password: 'secret123' });
  authCookie = loginRes.headers['set-cookie']?.[0] ?? '';
});

describe('Membership Expiry & Desk Retention Regression Suite', () => {
  it('keeps membership ending today active throughout the day in IST and does not expire it', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'reserved' });
    const seat = await Seat.create({ tenantId, seatNumber: 'D-01', section: 'Main Hall', status: 'available' });
    const student = await Student.create({ tenantId, name: 'Sunil', mobile: '9575626938', membershipNumber: '095' });

    // End date set to today in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const todayStr = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;

    const { startDate, endDate } = normalizeDateBoundaries(todayStr, todayStr);

    const m = await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatId: seat._id,
      seatType: 'reserved',
      startDate,
      endDate,
      status: 'active',
      feePaise: 60000,
      paidPaise: 0,
      paymentStatus: 'pending',
    });

    // Run syncExpiredMemberships
    const expiredCount = await syncExpiredMemberships(tenantId);
    expect(expiredCount).toBe(0);

    const check = await Membership.findById(m._id);
    expect(check?.status).toBe('active');
  });

  it('expires membership only after the expiry day has completely ended in IST', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'reserved' });
    const student = await Student.create({ tenantId, name: 'Sunil', mobile: '9575626938', membershipNumber: '095' });

    // Membership ended yesterday in IST
    const startOfTodayIST = getStartOfTodayIST();
    const yesterdayDate = new Date(startOfTodayIST.getTime() - 24 * 60 * 60 * 1000);

    const m = await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatType: 'non-reserved',
      startDate: new Date(yesterdayDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: yesterdayDate,
      status: 'active',
      feePaise: 60000,
      paidPaise: 60000,
      paymentStatus: 'paid',
    });

    const expiredCount = await syncExpiredMemberships(tenantId);
    expect(expiredCount).toBe(1);

    const check = await Membership.findById(m._id);
    expect(check?.status).toBe('expired');
  });

  it('dashboard stats synchronization does not prematurely expire valid memberships', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'reserved' });
    const seat = await Seat.create({ tenantId, seatNumber: 'D-02', section: 'Main Hall', status: 'occupied' });
    const student = await Student.create({ tenantId, name: 'Sunil', mobile: '9575626938', membershipNumber: '095' });

    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffset);
    const todayStr = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;

    const { startDate, endDate } = normalizeDateBoundaries(todayStr, todayStr);

    const m = await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatId: seat._id,
      seatType: 'reserved',
      startDate,
      endDate,
      status: 'active',
      feePaise: 60000,
      paidPaise: 0,
      paymentStatus: 'pending',
    });

    // Calling dashboard stats triggers syncExpiredMemberships internally
    const dashRes = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Cookie', authCookie);

    expect(dashRes.status).toBe(200);

    const check = await Membership.findById(m._id);
    expect(check?.status).toBe('active');
  });

  it('valid membership continues to keep its assigned desk occupied in listSeats', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'reserved' });
    const seat = await Seat.create({ tenantId, seatNumber: 'D-03', section: 'Main Hall', status: 'available' });
    const student = await Student.create({ tenantId, name: 'Sunil', mobile: '9575626938', membershipNumber: '095' });

    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffset);
    const todayStr = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;
    const { startDate, endDate } = normalizeDateBoundaries(todayStr, todayStr);

    await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatId: seat._id,
      seatType: 'reserved',
      startDate,
      endDate,
      status: 'active',
      feePaise: 60000,
      paidPaise: 0,
      paymentStatus: 'pending',
    });

    // Query seats API
    const seatRes = await request(app)
      .get('/api/v1/seats')
      .set('Cookie', authCookie);

    expect(seatRes.status).toBe(200);
    const foundSeat = seatRes.body.seats.find((s: { _id: string }) => s._id === seat._id.toString());
    expect(foundSeat.status).toBe('occupied');
    expect(foundSeat.occupant.name).toBe('Sunil');
  });

  it('recording a payment preserves active membership and desk allocation on student profile', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'reserved' });
    const seat = await Seat.create({ tenantId, seatNumber: 'D-04', section: 'Main Hall', status: 'available' });
    const student = await Student.create({ tenantId, name: 'Sunil', mobile: '9575626938', membershipNumber: '095' });

    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffset);
    const todayStr = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;
    const { startDate, endDate } = normalizeDateBoundaries(todayStr, todayStr);

    const m = await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatId: seat._id,
      seatType: 'reserved',
      startDate,
      endDate,
      status: 'active',
      feePaise: 60000,
      paidPaise: 0,
      paymentStatus: 'pending',
    });

    // Record payment
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', authCookie)
      .send({
        membershipId: m._id.toString(),
        amountPaise: 60000,
        paymentMethod: 'upi',
        transactionRef: 'UPI-REC-135',
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.payment.receiptNumber).toBeDefined();

    // Student profile query
    const profileRes = await request(app)
      .get(`/api/v1/students/${student._id}`)
      .set('Cookie', authCookie);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.activeMembership).not.toBeNull();
    expect(profileRes.body.activeMembership._id).toBe(m._id.toString());
    expect(profileRes.body.activeMembership.seatId._id).toBe(seat._id.toString());
    expect(profileRes.body.payments).toHaveLength(1);
    expect(profileRes.body.payments[0].receiptNumber).toBe(payRes.body.payment.receiptNumber);

    // Seats query must also remain occupied
    const seatRes = await request(app)
      .get('/api/v1/seats')
      .set('Cookie', authCookie);

    const foundSeat = seatRes.body.seats.find((s: { _id: string }) => s._id === seat._id.toString());
    expect(foundSeat.status).toBe('occupied');
  });

  it('creating a new membership prevents unintentional destruction of an existing valid membership', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'reserved' });
    const seat1 = await Seat.create({ tenantId, seatNumber: 'D-05', section: 'Main Hall', status: 'available' });
    const seat2 = await Seat.create({ tenantId, seatNumber: 'D-06', section: 'Main Hall', status: 'available' });
    const student = await Student.create({ tenantId, name: 'Sunil', mobile: '9575626938', membershipNumber: '095' });

    // Active membership valid for next 30 days
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffset);
    const todayStr = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + istOffset);
    const futureStr = `${futureDate.getUTCFullYear()}-${String(futureDate.getUTCMonth() + 1).padStart(2, '0')}-${String(futureDate.getUTCDate()).padStart(2, '0')}`;

    const { startDate, endDate } = normalizeDateBoundaries(todayStr, futureStr);

    const existingM = await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatId: seat1._id,
      seatType: 'reserved',
      startDate,
      endDate,
      status: 'active',
      feePaise: 60000,
      paidPaise: 60000,
      paymentStatus: 'paid',
    });

    // Attempting to create an overlapping membership without replaceExisting flag should be rejected with 409
    const conflictRes = await request(app)
      .post('/api/v1/memberships')
      .set('Cookie', authCookie)
      .send({
        studentId: student._id.toString(),
        planId: plan._id.toString(),
        seatId: seat2._id.toString(),
        startDate: todayStr,
        endDate: futureStr,
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error).toContain('already has an active membership');

    // Existing membership remains active
    const check1 = await Membership.findById(existingM._id);
    expect(check1?.status).toBe('active');

    // Explicit replacement succeeds
    const replaceRes = await request(app)
      .post('/api/v1/memberships')
      .set('Cookie', authCookie)
      .send({
        studentId: student._id.toString(),
        planId: plan._id.toString(),
        seatId: seat2._id.toString(),
        startDate: todayStr,
        endDate: futureStr,
        replaceExisting: true,
      });

    expect(replaceRes.status).toBe(201);
    const checkOld = await Membership.findById(existingM._id);
    expect(checkOld?.status).toBe('expired');
  });

  it('backward compatibility: legacy UTC midnight ending dates remain valid during the final day', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'non-reserved' });
    const student = await Student.create({ tenantId, name: 'Sunil', mobile: '9575626938', membershipNumber: '095' });

    // Legacy format was setUTCHours(23, 59, 59, 999) on UTC today
    const now = new Date();
    const legacyEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const legacyStartDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate(), 0, 0, 0, 0));

    const m = await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatType: 'non-reserved',
      startDate: legacyStartDate,
      endDate: legacyEndDate,
      status: 'active',
      feePaise: 60000,
      paidPaise: 60000,
      paymentStatus: 'paid',
    });

    const expiredCount = await syncExpiredMemberships(tenantId);
    expect(expiredCount).toBe(0);

    const check = await Membership.findById(m._id);
    expect(check?.status).toBe('active');
  });

  it('renewed student with active membership does not appear in expired memberships filter or dashboard expiredCount', async () => {
    const plan = await Plan.create({ tenantId, name: 'Monthly', feePaise: 60000, durationDays: 30, seatType: 'reserved' });
    const seat = await Seat.create({ tenantId, seatNumber: 'D-16', section: 'Main Hall', status: 'available' });
    const student = await Student.create({ tenantId, name: 'Rahul Badole', mobile: '9891439237', membershipNumber: '016' });

    // 1. Create an expired membership for Rahul (ended 10 days ago)
    const pastEnd = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const pastStart = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

    const oldMembership = await Membership.create({
      tenantId,
      studentId: student._id,
      planId: plan._id,
      seatId: seat._id,
      seatType: 'reserved',
      startDate: pastStart,
      endDate: pastEnd,
      status: 'expired',
      feePaise: 60000,
      paidPaise: 60000,
      paymentStatus: 'paid',
    });

    // Verify Rahul appears in expired filter before renewing
    const beforeFilterRes = await request(app)
      .get('/api/v1/memberships?filter=expired')
      .set('Cookie', authCookie);

    expect(beforeFilterRes.status).toBe(200);
    const expiredStudentIdsBefore = beforeFilterRes.body.memberships.map((m: any) => m.studentId._id.toString());
    expect(expiredStudentIdsBefore).toContain(student._id.toString());

    // Check dashboard before renewal
    const beforeStatsRes = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Cookie', authCookie);
    expect(beforeStatsRes.status).toBe(200);
    const expiredCountBefore = beforeStatsRes.body.stats.expiredCount;
    expect(expiredCountBefore).toBeGreaterThanOrEqual(1);

    // 2. Rahul renews: create new active membership for Rahul
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffset);
    const todayStr = `${istDate.getUTCFullYear()}-${String(istDate.getUTCMonth() + 1).padStart(2, '0')}-${String(istDate.getUTCDate()).padStart(2, '0')}`;
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + istOffset);
    const futureStr = `${futureDate.getUTCFullYear()}-${String(futureDate.getUTCMonth() + 1).padStart(2, '0')}-${String(futureDate.getUTCDate()).padStart(2, '0')}`;

    const renewRes = await request(app)
      .post('/api/v1/memberships')
      .set('Cookie', authCookie)
      .send({
        studentId: student._id.toString(),
        planId: plan._id.toString(),
        seatId: seat._id.toString(),
        startDate: todayStr,
        endDate: futureStr,
        replaceExisting: true,
      });

    expect(renewRes.status).toBe(201);

    // 3. Verify Rahul NO LONGER appears in the expired filter
    const afterFilterRes = await request(app)
      .get('/api/v1/memberships?filter=expired')
      .set('Cookie', authCookie);

    expect(afterFilterRes.status).toBe(200);
    const expiredStudentIdsAfter = afterFilterRes.body.memberships.map((m: any) => m.studentId._id.toString());
    expect(expiredStudentIdsAfter).not.toContain(student._id.toString());

    // 4. Verify dashboard stats expired count decremented by 1
    const afterStatsRes = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Cookie', authCookie);
    expect(afterStatsRes.status).toBe(200);
    expect(afterStatsRes.body.stats.expiredCount).toBe(expiredCountBefore - 1);
  });
});
