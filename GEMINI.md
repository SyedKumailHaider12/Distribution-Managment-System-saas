# AzanTech DMS - Development Guidelines

## 🏗 Architecture & Patterns
- **Next.js App Router:** Use Server Components by default. Use `'use client'` only for interactive components.
- **Prisma:** Always use the shared prisma instance from `@/lib/prisma`.
- **Server Actions:** All data mutations should happen via Server Actions in `src/lib/actions` or page-specific action files.
- **Type Safety:** Ensure all database entities and API responses are strictly typed.

## 🎨 UI & Styling
- **Tailwind CSS v4:** Follow the established utility-first approach.
- **Theming:** Use CSS variables defined in `globals.css` for all themeable colors. Use the `data-theme` attribute on the `<html>` tag.
- **Animations:** Use `framer-motion` for transitions and interactive elements to maintain the "premium" feel.
- **Icons:** Use `lucide-react`.

## 🛡 Security & Auth
- **Session Management:** Auth is handled via `src/lib/auth.ts`.
- **RBAC:** Use `requireAuth()` and `hasRole()` to protect routes and components.
- **Validation:** Always validate user input on the server side (e.g., using Zod).

## 📊 Business Logic
- **Inventory:** Stock MUST be managed at the Batch level. Never aggregate stock without considering batch expiry and purchase price.
- **Financials:** Adhere to the "Previous Balance First" payment allocation logic.
- **Audit Logs:** Ensure every critical action (CREATE, UPDATE, DELETE, PAYMENT) is logged in the `AuditLog` table.
