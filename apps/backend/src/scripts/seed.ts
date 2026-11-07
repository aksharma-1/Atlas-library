/**
 * Seed script — Platform Super Admin Setup & Clean Database Reset.
 *
 * Clears ALL collections across the entire database:
 * - Tenants
 * - Users
 * - Students
 * - Seats
 * - Shifts
 * - Plans
 * - Memberships
 * - Payments
 *
 * Then creates ONLY a clean standalone Super-Admin user:
 * - Role: 'superadmin'
 * - Email: admin@atlas.com
 * - Password: Admin@1234
 * - NO tenantId or library attached (pure platform supervisor)
 *
 * Usage:
 *   npm run seed          (from repo root)
 *   npm -w apps/backend run seed
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Seat } from '../models/Seat';
import { Shift } from '../models/Shift';
import { Plan } from '../models/Plan';
import { Membership } from '../models/Membership';
import { Payment } from '../models/Payment';

const MONGODB_URI =
  process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_dev';

const SUPER_ADMIN = {
  name: 'Platform Super Admin',
  email: 'admin@atlas.com',
  password: 'Admin@1234',
  role: 'superadmin' as const,
};

async function seed(): Promise<void> {
  console.log('🌱  Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);

  console.log('🧹  Purging all existing database collections…');
  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Student.deleteMany({}),
    Seat.deleteMany({}),
    Shift.deleteMany({}),
    Plan.deleteMany({}),
    Membership.deleteMany({}),
    Payment.deleteMany({}),
  ]);
  console.log('✅  All collections cleared successfully.');

  // Create pure Platform Super-Admin (no tenant attached)
  const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 12);
  const adminUser = await User.create({
    name: SUPER_ADMIN.name,
    email: SUPER_ADMIN.email,
    passwordHash,
    role: SUPER_ADMIN.role,
    isActive: true,
  });

  console.log(`✅  Created standalone Super Admin user: ${adminUser.email} (ID: ${adminUser._id})`);
  console.log('ℹ️   Super Admin has NO library attached and supervises all tenants via /admin.');

  console.log('\n🔑  Platform Super Admin Credentials:');
  console.log(`   Email:    ${SUPER_ADMIN.email}`);
  console.log(`   Password: ${SUPER_ADMIN.password}`);
  console.log(`   URL:      http://localhost:5173/admin`);
  console.log('\n✅  Platform reset & seed complete.\n');
}

seed()
  .catch((err: unknown) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => void mongoose.disconnect());
