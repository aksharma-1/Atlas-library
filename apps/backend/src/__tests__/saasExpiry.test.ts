import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Seat } from '../models/Seat';
import { Student } from '../models/Student';
import { Membership } from '../models/Membership';
import { SaasPlan } from '../models/SaasPlan';
import { SaasPayment } from '../models/SaasPayment';
import { syncExpiredSaasSubscriptions } from '../services/saasExpirySync.service';
import { AUTH_COOKIE } from '../controllers/auth.controller';
import { env } from '../config/env';
import type { AuthUser } from '@atlas/shared';

const TEST_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_test';
const app = createApp();

function signUserToken(user: Partial<AuthUser>): string {
  const payload: AuthUser = {
    userId: user.userId || new mongoose.Types.ObjectId().toString(),
    role: user.role || 'owner',
    name: user.name || 'Test User',
    email: user.email || 'user@example.com',
    tenantId: user.tenantId,
    tenantName: user.tenantName || 'Test Library',
    subscriptionStatus: user.subscriptionStatus || 'active',
    subscriptionTier: user.subscriptionTier || 'growth',
    onboardingStep: user.onboardingStep || 'completed',
    isActive: user.isActive !== undefined ? user.isActive : true,
    maxSeats: user.maxSeats || 100,
    ...user,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1d' });
}

describe('Phase 2 — Task 3: Subscription Expiry Enforcement', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_URI);
    }
  });

  afterAll(async () => {
    await SaasPayment.deleteMany({});
    await Seat.deleteMany({});
    await Student.deleteMany({});
    await Membership.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await SaasPlan.deleteMany({});
  });

  beforeEach(async () => {
    await SaasPayment.deleteMany({});
    await Seat.deleteMany({});
    await Student.deleteMany({});
    await Membership.deleteMany({});
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await SaasPlan.deleteMany({});

    await SaasPlan.create([
      { code: 'starter', name: 'Starter Plan', monthlyPrice: 499, maxDesks: 30, isActive: true },
      { code: 'growth', name: 'Growth Plan', monthlyPrice: 999, maxDesks: 80, isActive: true },
    ]);
  });

  it('blocks expired owner access to protected library APIs with 402 SUBSCRIPTION_EXPIRED', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const tenant = await Tenant.create({
      name: 'Expired Owner Library',
      slug: 'expired-owner-lib',
      email: 'owner-lib@expired.com',
      isActive: true,
      onboardingStep: 'completed',
      subscriptionTier: 'growth',
      subscriptionStatus: 'active', // Marked active but expired timestamp
      subscriptionExpiresAt: pastDate,
      maxSeats: 80,
      currentSeatCount: 5,
    });

    const owner = await User.create({
      tenantId: tenant._id,
      name: 'Library Owner',
      email: 'owner@expired.com',
      passwordHash: 'dummyhash',
      role: 'owner',
    });

    const cookie = signUserToken({
      userId: owner._id.toString(),
      role: 'owner',
      tenantId: tenant._id.toString(),
      subscriptionStatus: 'active',
    });

    const res = await request(app)
      .get('/api/v1/seats')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`);

    expect(res.status).toBe(402);
    expect(res.body.code).toBe('SUBSCRIPTION_EXPIRED');
    expect(res.body.error).toMatch(/subscription has expired/i);
    expect(res.body.subscriptionExpiresAt).toBe(pastDate.toISOString());

    // Verify inline transition to past_due in the database
    const refreshed = await Tenant.findById(tenant._id);
    expect(refreshed?.subscriptionStatus).toBe('past_due');
  });

  it('blocks expired staff access to protected library APIs with 402 SUBSCRIPTION_EXPIRED', async () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const tenant = await Tenant.create({
      name: 'Expired Staff Library',
      slug: 'expired-staff-lib',
      email: 'staff-lib@expired.com',
      isActive: true,
      onboardingStep: 'completed',
      subscriptionTier: 'starter',
      subscriptionStatus: 'past_due',
      subscriptionExpiresAt: pastDate,
      maxSeats: 30,
      currentSeatCount: 2,
    });

    const staff = await User.create({
      tenantId: tenant._id,
      name: 'Staff Member',
      email: 'staff@expired.com',
      passwordHash: 'dummyhash',
      role: 'staff',
    });

    const cookie = signUserToken({
      userId: staff._id.toString(),
      role: 'staff',
      tenantId: tenant._id.toString(),
      subscriptionStatus: 'past_due',
    });

    const res = await request(app)
      .get('/api/v1/students')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`);

    expect(res.status).toBe(402);
    expect(res.body.code).toBe('SUBSCRIPTION_EXPIRED');
    expect(res.body.error).toMatch(/subscription has expired/i);
    expect(res.body.subscriptionExpiresAt).toBe(pastDate.toISOString());
  });

  it('allows access when subscription is active and validity date is in the future', async () => {
    const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days future
    const tenant = await Tenant.create({
      name: 'Valid Active Library',
      slug: 'valid-lib',
      email: 'valid-lib@active.com',
      isActive: true,
      onboardingStep: 'completed',
      subscriptionTier: 'growth',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: futureDate,
      maxSeats: 80,
      currentSeatCount: 1,
    });

    await Seat.create({
      tenantId: tenant._id,
      seatNumber: 'A-01',
      section: 'Main Hall',
      status: 'available',
    });

    const owner = await User.create({
      tenantId: tenant._id,
      name: 'Active Owner',
      email: 'owner@valid.com',
      passwordHash: 'dummyhash',
      role: 'owner',
    });

    const cookie = signUserToken({
      userId: owner._id.toString(),
      role: 'owner',
      tenantId: tenant._id.toString(),
      subscriptionStatus: 'active',
    });

    const res = await request(app)
      .get('/api/v1/seats')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`);

    expect(res.status).toBe(200);
    expect(res.body.seats).toHaveLength(1);
    expect(res.body.seats[0].seatNumber).toBe('A-01');
  });

  it('allows Super Admin full access regardless of any tenant subscription expiration', async () => {
    const superAdmin = await User.create({
      name: 'Platform Super Admin',
      email: 'superadmin@atlas.com',
      passwordHash: 'dummyhash',
      role: 'superadmin',
    });

    const cookie = signUserToken({
      userId: superAdmin._id.toString(),
      role: 'superadmin',
    });

    const res = await request(app)
      .get('/api/v1/superadmin/tenants')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tenants)).toBe(true);
  });

  it('reconciles expired active subscriptions to past_due via syncExpiredSaasSubscriptions', async () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const t1 = await Tenant.create({
      name: 'Expired Tenant 1',
      slug: 'exp-1',
      email: 'exp1@lib.com',
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: pastDate,
      maxSeats: 50,
    });

    const t2 = await Tenant.create({
      name: 'Active Tenant 2',
      slug: 'act-2',
      email: 'act2@lib.com',
      isActive: true,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: futureDate,
      maxSeats: 50,
    });

    const t3 = await Tenant.create({
      name: 'Already Past Due Tenant 3',
      slug: 'pd-3',
      email: 'pd3@lib.com',
      isActive: true,
      subscriptionStatus: 'past_due',
      subscriptionExpiresAt: pastDate,
      maxSeats: 50,
    });

    const modified = await syncExpiredSaasSubscriptions();
    expect(modified).toBe(1);

    const refreshed1 = await Tenant.findById(t1._id);
    expect(refreshed1?.subscriptionStatus).toBe('past_due');

    const refreshed2 = await Tenant.findById(t2._id);
    expect(refreshed2?.subscriptionStatus).toBe('active');

    const refreshed3 = await Tenant.findById(t3._id);
    expect(refreshed3?.subscriptionStatus).toBe('past_due');
  });

  it('allows past_due tenant to submit renewal payment UTR without resetting onboarding or data', async () => {
    const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const tenant = await Tenant.create({
      name: 'Renewal Tenant',
      slug: 'renewal-tenant',
      email: 'renewal@tenant.com',
      isActive: true,
      onboardingStep: 'completed',
      subscriptionTier: 'growth',
      subscriptionStatus: 'past_due',
      subscriptionExpiresAt: pastDate,
      maxSeats: 80,
      currentSeatCount: 15,
    });

    // Existing seats and student memberships
    const s1 = await Seat.create({
      tenantId: tenant._id,
      seatNumber: 'DESK-01',
      section: 'Main Study Hall',
      status: 'occupied',
    });

    const owner = await User.create({
      tenantId: tenant._id,
      name: 'Renewal Owner',
      email: 'owner@renewal.com',
      passwordHash: 'dummyhash',
      role: 'owner',
    });

    const cookie = signUserToken({
      userId: owner._id.toString(),
      role: 'owner',
      tenantId: tenant._id.toString(),
      subscriptionStatus: 'past_due',
    });

    const submitRes = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`)
      .send({
        tier: 'growth',
        billingCycle: 'monthly',
        utr: 'RENEWAL-UTR-99991111',
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.user.subscriptionStatus).toBe('pending_approval');

    const updatedTenant = await Tenant.findById(tenant._id);
    expect(updatedTenant?.subscriptionStatus).toBe('pending_approval');
    expect(updatedTenant?.onboardingStep).toBe('completed'); // Not reset to profile or config
    expect(updatedTenant?.currentSeatCount).toBe(15); // Unchanged

    // Check existing seat is untouched
    const seatCheck = await Seat.findById(s1._id);
    expect(seatCheck).toBeTruthy();
    expect(seatCheck?.status).toBe('occupied');

    // Super Admin approves subscription for 30 days
    const superAdmin = await User.create({
      name: 'Approver Super Admin',
      email: 'admin@approver.com',
      passwordHash: 'dummyhash',
      role: 'superadmin',
    });

    const saCookie = signUserToken({
      userId: superAdmin._id.toString(),
      role: 'superadmin',
    });

    const approveRes = await request(app)
      .post(`/api/v1/superadmin/tenants/${tenant._id}/approve`)
      .set('Cookie', `${AUTH_COOKIE}=${saCookie}`)
      .send({ days: 30 });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.tenant.subscriptionStatus).toBe('active');

    const activeTenant = await Tenant.findById(tenant._id);
    expect(activeTenant?.subscriptionStatus).toBe('active');
    expect(activeTenant?.subscriptionExpiresAt).toBeDefined();

    // Verify expiry was calculated starting from today (since it was expired), extending ~30 days
    const newExpiry = new Date(activeTenant!.subscriptionExpiresAt!);
    const now = new Date();
    const diffDays = Math.round((newExpiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);

    // Verify seat records and count were preserved without creating duplicate default seats
    const totalSeats = await Seat.countDocuments({ tenantId: tenant._id });
    expect(totalSeats).toBe(1); // Didn't re-seed 30 default desks because seats already existed
  });

  it('allows active tenant with future expiry to submit renewal UTR without losing API access', async () => {
    const futureExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days remaining
    const tenant = await Tenant.create({
      name: 'Active Renewer Library',
      slug: 'active-renewer-lib',
      email: 'renewer@active.com',
      isActive: true,
      onboardingStep: 'completed',
      subscriptionTier: 'growth',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: futureExpiry,
      maxSeats: 80,
      currentSeatCount: 3,
    });

    await Seat.create({
      tenantId: tenant._id,
      seatNumber: 'A-01',
      section: 'Main Hall',
      status: 'available',
    });

    const owner = await User.create({
      tenantId: tenant._id,
      name: 'Active Renewer Owner',
      email: 'owner@renewer.com',
      passwordHash: 'dummyhash',
      role: 'owner',
    });

    const cookie = signUserToken({
      userId: owner._id.toString(),
      role: 'owner',
      tenantId: tenant._id.toString(),
      subscriptionStatus: 'active',
    });

    // 1. Submit renewal payment UTR before expiration
    const submitRes = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`)
      .send({
        tier: 'growth',
        billingCycle: 'monthly',
        utr: 'EARLY-RENEWAL-UTR-12345',
      });

    expect(submitRes.status).toBe(200);
    // User and tenant must remain 'active' so access is NOT interrupted
    expect(submitRes.body.user.subscriptionStatus).toBe('active');

    const refreshedTenant = await Tenant.findById(tenant._id);
    expect(refreshedTenant?.subscriptionStatus).toBe('active');
    expect(refreshedTenant?.subscriptionExpiresAt?.toISOString()).toBe(futureExpiry.toISOString());

    // 2. Verify protected library APIs remain accessible immediately
    const seatsRes = await request(app)
      .get('/api/v1/seats')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`);

    expect(seatsRes.status).toBe(200);
    expect(seatsRes.body.seats).toHaveLength(1);

    // 3. Verify a pending SaasPayment record exists
    const pendingPayment = await SaasPayment.findOne({
      tenantId: tenant._id,
      utr: 'EARLY-RENEWAL-UTR-12345',
    });
    expect(pendingPayment).toBeTruthy();
    expect(pendingPayment?.status).toBe('pending');

    // 4. Super Admin approves renewal for 30 days
    const superAdmin = await User.create({
      name: 'Super Admin Approver',
      email: 'super@approver2.com',
      passwordHash: 'dummyhash',
      role: 'superadmin',
    });

    const saCookie = signUserToken({
      userId: superAdmin._id.toString(),
      role: 'superadmin',
    });

    const approveRes = await request(app)
      .post(`/api/v1/superadmin/tenants/${tenant._id}/approve`)
      .set('Cookie', `${AUTH_COOKIE}=${saCookie}`)
      .send({ days: 30 });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.tenant.subscriptionStatus).toBe('active');

    // Expiry should extend from existing futureExpiry (+ 30 days = ~40 days from now)
    const activeTenantAfterApprove = await Tenant.findById(tenant._id);
    const newExpiry = new Date(activeTenantAfterApprove!.subscriptionExpiresAt!);
    const expectedExpiry = new Date(futureExpiry);
    expectedExpiry.setDate(expectedExpiry.getDate() + 30);

    expect(Math.abs(newExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(5000);
  });

  it('preserves active subscription access if Super Admin rejects a premature renewal', async () => {
    const futureExpiry = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000); // 8 days remaining
    const tenant = await Tenant.create({
      name: 'Reject Active Renewer Library',
      slug: 'reject-active-renewer',
      email: 'reject-renewer@active.com',
      isActive: true,
      onboardingStep: 'completed',
      subscriptionTier: 'growth',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: futureExpiry,
      maxSeats: 80,
      currentSeatCount: 1,
    });

    const owner = await User.create({
      tenantId: tenant._id,
      name: 'Reject Owner',
      email: 'owner@rejectactive.com',
      passwordHash: 'dummyhash',
      role: 'owner',
    });

    const cookie = signUserToken({
      userId: owner._id.toString(),
      role: 'owner',
      tenantId: tenant._id.toString(),
      subscriptionStatus: 'active',
    });

    // Submit renewal UTR
    await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`)
      .send({
        tier: 'growth',
        billingCycle: 'monthly',
        utr: 'INVALID-EARLY-RENEWAL-999',
      });

    // Super Admin rejects the renewal submission
    const superAdmin = await User.create({
      name: 'Super Admin Rejector',
      email: 'super@rejector.com',
      passwordHash: 'dummyhash',
      role: 'superadmin',
    });

    const saCookie = signUserToken({
      userId: superAdmin._id.toString(),
      role: 'superadmin',
    });

    const rejectRes = await request(app)
      .post(`/api/v1/superadmin/tenants/${tenant._id}/reject`)
      .set('Cookie', `${AUTH_COOKIE}=${saCookie}`)
      .send({ reason: 'Invalid UTR reference not found on bank statement' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.tenant.subscriptionStatus).toBe('active'); // Still active!

    // Verify tenant still retains access to protected APIs
    const seatsRes = await request(app)
      .get('/api/v1/seats')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`);

    expect(seatsRes.status).toBe(200);

    // Verify rejected SaasPayment record
    const payment = await SaasPayment.findOne({ utr: 'INVALID-EARLY-RENEWAL-999' });
    expect(payment?.status).toBe('rejected');
    expect(payment?.rejectionReason).toContain('Invalid UTR reference');
  });

  it('keeps past_due tenant blocked if Super Admin rejects renewal', async () => {
    const pastExpiry = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const tenant = await Tenant.create({
      name: 'Reject PastDue Library',
      slug: 'reject-pastdue-lib',
      email: 'reject-pastdue@lib.com',
      isActive: true,
      onboardingStep: 'completed',
      subscriptionTier: 'growth',
      subscriptionStatus: 'past_due',
      subscriptionExpiresAt: pastExpiry,
      maxSeats: 80,
    });

    const owner = await User.create({
      tenantId: tenant._id,
      name: 'PastDue Owner',
      email: 'owner@pastdue-reject.com',
      passwordHash: 'dummyhash',
      role: 'owner',
    });

    const cookie = signUserToken({
      userId: owner._id.toString(),
      role: 'owner',
      tenantId: tenant._id.toString(),
      subscriptionStatus: 'past_due',
    });

    // Submit renewal UTR
    const submitRes = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`)
      .send({
        tier: 'growth',
        billingCycle: 'monthly',
        utr: 'PASTDUE-RENEW-FAILED-111',
      });

    expect(submitRes.body.user.subscriptionStatus).toBe('pending_approval');

    // Super Admin rejects
    const superAdmin = await User.create({
      name: 'Super Admin Rejector 2',
      email: 'super@rejector2.com',
      passwordHash: 'dummyhash',
      role: 'superadmin',
    });

    const saCookie = signUserToken({
      userId: superAdmin._id.toString(),
      role: 'superadmin',
    });

    const rejectRes = await request(app)
      .post(`/api/v1/superadmin/tenants/${tenant._id}/reject`)
      .set('Cookie', `${AUTH_COOKIE}=${saCookie}`)
      .send({ reason: 'Bank transaction bounced' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.tenant.subscriptionStatus).toBe('pending_payment');

    // Blocked on protected API
    const seatsRes = await request(app)
      .get('/api/v1/seats')
      .set('Cookie', `${AUTH_COOKIE}=${cookie}`);

    expect(seatsRes.status).toBe(402);
  });
});
