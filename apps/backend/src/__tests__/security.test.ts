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
import { Student } from '../models/Student';
import { Seat } from '../models/Seat';
import { Shift } from '../models/Shift';
import { Plan } from '../models/Plan';
import { Membership } from '../models/Membership';
import { Payment } from '../models/Payment';
import { AUTH_COOKIE } from '../controllers/auth.controller';

const TEST_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_test';
const app = createApp();

describe('Phase 1 Security Hardening: Tenant Isolation & Access Control', () => {
  let tenantA: any;
  let tenantB: any;
  let userA: any;
  let userB: any;
  let staffA: any;
  let superadminUser: any;
  let cookieA: string;
  let cookieB: string;
  let cookieStaffA: string;
  let cookieSuperadmin: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_URI);
    }
  });

  afterAll(async () => {
    await Tenant.deleteMany({ slug: { $in: ['tenant-alpha', 'tenant-beta'] } });
    await User.deleteMany({ email: { $in: ['alpha@lib.com', 'beta@lib.com', 'staffalpha@lib.com', 'super@admin.com'] } });
    await Student.deleteMany({});
    await Seat.deleteMany({});
    await Shift.deleteMany({});
    await Plan.deleteMany({});
    await Membership.deleteMany({});
    await Payment.deleteMany({});
  });

  beforeEach(async () => {
    // Clean collections
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Student.deleteMany({});
    await Seat.deleteMany({});
    await Shift.deleteMany({});
    await Plan.deleteMany({});
    await Membership.deleteMany({});
    await Payment.deleteMany({});

    const passwordHash = await bcrypt.hash('Secret123!', 10);

    // Tenant Alpha
    tenantA = await Tenant.create({
      name: 'Alpha Library',
      slug: 'tenant-alpha',
      email: 'alpha@lib.com',
      isActive: true,
      subscriptionStatus: 'active',
    });

    userA = await User.create({
      tenantId: tenantA._id,
      name: 'Alpha Owner',
      email: 'alpha@lib.com',
      passwordHash,
      role: 'owner',
      isActive: true,
    });

    staffA = await User.create({
      tenantId: tenantA._id,
      name: 'Alpha Staff',
      email: 'staffalpha@lib.com',
      passwordHash,
      role: 'staff',
      isActive: true,
    });

    // Tenant Beta
    tenantB = await Tenant.create({
      name: 'Beta Library',
      slug: 'tenant-beta',
      email: 'beta@lib.com',
      isActive: true,
      subscriptionStatus: 'active',
    });

    userB = await User.create({
      tenantId: tenantB._id,
      name: 'Beta Owner',
      email: 'beta@lib.com',
      passwordHash,
      role: 'owner',
      isActive: true,
    });

    // Standalone Super Admin
    superadminUser = await User.create({
      name: 'Root SuperAdmin',
      email: 'super@admin.com',
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    // Auth tokens
    const sign = (u: any, tId?: string) =>
      jwt.sign(
        {
          userId: u._id.toString(),
          tenantId: tId,
          name: u.name,
          email: u.email,
          role: u.role,
          subscriptionStatus: 'active',
          onboardingStep: 'completed',
        },
        env.JWT_SECRET,
        { expiresIn: '1h' },
      );

    cookieA = `${AUTH_COOKIE}=${sign(userA, tenantA._id.toString())}`;
    cookieB = `${AUTH_COOKIE}=${sign(userB, tenantB._id.toString())}`;
    cookieStaffA = `${AUTH_COOKIE}=${sign(staffA, tenantA._id.toString())}`;
    cookieSuperadmin = `${AUTH_COOKIE}=${sign(superadminUser)}`;
  });

  // ── Scope 1 & 4: Super Admin Role Guard Tests ──────────────────────────────
  describe('Scope 1 & 4: Super Admin Access Control', () => {
    it('allows superadmin user to access /api/v1/superadmin/tenants', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/tenants')
        .set('Cookie', cookieSuperadmin);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tenants)).toBe(true);
      expect(res.body.tenants.length).toBe(2);
    });

    it('rejects normal library owner (Tenant A) from accessing superadmin endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/tenants')
        .set('Cookie', cookieA);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/super-admin privileges required/i);
    });

    it('rejects staff user from accessing superadmin endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/tenants')
        .set('Cookie', cookieStaffA);
      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated request to superadmin with 401', async () => {
      const res = await request(app).get('/api/v1/superadmin/tenants');
      expect(res.status).toBe(401);
    });
  });

  // ── Scope 3 & 4: Cross-Tenant Isolation Tests ──────────────────────────────
  describe('Scope 3 & 4: Tenant Data Isolation & Boundary Enforcement', () => {
    it('prevents Tenant B from viewing or accessing Tenant A student', async () => {
      const studentA = await Student.create({
        tenantId: tenantA._id,
        name: 'Alpha Student 1',
        mobile: '9876543210',
        membershipNumber: 'ALP-001',
      });

      // Tenant A can see student A
      const resA = await request(app)
        .get(`/api/v1/students/${studentA._id}`)
        .set('Cookie', cookieA);
      expect(resA.status).toBe(200);
      expect(resA.body.student.name).toBe('Alpha Student 1');

      // Tenant B attempts to read student A
      const resB = await request(app)
        .get(`/api/v1/students/${studentA._id}`)
        .set('Cookie', cookieB);
      expect(resB.status).toBe(404);
      expect(resB.body.error).toMatch(/not found/i);
    });

    it('prevents Tenant B from editing or deleting Tenant A student', async () => {
      const studentA = await Student.create({
        tenantId: tenantA._id,
        name: 'Target Student',
        mobile: '9876543211',
        membershipNumber: 'ALP-002',
      });

      // Cross-tenant update attempt
      const editRes = await request(app)
        .put(`/api/v1/students/${studentA._id}`)
        .set('Cookie', cookieB)
        .send({ name: 'Hacked Name' });
      expect(editRes.status).toBe(404);

      // Verify name unchanged
      const fresh = await Student.findById(studentA._id);
      expect(fresh?.name).toBe('Target Student');

      // Cross-tenant delete attempt
      const delRes = await request(app)
        .delete(`/api/v1/students/${studentA._id}`)
        .set('Cookie', cookieB);
      expect(delRes.status).toBe(404);

      // Verify still exists
      const stillExists = await Student.findById(studentA._id);
      expect(stillExists).not.toBeNull();
    });

    it('prevents Tenant B from allocating Tenant A student or seat into their membership', async () => {
      const studentA = await Student.create({
        tenantId: tenantA._id,
        name: 'Student A',
        mobile: '9876543212',
        membershipNumber: 'ALP-003',
      });

      const planB = await Plan.create({
        tenantId: tenantB._id,
        name: 'Plan Beta',
        seatType: 'non-reserved',
        feePaise: 50000,
        isActive: true,
      });

      // Tenant B tries to bind Tenant A's student to Tenant B's plan
      const res = await request(app)
        .post('/api/v1/memberships')
        .set('Cookie', cookieB)
        .send({
          studentId: studentA._id.toString(),
          planId: planB._id.toString(),
          startDate: '2026-11-01',
          endDate: '2026-11-30',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/student not found/i);
    });

    it('prevents cross-tenant payment reversal/deletion', async () => {
      const studentA = await Student.create({
        tenantId: tenantA._id,
        name: 'Student A',
        mobile: '9876543213',
        membershipNumber: 'ALP-004',
      });

      const planA = await Plan.create({
        tenantId: tenantA._id,
        name: 'Plan Alpha',
        seatType: 'non-reserved',
        feePaise: 60000,
        isActive: true,
      });

      const membershipA = await Membership.create({
        tenantId: tenantA._id,
        studentId: studentA._id,
        planId: planA._id,
        seatType: 'non-reserved',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-30'),
        feePaise: 60000,
        paidPaise: 60000,
        status: 'active',
        paymentStatus: 'paid',
      });

      const paymentA = await Payment.create({
        tenantId: tenantA._id,
        membershipId: membershipA._id,
        studentId: studentA._id,
        receiptNumber: 'REC-ALPHA-01',
        amountPaise: 60000,
        paymentMethod: 'cash',
      });

      // Tenant B attempts to delete Tenant A's payment
      const resB = await request(app)
        .delete(`/api/v1/payments/${paymentA._id}`)
        .set('Cookie', cookieB);
      expect(resB.status).toBe(404);

      // Verify payment still exists in DB
      const checkPayment = await Payment.findById(paymentA._id);
      expect(checkPayment).not.toBeNull();
    });
  });

  // ── Scope 4: Session Expiry & Token Security ──────────────────────────────
  describe('Scope 4: Session Expiration & Signature Tampering', () => {
    it('rejects expired JWT token with 401', async () => {
      const expiredToken = jwt.sign(
        {
          userId: userA._id.toString(),
          tenantId: tenantA._id.toString(),
          name: userA.name,
          email: userA.email,
          role: 'owner',
        },
        env.JWT_SECRET,
        { expiresIn: '-10s' }, // Expired 10 seconds ago
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', `${AUTH_COOKIE}=${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid or expired session/i);
    });

    it('rejects token signed with an invalid secret with 401', async () => {
      const tamperedToken = jwt.sign(
        {
          userId: userA._id.toString(),
          tenantId: tenantA._id.toString(),
          role: 'superadmin', // Privilege escalation attempt
        },
        'malicious-attacker-secret-key-12345',
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', `${AUTH_COOKIE}=${tamperedToken}`);
      expect(res.status).toBe(401);
    });

    it('verifies logout successfully clears cookie with path=/', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toMatch(new RegExp(`${AUTH_COOKIE}=;`));
      expect(setCookie[0]).toMatch(/path=\//i);
    });
  });
});
