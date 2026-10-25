# Atlas Library Management SaaS — AI Development Instructions

## Project Context

Build a multi-tenant Library Management SaaS for study libraries serving competitive-exam aspirants. This is a study-space business, not a book-lending library.

The first tenant is Atlas Library in Indore, India. The software must eventually support independent library businesses with isolated data, configurable plans, seats, shifts, and fees.

## Technology Stack

- Frontend: React, TypeScript, Vite.
- Backend: Node.js, Express, TypeScript.
- Database: MongoDB with Mongoose.
- API: REST under `/api/v1`.
- Frontend validation: React Hook Form and Zod.
- Server state: TanStack Query.
- UI: Tailwind CSS and reusable accessible components.
- Testing: Vitest, React Testing Library, Supertest, and Playwright where applicable.

Use a documented monorepo with separate frontend and backend applications and shared API contracts.

## Non-Negotiable Rules

1. Read the PRD, architecture, database, business rules, and implementation plan before changing relevant functionality.
2. Inspect the existing repository before creating or replacing files.
3. Do not assume that a new implementation is preferable to an existing working implementation.
4. Keep modules cohesive and maintain clear separation between routes, controllers, services, repositories, and models.
5. Validate all incoming data on the backend.
6. Enforce authorization and tenant isolation on every tenant-owned operation.
7. Never trust a tenant ID supplied by the browser as proof of authorization.
8. Never hardcode Atlas-specific fees, seat numbers, library details, or operating hours into business logic.
9. Store money as integer paise and avoid floating-point financial calculations.
10. Preserve historical memberships, plan snapshots, and financial records.
11. Make payment submissions idempotent.
12. Handle conflicting seat allocations safely, including concurrent requests.
13. Do not log passwords, session tokens, or unnecessary personal information.
14. Never commit secrets, production data, or real customer records.
15. Do not run destructive database operations or remove existing features without explicit justification and approval.

## Development Process

Before each implementation task:

- Inspect the relevant files and existing tests.
- Identify dependencies and affected modules.
- Provide a short implementation plan.
- Identify database, API, and UI changes.
- Identify relevant security and regression risks.

During implementation:

- Make focused, incremental changes.
- Reuse existing components and utilities.
- Keep TypeScript types explicit and avoid unnecessary `any`.
- Use shared contracts where appropriate.
- Follow existing naming and formatting conventions.
- Add tests alongside new business logic.
- Update documentation when behavior or interfaces change.

After implementation:

- Run formatting, linting, type checking, and relevant tests.
- Fix failures introduced by the changes.
- Summarize files changed, behavior added, test results, remaining risks, and required environment or migration steps.
- Never claim a test passed unless it was actually executed successfully.

## Security Requirements

- Use secure password hashing.
- Protect authenticated routes and sensitive API operations.
- Verify tenant and role permissions on the server.
- Avoid insecure token storage and unsafe session handling.
- Validate ObjectIds and other identifiers.
- Prevent mass-assignment vulnerabilities.
- Protect against duplicate payment submissions.
- Record important financial and membership changes in audit history.
- Test cross-tenant access denial.
- Keep development seed data separate from production data.

## Business Rules

- Membership status and payment status are separate concepts.
- Memberships preserve the terms and price agreed at creation.
- Reserved seats cannot have conflicting assignments.
- Full-day access conflicts with overlapping shift assignments on the same seat.
- Non-reserved memberships follow configured capacity and access rules.
- Renewal creates a traceable membership-period change or new membership record according to the approved design.
- Financial corrections use authorized reversals or refunds rather than silently rewriting completed payments.
- Expiry, cancellation, and seat release must follow documented transition rules.
- All reports must be scoped to the authorized tenant and branch.

## Completion Criteria

A feature is complete only when:

- Its acceptance criteria are met.
- Relevant tests exist and pass.
- Authorization and validation are implemented.
- Loading, empty, success, and error states are handled where relevant.
- Existing functionality remains intact.
- Required documentation is updated.
- The result can be run and tested using documented instructions.

## Communication

Ask questions when a missing business decision could materially change the implementation. Otherwise, make the smallest reasonable assumption, document it, and continue.

Do not build every future feature in the first release. Prioritize a secure, reliable administrative MVP and deliver complete, testable workflows one module at a time.