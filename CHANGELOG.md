# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Removed a no-op `set_config` "RLS" wrapper that provided no isolation (no DB
  policies existed), doubled query round-trips, and broke transaction atomicity
  inside service-level `$transaction()` blocks. Tenant isolation is enforced at
  the data-access layer with defense-in-depth post-checks.
- Hardened the Content-Security-Policy for production (dropped `'unsafe-eval'`
  and `localhost`; added `base-uri` and `object-src 'none'`).
- API keys are now stored as a SHA-256 hash + indexed prefix and verified in
  constant time (was plaintext). Added an idempotent backfill script.
- `requireAuth` now re-reads role/permissions from the database on every request
  instead of trusting the JWT, so revocations take effect immediately.
- Added Turkish VKN/TCKN checksum validation for e-Invoice tax IDs.
- Sentry: explicit `sendDefaultPii: false` and environment-aware trace sampling.

### Fixed
- Repaired a broken migration history that omitted the `Role` and `AuditLog`
  tables (and many columns/indexes/FKs) added via `prisma db push`; a fresh
  `migrate deploy` would otherwise build an incomplete schema. `setup` now uses
  `migrate deploy`.
- Unified all monetary columns to `Decimal(18,2)` to prevent overflow on
  real-world TRY amounts.
- Fixed two React `rules-of-hooks` violations (conditional hooks in the sidebar
  flyout; a hook-calling column factory).
- Made `OrderService` type-safe (removed `as any` at all call sites).

### Added
- Multi-Tenant Architecture support.
- Advanced Security with field-level encryption for PII.
- Comprehensive Accounting & Finance module.
- Inventory Management with multi-warehouse support.
- CRM module for customer tracking.
- HR module for employee management.
- E-Invoice Integration for GIB SOAP web services.
- Background jobs with BullMQ and Redis.
- Full E2E and Unit testing suite using Playwright and Vitest.

### Changed
- Refactored Next.js 16 App Router architecture for improved performance.
- Upgraded Prisma schema for optimized PostgreSQL queries.

### Fixed
- Authentication edge cases for multi-tenant users via NextAuth.
