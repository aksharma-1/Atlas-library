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
  const cookies = loginRes.headers['set-cookie'];
  authCookie = Array.isArray(cookies) ? cookies[0] : (cookies ? String(cookies) : '');
});

describe('Student Registration & Profile', () => {
  it('registers a student and retrieves their profile', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set('Cookie', authCookie)
      .send({
        name: 'Rahul Sharma',
        mobile: '9876543210',
        email: 'rahul@example.com',
        address: 'Vijay Nagar, Indore',
      });

    expect(res.status).toBe(201);
    expect(res.body.student.name).toBe('Rahul Sharma');
    expect(res.body.student.membershipNumber).toMatch(/^MEM-/);

    const studentId = res.body.student._id;
    const profileRes = await request(app)
      .get(`/api/v1/students/${studentId}`)
      .set('Cookie', authCookie);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.student.name).toBe('Rahul Sharma');
  });
});

describe('Membership Allocation & Seat Conflict Prevention', () => {
  it('prevents overlapping reserved seat bookings (conflict check)', async () => {
    // Setup Seat and Plan
    const seat = await Seat.create({ tenantId, seatNumber: '42', status: 'available' });
    const plan = await Plan.create({ tenantId, name: 'Reserved Monthly', seatType: 'reserved', feePaise: 60000 });

    const student1 = await Student.create({ tenantId, name: 'Student One', mobile: '9000000001', membershipNumber: 'MEM-0001' });
    const student2 = await Student.create({ tenantId, name: 'Student Two', mobile: '9000000002', membershipNumber: 'MEM-0002' });

    // Assign Seat 42 to Student 1
    const m1Res = await request(app)
      .post('/api/v1/memberships')
      .set('Cookie', authCookie)
      .send({
        studentId: student1._id.toString(),
        planId: plan._id.toString(),
        seatId: seat._id.toString(),
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      });

    expect(m1Res.status).toBe(201);
    expect(m1Res.body.membership.feePaise).toBe(60000);

    // Verify seat is now occupied
    const seatCheck = await Seat.findById(seat._id);
    expect(seatCheck?.status).toBe('occupied');

    // Attempt to assign the same Seat 42 to Student 2 for overlapping period
    const conflictRes = await request(app)
      .post('/api/v1/memberships')
      .set('Cookie', authCookie)
      .send({
        studentId: student2._id.toString(),
        planId: plan._id.toString(),
        seatId: seat._id.toString(),
        startDate: '2026-11-15',
        endDate: '2026-12-15',
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error).toContain('already reserved');
  });
});

describe('Payment Collection & Idempotency', () => {
  it('records fee payments in integer paise and handles idempotency', async () => {
    const student = await Student.create({ tenantId, name: 'Amit Verma', mobile: '9111111111', membershipNumber: 'MEM-0010' });
    const plan = await Plan.create({ tenantId, name: 'Full Day', seatType: 'non-reserved', feePaise: 50000 });

    const mRes = await request(app)
      .post('/api/v1/memberships')
      .set('Cookie', authCookie)
      .send({
        studentId: student._id.toString(),
        planId: plan._id.toString(),
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      });

    const membershipId = mRes.body.membership._id;

    // Partial Payment: ₹200 (20,000 paise)
    const payRes1 = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', authCookie)
      .send({
        membershipId,
        amountPaise: 20000,
        paymentMethod: 'upi',
        idempotencyKey: 'idemp-key-1001',
        transactionRef: 'UPI-REF-999',
      });

    expect(payRes1.status).toBe(201);
    expect(payRes1.body.payment.amountPaise).toBe(20000);
    expect(payRes1.body.updatedMembership.paidPaise).toBe(20000);
    expect(payRes1.body.updatedMembership.paymentStatus).toBe('partial');

    // Replay same idempotency request
    const replayRes = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', authCookie)
      .send({
        membershipId,
        amountPaise: 20000,
        paymentMethod: 'upi',
        idempotencyKey: 'idemp-key-1001',
      });

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.note).toBe('Idempotent replay');

    // Complete payment: ₹300 (30,000 paise)
    const payRes2 = await request(app)
      .post('/api/v1/payments')
      .set('Cookie', authCookie)
      .send({
        membershipId,
        amountPaise: 30000,
        paymentMethod: 'cash',
      });

    expect(payRes2.status).toBe(201);
    expect(payRes2.body.updatedMembership.paidPaise).toBe(50000);
    expect(payRes2.body.updatedMembership.paymentStatus).toBe('paid');
  });
});
