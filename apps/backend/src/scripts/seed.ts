/**
 * Seed script — development only.
 *
 * Creates the default Atlas Library tenant and an admin user.
 * Safe to run multiple times — skips creation if records already exist.
 *
 * Usage:
 *   npm run seed          (from repo root)
 *   npm -w apps/backend run seed
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Tenant } from '../models/Tenant';
import { User } from '../models/User';

const MONGODB_URI =
  process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/atlas_dev';

const SEED_TENANT = {
  name: 'Atlas Library',
  slug: 'atlas-library-indore',
  email: 'admin@atlas.com',
  phone: '+91-9999999999',
  city: 'Indore',
};

const SEED_ADMIN = {
  name: 'Atlas Admin',
  email: 'admin@atlas.com',
  password: 'Admin@1234',
  role: 'owner' as const,
};

async function seed(): Promise<void> {
  console.log('🌱  Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);

  // ── Tenant ────────────────────────────────────────────────────────────────
  let tenant = await Tenant.findOne({ slug: SEED_TENANT.slug });

  if (tenant) {
    console.log(`✅  Tenant already exists: "${tenant.name}" (${tenant._id})`);
  } else {
    tenant = await Tenant.create(SEED_TENANT);
    console.log(`✅  Created tenant: "${tenant.name}" (${tenant._id})`);
  }

  // ── Admin user ────────────────────────────────────────────────────────────
  const existing = await User.findOne({
    tenantId: tenant._id,
    email: SEED_ADMIN.email,
  });

  if (existing) {
    console.log(`✅  Admin user already exists: ${existing.email}`);
  } else {
    const passwordHash = await bcrypt.hash(SEED_ADMIN.password, 12);
    await User.create({
      tenantId: tenant._id,
      name: SEED_ADMIN.name,
      email: SEED_ADMIN.email,
      passwordHash,
      role: SEED_ADMIN.role,
    });
    console.log(`✅  Created admin user: ${SEED_ADMIN.email}`);
  }

  console.log('\n🔑  Dev credentials:');
  console.log(`   Email:    ${SEED_ADMIN.email}`);
  console.log(`   Password: ${SEED_ADMIN.password}`);
  console.log('\n✅  Seed complete.\n');
}

seed()
  .catch((err: unknown) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => void mongoose.disconnect());
