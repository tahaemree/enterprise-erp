# 🏢 Enterprise ERP

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/BullMQ-Redis-FF4438?logo=redis" alt="BullMQ">
</p>

## 📋 Overview

Enterprise ERP is a modern, cloud-native Enterprise Resource Planning system tailored for B2B SaaS operations. Built on a robust Next.js 16 App Router architecture, it delivers real-time business intelligence, automated accounting workflows, and secure multi-tenant data isolation.

This platform bridges the gap between modern web experiences and strict enterprise compliance, featuring direct integrations with government tax services and end-to-end data encryption.

---

## ⚡ Core Capabilities

- **🔐 Multi-Tenant Architecture:** Strict tenant isolation enforced in the data-access layer via a Prisma client extension that injects the tenant ID into every query and create, backed by defense-in-depth post-query checks.
- **💰 Advanced Accounting Engine:** Automated processing for VAT, Withholding Taxes, and complex ledger reconciliations.
- **🏛️ E-Invoice Integration:** Direct, real-time SOAP integration with the Revenue Administration (GIB) for legal compliance.
- **📦 Inventory Management:** Real-time stock tracking with asynchronous low-stock alerting via Redis queues.
- **🛡️ Enterprise Security:** Field-level AES-256 encryption for Personally Identifiable Information (PII) and Role-Based Access Control (RBAC).
- **⚙️ Background Processing:** Resilient asynchronous task handling powered by BullMQ and Redis for heavy report generation and mass invoicing.

---

## 🏗️ Technology Stack

- **Frontend & API:** `Next.js 15` (App Router), `React 19`, `Tailwind CSS`, `Framer Motion`
- **Backend & ORM:** `Prisma ORM`
- **Database:** `PostgreSQL` (Relational), `Redis` (Caching & Queues)
- **Authentication:** `NextAuth.js` (SSO & Credentials)
- **Queuing System:** `BullMQ`
- **Validation:** `Zod`

---

## 📂 Architecture Snapshot

```text
src/
├── app/                      # Next.js App Router (Pages & API Routes)
├── components/               # Radix UI & Tailwind-based React components
├── lib/                      # Core utilities (Prisma Client, Redis, Crypto)
├── modules/                  # Domain-Driven Design business logic
│   ├── accounting/           # Ledger and Tax engines
│   ├── inventory/            # Stock mutations
│   └── e-invoice/            # GIB SOAP integration
├── workers/                  # BullMQ processor instances
└── __tests__/                # Vitest & Playwright testing suites
```

---

## 🚀 Local Development

### Prerequisites

- Node.js `20.x` or higher
- PostgreSQL `15+`
- Redis `7+`

### 1. Setup

```bash
git clone https://github.com/tahaemree/enterprise-erp.git
cd enterprise-erp
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your local databases.

```bash
cp .env.example .env
```

Ensure the following critical variables are set:
```ini
DATABASE_URL="postgresql://user:pass@localhost:5432/erp?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secure-secret"
ENCRYPTION_KEY="32-byte-base64-key-for-pii"
```

### 3. Database Migrations

Apply the Prisma schema to your PostgreSQL instance:

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start the Application

To boot both the Next.js frontend and the BullMQ worker processes:

```bash
npm run dev
```

---

## 🧪 Testing

The repository maintains high coverage through a dual-testing strategy:

- **Unit/Integration:** Run `npm run test` (Powered by Vitest)
- **End-to-End (E2E):** Run `npx playwright test` (Verifies critical accounting workflows)

---

## 🤝 Contributing

We welcome contributions from the enterprise engineering community! Please review our [Contributing Guidelines](CONTRIBUTING.md) to understand our branching strategy, commit conventions, and review processes.

---

## 📄 License

This software is open-sourced under the **MIT License**.

You are free to use, modify, and distribute this software, provided that the original copyright and permission notice are included. Please see the [LICENSE](LICENSE) file for complete details.
