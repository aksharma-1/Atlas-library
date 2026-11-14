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
 * Then creates ONLY a clean standalone Super-Admin user using environment variables:
 * - SUPERADMIN_EMAIL
 * - SUPERADMIN_PASSWORD
 * - SUPERADMIN_NAME
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

const email = process.env['SUPERADMIN_EMAIL']?.trim().toLowerCase();
const password = process.env['SUPERADMIN_PASSWORD'];
const name = process.env['SUPERADMIN_NAME'] || 'Platform Super Admin';

if (!email || !password) {
  console.error('❌  Security Error: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be configured in environment variables.');
  console.error('    Please set them in apps/backend/.env or your deployment environment.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌  Security Error: SUPERADMIN_PASSWORD must be at least 8 characters long.');
  process.exit(1);
}

const SUPER_ADMIN = {
  name,
  email,
  password,
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
  console.log('\n✅  Platform reset & seed complete.\n');
}

seed()
  .catch((err: unknown) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => void mongoose.disconnect());
