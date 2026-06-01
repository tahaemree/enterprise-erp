# 🚀 NexusERP - Modern & Scalable Enterprise Resource Planning System

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.0-1B222D?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)

NexusERP is a comprehensive, enterprise-grade Next.js application built to handle complex business operations, accounting, inventory, HR, CRM, and B2B integrations with modern tech standards.

## ✨ Features

- **🛡️ Multi-Tenant Architecture:** Built from the ground up to support multiple organizations in a single deployment.
- **🔒 Advanced Security:** Field-level encryption for PII/financial data (IBAN, Tax IDs), complete Audit Logging (changes diff tracking), and role-based access control (RBAC).
- **💼 Accounting & Finance:** Full chart of accounts, bank accounts, cost centers, income/expense tracking, currency exchange, and localized tax handling (KDV, Stopaj, Tevkifat).
- **📦 Inventory Management:** Suppliers, product catalogs, multi-warehouse stock tracking, low stock alerts, and category management.
- **🤝 CRM:** Customer tracking, lead scoring, interaction logs (calls, emails, meetings), and customer account management.
- **👥 HR Module:** Employee management, departments, leave requests, and payroll tracking.
- **⚡ E-Invoice Integration:** Built-in adapter for Gelir İdaresi Başkanlığı (GIB) SOAP e-invoice web services (Turkey localized).
- **⚡ Background Jobs:** Redis-powered BullMQ integration for async jobs (e.g., e-invoice processing, bulk emails).
- **🧪 Tested & Reliable:** High test coverage with Vitest for unit/integration tests and Playwright for E2E tests.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript (Strict Mode)
- **Database:** PostgreSQL with Prisma ORM
- **UI Components:** Tailwind CSS, Radix UI, Shadcn UI
- **Authentication:** NextAuth.js (v5 / Auth.js)
- **Forms & Validation:** React Hook Form + Zod
- **Testing:** Vitest, Testing Library, Playwright
- **Tooling:** ESLint, Prettier, Husky (optional)

---

## 🚀 Quick Start (Local Development)

Getting the project up and running is incredibly simple.

### Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v15 or higher)
- (Optional) Redis (If using background jobs)

### 1. Clone the repository

```bash
git clone https://github.com/tahaemree/enterprise-erp.git
cd enterprise-erp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the example environment file and configure it.

```bash
cp .env.example .env
```

Open `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `AUTH_SECRET`: Generate a random string using `openssl rand -base64 32`.
- `ENCRYPTION_KEY`: Generate exactly 32 bytes using `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### 4. Database Setup & Seed

This single command will generate the Prisma Client, push the schema to the database, and insert rich demo data (currencies, tenants, users, products, etc.).

```bash
npm run setup
```

### 5. Run the Application

```bash
npm run dev
```

Your app is now running at `http://localhost:3000`.

---

## 🔐 Default Demo Accounts

If you ran `npm run setup`, the database is seeded with demo accounts. 

You can log in at `http://localhost:3000/login` using:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@deftra.com` | `password123` |
| **Manager** | `manager@deftra.com` | `password123` |
| **Viewer** | `viewer@deftra.com` | `password123` |

---

## 🐋 Docker Support

If you prefer using Docker to run the entire stack (App + PostgreSQL + Redis):

```bash
docker-compose up -d
```
*(Make sure to adjust `.env` variables to match the docker network if needed).*

---

## 🧪 Running Tests

```bash
# Run unit and integration tests
npm run test

# Watch mode for tests
npm run test:watch

# Run E2E tests with Playwright
npm run test:e2e
```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
