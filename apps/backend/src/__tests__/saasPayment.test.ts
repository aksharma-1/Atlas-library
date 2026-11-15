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
import { SaasPlan } from '../models/SaasPlan';
import { SaasPayment } from '../models/SaasPayment';
import { PlatformConfig } from '../models/PlatformConfig';
import { AUTH_COOKIE } from '../controllers/auth.controller';

const TEST_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_test';
const app = createApp();

describe('Phase 2 — Task 1: SaaS Payment History Foundation', () => {
  let tenant: any;
  let ownerUser: any;
  let superadminUser: any;
  let ownerCookie: string;
  let superadminCookie: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_URI);
    }
  });

  afterAll(async () => {
    await Tenant.deleteMany({ slug: 'saas-audit-lib' });
    await User.deleteMany({ email: { $in: ['saasowner@lib.com', 'saassuper@admin.com'] } });
    await SaasPlan.deleteMany({});
    await SaasPayment.deleteMany({});
    await PlatformConfig.deleteMany({});
  });

  beforeEach(async () => {
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await SaasPlan.deleteMany({});
    await SaasPayment.deleteMany({});
    await PlatformConfig.deleteMany({});

    // Seed SaasPlans
    await SaasPlan.create([
      {
        code: 'starter',
        name: 'Starter Space',
        monthlyPrice: 499,
        maxDesks: 50,
        features: ['50 Desks'],
        isActive: true,
        sortOrder: 1,
      },
      {
        code: 'growth',
        name: 'Growth Library',
        monthlyPrice: 999,
        maxDesks: 150,
        features: ['150 Desks'],
        isActive: true,
        sortOrder: 2,
      },
    ]);

    await PlatformConfig.create({
      key: 'global',
      yearlyDiscountPercent: 20,
      upiId: 'studyspace@upi',
      upiName: 'StudySpace Master',
    });

    const passwordHash = await bcrypt.hash('Secret123!', 10);

    tenant = await Tenant.create({
      name: 'Audit Library',
      slug: 'saas-audit-lib',
      email: 'saasowner@lib.com',
      isActive: true,
      subscriptionStatus: 'pending_payment',
      onboardingStep: 'subscription',
    });

    ownerUser = await User.create({
      tenantId: tenant._id,
      name: 'Audit Owner',
      email: 'saasowner@lib.com',
      passwordHash,
      role: 'owner',
      isActive: true,
    });

    superadminUser = await User.create({
      name: 'Audit SuperAdmin',
      email: 'saassuper@admin.com',
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    const sign = (u: any, tId?: string) =>
      jwt.sign(
        {
          userId: u._id.toString(),
          tenantId: tId,
          name: u.name,
          email: u.email,
          role: u.role,
          subscriptionStatus: tenant.subscriptionStatus,
          onboardingStep: tenant.onboardingStep,
        },
        env.JWT_SECRET,
        { expiresIn: '1h' },
      );

    ownerCookie = `${AUTH_COOKIE}=${sign(ownerUser, tenant._id.toString())}`;
    superadminCookie = `${AUTH_COOKIE}=${sign(superadminUser)}`;
  });

  it('creates an immutable SaasPayment record when tenant submits UPI UTR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', ownerCookie)
      .send({
        tier: 'growth',
        billingCycle: 'monthly',
        utr: '123456789012',
      });

    expect(res.status).toBe(200);
    expect(res.body.paymentId).toBeDefined();

    // Verify record in SaasPayment collection
    const payment = await SaasPayment.findById(res.body.paymentId);
    expect(payment).not.toBeNull();
    expect(payment?.tenantId.toString()).toBe(tenant._id.toString());
    expect(payment?.planCode).toBe('growth');
    expect(payment?.planName).toBe('Growth Library');
    expect(payment?.amountPaise).toBe(99900); // 999 * 100
    expect(payment?.billingCycle).toBe('monthly');
    expect(payment?.utr).toBe('123456789012');
    expect(payment?.status).toBe('pending');
    expect(payment?.submittedAt).toBeDefined();
  });

  it('calculates discounted yearly amount correctly in SaasPayment', async () => {
    const res = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', ownerCookie)
      .send({
        tier: 'growth',
        billingCycle: 'yearly',
        utr: '998877665544',
      });

    expect(res.status).toBe(200);

    const payment = await SaasPayment.findById(res.body.paymentId);
    // 999 * 12 = 11988, 20% off = 9590.4 -> Math.round = 9590 -> 959000 paise
    expect(payment?.amountPaise).toBe(959000);
    expect(payment?.billingCycle).toBe('yearly');
  });

  it('updates payment status to approved and sets decision metadata when super-admin approves', async () => {
    // 1. Submit payment
    const submitRes = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', ownerCookie)
      .send({
        tier: 'growth',
        utr: 'UTR-APPROVE-111',
      });
    expect(submitRes.status).toBe(200);

    // 2. Super admin approves for 30 days
    const approveRes = await request(app)
      .post(`/api/v1/superadmin/tenants/${tenant._id}/approve`)
      .set('Cookie', superadminCookie)
      .send({ days: 30, tier: 'growth' });
    expect(approveRes.status).toBe(200);

    // 3. Verify SaasPayment audit update
    const payment = await SaasPayment.findById(submitRes.body.paymentId);
    expect(payment?.status).toBe('approved');
    expect(payment?.decidedAt).toBeDefined();
    expect(payment?.decidedBy?.toString()).toBe(superadminUser._id.toString());
    expect(payment?.validityStartDate).toBeDefined();
    expect(payment?.validityEndDate).toBeDefined();
  });

  it('updates payment status to rejected with reason when super-admin rejects', async () => {
    // 1. Submit payment
    const submitRes = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', ownerCookie)
      .send({
        tier: 'starter',
        utr: 'UTR-FAKE-000',
      });
    expect(submitRes.status).toBe(200);

    // 2. Super admin rejects with reason
    const rejectRes = await request(app)
      .post(`/api/v1/superadmin/tenants/${tenant._id}/reject`)
      .set('Cookie', superadminCookie)
      .send({ reason: 'UTR not credited in bank account' });
    expect(rejectRes.status).toBe(200);

    // 3. Verify tenant reset to pending_payment
    const updatedTenant = await Tenant.findById(tenant._id);
    expect(updatedTenant?.subscriptionStatus).toBe('pending_payment');

    // 4. Verify SaasPayment audit record marked rejected with reason
    const payment = await SaasPayment.findById(submitRes.body.paymentId);
    expect(payment?.status).toBe('rejected');
    expect(payment?.rejectionReason).toBe('UTR not credited in bank account');
    expect(payment?.decidedBy?.toString()).toBe(superadminUser._id.toString());
  });

  it('preserves full historical record across multiple payments without overwriting', async () => {
    // First payment (Month 1) - approved
    const p1 = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', ownerCookie)
      .send({ tier: 'starter', utr: 'UTR-MONTH-1' });
    expect(p1.status).toBe(200);

    await request(app)
      .post(`/api/v1/superadmin/tenants/${tenant._id}/approve`)
      .set('Cookie', superadminCookie)
      .send({ days: 30 });

    // Second payment (Month 2) - renewal attempt
    const p2 = await request(app)
      .post('/api/v1/auth/submit-payment')
      .set('Cookie', ownerCookie)
      .send({ tier: 'growth', utr: 'UTR-MONTH-2' });
    expect(p2.status).toBe(200);

    // Super Admin queries payment history endpoint
    const historyRes = await request(app)
      .get(`/api/v1/superadmin/tenants/${tenant._id}/payments`)
      .set('Cookie', superadminCookie);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.payments.length).toBe(2);

    // Both records exist intact: one approved, one pending
    const utrs = historyRes.body.payments.map((p: any) => p.utr);
    expect(utrs).toContain('UTR-MONTH-1');
    expect(utrs).toContain('UTR-MONTH-2');

    const p1Record = historyRes.body.payments.find((p: any) => p.utr === 'UTR-MONTH-1');
    expect(p1Record.status).toBe('approved');

    const p2Record = historyRes.body.payments.find((p: any) => p.utr === 'UTR-MONTH-2');
    expect(p2Record.status).toBe('pending');
  });

  describe('Task 1.1: UTR Deduplication & Transaction Safety', () => {
    let secondTenant: any;
    let secondOwnerUser: any;
    let secondOwnerCookie: string;

    beforeEach(async () => {
      const passwordHash = await bcrypt.hash('Secret123!', 10);
      secondTenant = await Tenant.create({
        name: 'Second Library',
        slug: 'saas-second-lib',
        email: 'secondowner@lib.com',
        isActive: true,
        subscriptionStatus: 'pending_payment',
        onboardingStep: 'subscription',
      });

      secondOwnerUser = await User.create({
        tenantId: secondTenant._id,
        name: 'Second Owner',
        email: 'secondowner@lib.com',
        passwordHash,
        role: 'owner',
        isActive: true,
      });

      const token = jwt.sign(
        {
          userId: secondOwnerUser._id.toString(),
          tenantId: secondTenant._id.toString(),
          email: secondOwnerUser.email,
          role: secondOwnerUser.role,
          subscriptionStatus: secondTenant.subscriptionStatus,
          subscriptionTier: 'free',
          isActive: true,
        },
        env.JWT_SECRET,
      );
      secondOwnerCookie = `${AUTH_COOKIE}=${token}`;
    });

    it('rejects duplicate UTR submitted by the same tenant with 409 Conflict', async () => {
      // 1st submission succeeds
      const res1 = await request(app)
        .post('/api/v1/auth/submit-payment')
        .set('Cookie', ownerCookie)
        .send({ tier: 'growth', utr: 'UTR-SAME-123456' });
      expect(res1.status).toBe(200);

      // 2nd submission with identical UTR fails with 409
      const res2 = await request(app)
        .post('/api/v1/auth/submit-payment')
        .set('Cookie', ownerCookie)
        .send({ tier: 'growth', utr: 'UTR-SAME-123456' });
      expect(res2.status).toBe(409);
      expect(res2.body.error).toMatch(/already been submitted/i);

      // Verify only 1 payment was recorded in database
      const count = await SaasPayment.countDocuments({ utr: 'UTR-SAME-123456' });
      expect(count).toBe(1);
    });

    it('rejects duplicate UTR submitted by a different tenant with 409 Conflict', async () => {
      // Tenant 1 submits UTR
      const res1 = await request(app)
        .post('/api/v1/auth/submit-payment')
        .set('Cookie', ownerCookie)
        .send({ tier: 'growth', utr: 'UTR-SHARED-654321' });
      expect(res1.status).toBe(200);

      // Tenant 2 attempts to claim same UTR
      const res2 = await request(app)
        .post('/api/v1/auth/submit-payment')
        .set('Cookie', secondOwnerCookie)
        .send({ tier: 'starter', utr: 'UTR-SHARED-654321' });
      expect(res2.status).toBe(409);
      expect(res2.body.error).toMatch(/already been submitted/i);

      // Verify payment remains associated only with Tenant 1
      const payment = await SaasPayment.findOne({ utr: 'UTR-SHARED-654321' });
      expect(payment?.tenantId.toString()).toBe(tenant._id.toString());
    });

    it('handles concurrent duplicate submissions safely without creating multiple payments', async () => {
      const duplicateUtr = 'UTR-CONCURRENT-999999';

      const results = await Promise.all([
        request(app)
          .post('/api/v1/auth/submit-payment')
          .set('Cookie', ownerCookie)
          .send({ tier: 'starter', utr: duplicateUtr }),
        request(app)
          .post('/api/v1/auth/submit-payment')
          .set('Cookie', secondOwnerCookie)
          .send({ tier: 'starter', utr: duplicateUtr }),
      ]);

      const statuses = results.map((r) => r.status).sort();
      // Exactly one should succeed with 200, the other rejected with 409 Conflict
      expect(statuses).toEqual([200, 409]);

      // Exactly 1 payment in DB
      const count = await SaasPayment.countDocuments({ utr: duplicateUtr });
      expect(count).toBe(1);
    });

    it('aborts and rolls back changes if an operation fails during transaction', async () => {
      const { withTransaction } = await import('../utils/transaction');
      const rollbackUtr = 'UTR-ROLLBACK-TEST';

      let threw = false;
      try {
        await withTransaction(async (session) => {
          const createOptions = session ? { session } : {};
          await SaasPayment.create(
            [
              {
                tenantId: tenant._id,
                planCode: 'growth',
                planName: 'Growth Library',
                amountPaise: 99900,
                billingCycle: 'monthly',
                utr: rollbackUtr,
                status: 'pending',
                submittedAt: new Date(),
              },
            ],
            createOptions,
          );

          // Force deliberate failure in transaction
          throw new Error('Simulated atomic failure during processing');
        });
      } catch (err: any) {
        threw = true;
        expect(err.message).toBe('Simulated atomic failure during processing');
      }

      expect(threw).toBe(true);

      // Verify that if transactions are active (or in replica set), record is not persisted
      // In standalone tests, check that withTransaction propagates errors properly
      const canTx = (await import('../utils/transaction')).supportsTransactions();
      if (canTx) {
        const payment = await SaasPayment.findOne({ utr: rollbackUtr });
        expect(payment).toBeNull();
      }
    });

    it('ensures SaasPayment model schema enforces uniqueness on utr', async () => {
      await SaasPayment.create({
        tenantId: tenant._id,
        planCode: 'starter',
        planName: 'Starter Space',
        amountPaise: 49900,
        billingCycle: 'monthly',
        utr: 'UTR-SCHEMA-UNIQUE-1',
        status: 'pending',
        submittedAt: new Date(),
      });

      // Attempting to directly insert another document with the same UTR should throw MongoServerError (E11000)
      let duplicateError: any;
      try {
        await SaasPayment.create({
          tenantId: secondTenant._id,
          planCode: 'growth',
          planName: 'Growth Library',
          amountPaise: 99900,
          billingCycle: 'monthly',
          utr: 'UTR-SCHEMA-UNIQUE-1',
          status: 'pending',
          submittedAt: new Date(),
        });
      } catch (err: any) {
        duplicateError = err;
      }

      expect(duplicateError).toBeDefined();
      expect(duplicateError.code === 11000 || duplicateError.message?.includes('duplicate key')).toBe(true);
    });
  });
});
