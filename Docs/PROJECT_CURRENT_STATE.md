# Project Status & Current System State Documentation

**Project Name:** StudySpace OS (formerly Atlas Library Management System)  
**Document Generation Date:** November 14, 2026  
**Document Type:** Technical & Operational Current State Audit  
**Location:** `Docs/PROJECT_CURRENT_STATE.md`  

---

## 1. Executive Summary & Architecture Overview

The system is a production-deployed, multi-tenant Software-as-a-Service (SaaS) platform tailored for study-space libraries serving competitive-exam aspirants. It operates as an npm workspaces monorepo containing three primary packages:
- `apps/backend`: Express.js, TypeScript, Mongoose (MongoDB).
- `apps/frontend`: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod.
- `packages/shared`: Shared TypeScript domain models, DTOs, and API request/response contracts.

### Live Infrastructure & Deployment Targets
- **Backend API**: Hosted on **Render** (`https://atlas-library-rlk7.onrender.com/api/v1`) using Node.js runtime with proxy trust and Partitioned / SameSite=None secure cross-site cookies.
- **Frontend SPA**: Hosted on **Netlify** with single-page application routing rewrites.
- **Database**: Cloud-hosted **MongoDB Atlas** replica set with per-tenant isolation, atomic sequencing collections, and automated sync jobs.

---

## 2. Multi-Tenant Architecture & Data Isolation

Data isolation is enforced at the database and application levels:
1. Every tenant represents an independent study library business with its own profile, contact information, subscription tier, and active status flag (`Tenant` model).
2. All operational collections (`users`, `students`, `memberships`, `seats`, `shifts`, `plans`, `payments`) enforce a mandatory `tenantId` field indexed with compound keys.
3. Express middleware (`authenticate.ts` and `requireActiveTenant.ts`) verifies the session JWT directly from `httpOnly` secure cookies and injects `req.user.tenantId`. Tenant identifiers from the browser query or body are never trusted for authorization.
4. Tenant suspension / deactivation automatically terminates API access for all users under that tenant.

---

## 3. Implemented Modules & Technical Capabilities

### 3.1 Authentication & User Management
- **Role-Based Access Control**:
  - `owner` / `admin`: Library managers controlling their specific tenant workspace.
  - `staff`: Library assistants scoped strictly to operational records.
  - `superadmin`: Platform administrators managing tenant accounts, platform configuration, and SaaS subscription tiers.
- **Security**: Passwords hashed with `bcryptjs` (cost factor 12). Auth token issued as a secure, partitioned, HTTP-only cookie (`atlas_token`).
- **Profile & Credential Self-Service**: Dedicated `/profile` route allowing authenticated managers to update name, mobile number, contact details, and change passwords.
- **SuperAdmin Portal (`/superadmin`)**: Direct oversight over registered library tenants (status toggles, tenant search, SaaS plan assignment, and operational statistics).

### 3.2 Library Configuration (Shifts & Membership Plans)
- **Operational Shifts (`/plans`)**: Configurable time windows (e.g., Morning Shift: 07:00–15:00, Evening Shift: 15:00–23:00, Full Day: 07:00–23:00) with validated 24-hour time ranges.
- **Membership Plans (`/plans`)**:
  - Plan types: `reserved` (dedicated desk) and `non-reserved` (floating desk).
  - Shift associations: Linkable to specific shifts or open full-day access.
  - Financial storage: All plan prices and fees are stored strictly as **integer paise** (`feePaise`), completely preventing floating-point calculation errors.

### 3.3 Visual Seating Map & Multi-Shift Allocation (`/seats`)
- **Inventory Engine**:
  - Configurable desk numbers supporting natural alphanumeric sorting (e.g., 1, 2, 10, A-1, B-12).
  - Bulk desk generator supporting custom prefixes and section tags.
  - Status management: `available`, `occupied`, `maintenance`, and `blocked`.
- **Multi-Shift Occupancy Awareness**:
  - Desks support multi-shift allocations: morning, evening, and full-day occupancies are computed independently to prevent overlapping shift conflicts while allowing legitimate multi-shift sharing.
- **Reception Drawer**:
  - Clicking any seat opens a detailed drawer showing assigned student details, phone number, active plan, shift, days remaining, and direct actions to call, WhatsApp, vacate desk, or view member profile.

### 3.4 Student Directory & Registration (`/students`)
- **Directory**:
  - Searchable by student name, mobile number, or membership number (`MEM-0001`).
  - Filter tabs: `All Members`, `No Desk Assigned`, `Fees Due`, `Expiring in 3 Days`, `Expiring in 7 Days`, `Expired`, and `Left Records`.
  - Comprehensive column view showing Membership ID, Student Name, Mobile, Desk Assignment (`Seat #` or `⚠️ No Desk Assigned`), Registration Date, and Profile link.
- **Registration**:
  - Auto-generated or custom human-readable membership identifiers.
  - Optional instant desk and plan assignment directly during student creation.

### 3.5 Membership Lifecycle, Renewals & Desk Vacating (`/students/:id`)
- **Lifecycle Status**:
  - Tracks membership operational status (`active`, `expired`, `cancelled`, `left`) separately from payment status (`paid`, `partial`, `pending`).
- **Expiry Synchronization Service**:
  - Background and request-driven service (`membershipSync.service.ts`) that automatically synchronizes past-due memberships from `active` to `expired` based on date boundaries.
- **Renewal Workflow**:
  - Pre-fills current student plan, pricing, and shift details.
  - Supports custom duration options (1 Month, 2 Months, 3 Months, Custom Date Range).
  - Allows instant fee collection during renewal with immediate receipt creation.
- **Vacate Desk Separation**:
  - Clear separation between releasing a physical desk (`vacate desk`) and terminating student membership (`mark as left`).
  - Preserves historical membership periods and payment records for auditability.

### 3.6 Fee Collection, Idempotency & Billing Reversals
- **Financial Ledger**:
  - All payments stored in integer paise (`amountPaise`).
  - Payment modes: Cash, UPI, Card, Bank Transfer.
  - Discount tracking: Discount amount in paise with optional reason notes recorded in the membership.
  - Overpayment validation: Backend rejects payments exceeding outstanding dues.
- **Atomic Receipt Counter**:
  - Dedicated MongoDB `Counter` model ensuring sequential, collision-free receipt numbers formatted as `REC-YYYY-XXXX`.
- **Payment Reversal**:
  - Ability to reverse mistaken payment entries with authorized transaction rollbacks, updating membership paid balance and dues automatically.
- **Idempotency**: Client-supplied `idempotencyKey` prevents duplicate charges during intermittent network retries.

### 3.7 Printable Documents & Student Communication
- **Printable Membership Card (`PrintableCard.tsx`)**:
  - High-resolution card format showing library branding, student details, photo placeholder, assigned desk number, shift, and expiration date ready for `window.print()`.
- **Printable Payment Receipt (`PrintableReceipt.tsx`)**:
  - Formal payment receipt with tenant header, sequential receipt number, student info, transaction reference, amount, and date.
- **WhatsApp Integration (`whatsapp.ts`)**:
  - One-click WhatsApp action templates for payment receipts, dues reminders, and expiry notices sent directly to the student's mobile number.

### 3.8 Dashboard & Operational Analytics (`/dashboard`, `/revenue`)
- **Live Counters**:
  - Total registered students, occupied desks, available desks, maintenance desks, total active plans, and total operational shifts.
  - Outstanding dues tally calculated directly from live active memberships.
- **Revenue Analytics (`/revenue`)**:
  - Month-over-month revenue trends, collections breakdown by payment method, and filtered transaction history.

### 3.9 User Interface & Design System
- **Theme Support**: Seamless dark mode and light mode switching with `ThemeContext` and CSS variables.
- **Responsive Layout**:
  - Collapsible desktop sidebar navigation.
  - Bottom mobile navigation bar (`MobileBottomNav.tsx`) optimized for phone and tablet screens.
- **Universal Date Formatting**: Standardized `DD/MM/YYYY` display across all tables, badges, receipts, and cards (`date.ts`).

---

## 4. Current Database Schema Summary

| Collection | Model File | Purpose & Key Fields |
|---|---|---|
| `tenants` | `Tenant.ts` | Multi-tenant organization profile (`name`, `slug`, `email`, `phone`, `city`, `isActive`, `saasPlanId`). |
| `users` | `User.ts` | Staff and admin logins (`tenantId`, `name`, `email`, `passwordHash`, `role`: `owner` \| `staff`, `isActive`). |
| `platform_configs` | `PlatformConfig.ts` | SuperAdmin configuration and platform-wide defaults. |
| `saas_plans` | `SaasPlan.ts` | Platform billing tiers for tenant subscriptions. |
| `shifts` | `Shift.ts` | Operational study shifts (`tenantId`, `name`, `startTime`, `endTime`, `isActive`). |
| `plans` | `Plan.ts` | Membership plan offerings (`tenantId`, `name`, `seatType`: `reserved` \| `non-reserved`, `shiftIds`, `feePaise`, `isActive`). |
| `seats` | `Seat.ts` | Physical desk inventory (`tenantId`, `seatNumber`, `section`, `status`: `available` \| `occupied` \| `maintenance` \| `blocked`). |
| `students` | `Student.ts` | Student records (`tenantId`, `name`, `mobile`, `email`, `membershipNumber`, `address`). |
| `memberships` | `Membership.ts` | Subscriptions (`tenantId`, `studentId`, `planId`, `shiftId`, `seatId`, `startDate`, `endDate`, `status`, `feePaise`, `paidPaise`, `discountPaise`, `paymentStatus`). |
| `payments` | `Payment.ts` | Transactions (`tenantId`, `membershipId`, `studentId`, `receiptNumber`, `amountPaise`, `paymentMethod`, `transactionRef`, `idempotencyKey`). |
| `counters` | `Counter.ts` | Atomic sequence counters for receipt numbering. |

---

## 5. Automated Quality & Verification Status

- **Monorepo Compilation**: TypeScript strict mode enabled across root, backend, frontend, and shared packages.
- **Linting**: ESLint flat config (backend) and Oxlint (frontend) clean with zero unresolved errors.
- **Automated Tests**:
  - Backend integration test suites in `apps/backend/src/__tests__/`:
    - `health.test.ts`: Liveness probe (`GET /api/v1/health`).
    - `auth.test.ts`: Session issuance, credential verification, and route guards.
    - `library.test.ts`: Shifts, plans, and bulk seat allocation APIs.
    - `student.test.ts`: Student registration, reserved seat conflict detection, and payment idempotency.
  - Frontend smoke and component tests in `apps/frontend/src/__tests__/`.
