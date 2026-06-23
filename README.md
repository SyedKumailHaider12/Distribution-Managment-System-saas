# AzanTech Solutions - Enterprise Distribution Management System

A multi-tenant SaaS platform built to handle enterprise distribution, inventory management, sales, purchasing, and human resources.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** SQLite (via Prisma ORM)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion

## Core Features
1. **Multi-Tenancy (SaaS Architecture):**
   - True data isolation using an `organizationId` across all data models.
   - Subscription and Trial management included (7-day trial default, with a redirect to a Mock Billing portal if expired).

2. **Dashboard & KPIs:**
   - Real-time display of Sales, Receivables, Payables, Low Stock, and Expiring Items.
   - Export functionality for outstanding payables via CSV.
   - Dynamic System Info displaying Organization Name, Plan Status, and active Trial Days.

3. **Sales & Purchasing:**
   - Supports both `Retail` and `Distribution` sales workflows.
   - Advanced invoice generation with dynamic taxes, discounts, and custom line items.
   - Fully fledged Purchase workflows with supplier and warehouse integration.

4. **Inventory & Stock Management:**
   - Batch-level tracking (expiry dates, purchase prices).
   - Multi-warehouse support.
   - Real-time stock deductions upon sales and stock additions upon purchases/returns.

5. **Financial Ledgers:**
   - Deep tracking of Customer and Supplier ledgers.
   - Tracks credits, debits, running balances, and payment allocations.

6. **Reporting (PDF & Excel):**
   - High-quality, teal-themed PDF generation using `jspdf` and `jspdf-autotable`.
   - Generates Stock Reports, Financial Summaries, Purchase Histories, and Audit Logs.

7. **Authentication:**
   - Secure session-based authentication via custom encrypted cookies.
   - Role-based Access Control (Admin, Manager, Cashier, Salesman).

## Getting Started
1. Run `npm install`
2. Run `npx prisma db push` to synchronize the database schema.
3. Run `npm run dev` to start the development server.
