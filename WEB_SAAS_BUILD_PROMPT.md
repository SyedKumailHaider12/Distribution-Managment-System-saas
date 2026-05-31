# Pharmacy Management System - Web SaaS Conversion Prompt

## 📋 Project Overview

Build a **web-based SaaS version** of a desktop Pharmacy Management System. The web application must replicate all functionality, business logic, and UI styling from the original JavaFX desktop application, converting it into a modern multi-tenant web platform.

---

## 🎯 Project Goals

1. **Feature Parity**: Implement all features from the desktop version
2. **UI Consistency**: Match the desktop UI styling and user experience exactly
3. **Business Logic**: Preserve all business rules and data integrity
4. **Multi-tenancy**: Support multiple pharmacy organizations (SaaS)
5. **Scalability**: Build for cloud deployment
6. **Database**: Migrate from SQLite to a production-grade database (PostgreSQL/MySQL)

---

## 🏗 Technical Stack (Recommended)

### Backend
- **Framework**: Node.js/Express.js, Spring Boot, Django, or Laravel
- **Language**: JavaScript/TypeScript, Python, or PHP
- **Database**: PostgreSQL or MySQL with proper schema migration
- **Authentication**: JWT/OAuth2 for multi-tenant user management
- **API**: RESTful or GraphQL

### Frontend
- **Framework**: React.js, Vue.js, or Angular
- **Styling**: CSS3 with Tailwind CSS or custom CSS matching desktop themes
- **State Management**: Redux, Vuex, or Context API
- **UI Components**: Material-UI, Bootstrap, or custom components
- **Charts/Reports**: Chart.js, ApexCharts, or similar for PDF generation

### Infrastructure
- **Hosting**: AWS, Azure, DigitalOcean, or similar
- **Email Service**: For notifications and PDF reports
- **File Storage**: S3 or similar for document storage

---

## 📦 Core Data Models (Must Implement Exactly)

### Master Data
1. **Company**
   - company_id (PK)
   - company_name
   - address
   - phone
   - logo (file path/blob)
   - tax_id / registration_number
   - created_at, updated_at

2. **Category**
   - category_id (PK)
   - category_name
   - description

3. **Brand**
   - brand_id (PK)
   - brand_name
   - description

4. **Warehouse**
   - warehouse_id (PK)
   - warehouse_name
   - location
   - capacity

5. **User**
   - user_id (PK)
   - username (unique)
   - password (hashed with bcrypt)
   - email
   - full_name
   - role (Admin, Manager, Salesman, Pharmacist, etc.)
   - is_active
   - created_at, updated_at

### Transaction Data
6. **Product**
   - product_id (PK)
   - product_name
   - sku (unique)
   - category_id (FK)
   - brand_id (FK)
   - unit_price (purchase price)
   - selling_price
   - reorder_level
   - is_active

7. **Batch**
   - batch_id (PK)
   - product_id (FK)
   - batch_number (unique per product)
   - manufacturing_date
   - expiry_date
   - quantity_received
   - is_expired (calculated)

8. **Stock**
   - stock_id (PK)
   - product_id (FK)
   - batch_id (FK)
   - warehouse_id (FK)
   - quantity_on_hand
   - quantity_reserved
   - quantity_available (calculated)
   - last_updated

9. **Supplier**
   - supplier_id (PK)
   - supplier_name
   - contact_person
   - email
   - phone
   - address
   - payment_terms
   - opening_balance (ledger)
   - current_balance (ledger)

10. **Customer**
    - customer_id (PK)
    - customer_name
    - customer_type (Retail/Distribution)
    - email
    - phone
    - address
    - credit_limit
    - opening_balance (ledger)
    - current_balance (ledger)

11. **Salesman**
    - salesman_id (PK)
    - salesman_name
    - email
    - phone
    - commission_percentage
    - is_active

12. **Delivery**
    - delivery_id (PK)
    - sales_invoice_id (FK)
    - delivery_date
    - delivered_by
    - status (Pending/Delivered/Failed)

### Sales & Purchase Documents
13. **PurchaseInvoice**
    - purchase_invoice_id (PK)
    - supplier_id (FK)
    - invoice_number (unique)
    - invoice_date
    - due_date
    - total_amount
    - discount_amount
    - tax_amount
    - net_amount
    - paid_amount
    - balance_due (calculated)
    - status (Draft/Confirmed/Partial/Paid)
    - created_by (FK to User)
    - created_at, updated_at

14. **PurchaseInvoiceItem**
    - purchase_item_id (PK)
    - purchase_invoice_id (FK)
    - product_id (FK)
    - batch_id (FK)
    - quantity
    - unit_price
    - line_total
    - received_quantity
    - status (Pending/Partial/Complete)

15. **SalesInvoice**
    - sales_invoice_id (PK)
    - customer_id (FK) - can be NULL for walk-in customers
    - salesman_id (FK)
    - invoice_number (unique)
    - invoice_date
    - customer_name (for walk-ins)
    - invoice_type (Retail/Distribution)
    - total_amount
    - discount_amount
    - tax_amount
    - net_amount
    - previous_balance (customer ledger before this sale)
    - paid_amount
    - balance_due (calculated)
    - payment_method (Cash/Check/Card/Credit)
    - status (Draft/Confirmed/Partial/Paid)
    - created_by (FK to User)
    - created_at, updated_at

16. **SalesInvoiceItem**
    - sales_item_id (PK)
    - sales_invoice_id (FK)
    - product_id (FK)
    - batch_id (FK)
    - quantity
    - unit_price
    - selling_price
    - line_total
    - status (Delivered/Partial/Returned)

### Return Management
17. **CompanyReturn** (Purchase Returns)
    - company_return_id (PK)
    - purchase_invoice_id (FK)
    - return_date
    - return_reason
    - total_return_amount
    - total_tax_returned
    - net_return_amount
    - status (Draft/Approved/Processed)
    - created_by (FK to User)
    - created_at, updated_at

18. **CompanyReturnItem**
    - company_return_item_id (PK)
    - company_return_id (FK)
    - purchase_item_id (FK)
    - batch_id (FK)
    - quantity_returned
    - unit_price
    - return_amount
    - reason_notes

19. **CustomerReturn** (Sales Returns)
    - customer_return_id (PK)
    - sales_invoice_id (FK)
    - return_date
    - return_reason
    - total_return_amount
    - total_tax_returned
    - net_return_amount
    - refund_method (Cash/Adjustment_to_ledger)
    - status (Draft/Approved/Processed)
    - created_by (FK to User)
    - created_at, updated_at

20. **CustomerReturnItem**
    - customer_return_item_id (PK)
    - customer_return_id (FK)
    - sales_item_id (FK)
    - batch_id (FK)
    - quantity_returned
    - unit_price
    - return_amount
    - reason_notes

### Audit & Logging
21. **AuditLog**
    - audit_log_id (PK)
    - user_id (FK)
    - action (CREATE/UPDATE/DELETE/RETURN/PAYMENT)
    - entity_type (Invoice, Product, Customer, etc.)
    - entity_id
    - changes (JSON or detailed description)
    - timestamp
    - ip_address (optional)

---

## 🎨 UI Components & Modules (Match Desktop Styling)

### Color Scheme & Themes
Implement 5 themes matching desktop CSS:
- **Theme Light**: Primary #1565c0 (Blue), Background #f5f5f5, Text #424242
- **Theme Aurora**: Purple/Pink accents
- **Theme Emerald**: Green accents
- **Theme Midnight**: Dark theme with light text
- **Theme Sunset**: Orange/Red accents

### Core UI Components Required
1. **Navigation/Sidebar**
   - Collapsible menu
   - Module links (Dashboard, Sales, Purchase, Inventory, Returns, Reports, Settings)
   - User profile dropdown
   - Theme switcher
   - Logout option

2. **Dashboard**
   - Key metrics (Today's Sales, Total Purchase, Stock Value, etc.)
   - Charts: Sales trend, Purchase trend, Top selling products
   - Quick action cards
   - Recent transactions widget
   - Low stock alerts

3. **Sales Module**
   - New sale form with:
     - Customer selector (auto-complete for named customers)
     - Item line items with product search (auto-complete)
     - Batch selector with expiry date display
     - Quantity input with available stock display
     - Dynamic pricing (unit price, selling price)
     - Discount input (percentage/fixed)
     - Tax calculation
     - Payment section (amount tendered, change calculation)
   - Sale list/history view with filters
   - Print/PDF generation for invoices (different formats for Retail vs Distribution)
   - Thermal slip printing option

4. **Purchase Module**
   - New purchase form with:
     - Supplier selector
     - Item line items with product search
     - Batch number input
     - Manufacturing/Expiry date inputs
     - Quantity and unit price
     - Auto-calculate totals
     - Discount and tax
   - Purchase list with filters
   - Approval workflow
   - Goods Received Note (GRN) functionality

5. **Inventory/Stock Management**
   - Stock status table with:
     - Product name, SKU, category
     - Current quantity, reorder level
     - Stock value
     - Batch details (expiry date warning for expired)
     - Low stock highlighting
   - Stock adjustment form
   - Batch management (split, merge, mark expired)
   - Stock transfer between warehouses

6. **Returns Module** (Item-level returns)
   - Sales Return:
     - Invoice selector (auto-complete)
     - Display original line items with quantities
     - Partial return support (select items/quantities)
     - Return reason selector
     - Auto-calculate refund amount
     - Refund method (Cash/Ledger adjustment)
   - Purchase Return:
     - Same flow but for supplier returns
   - Return history with approval status
   - Refund/Credit note generation

7. **Customer Management**
   - Customer list with:
     - Search/filter functionality
     - Customer type indicator (Retail/Distribution)
     - Current ledger balance
     - Total purchases
   - Add/Edit customer form:
     - Basic info (name, type, contact)
     - Address
     - Credit limit
     - Opening balance
   - Customer ledger view (transaction history)

8. **Supplier Management**
   - Supplier list
   - Add/Edit supplier form
   - Supplier ledger view
   - Purchase history

9. **Product Management**
   - Product list with:
     - SKU, name, category, brand
     - Pricing (purchase, selling)
     - Reorder level
     - Current stock
   - Add/Edit product form with:
     - Basic info (name, SKU, category, brand)
     - Pricing
     - Reorder level
   - Batch management interface

10. **Reports Module**
    - Daily Sales Report:
      - Total sales, items sold, discounts given, tax collected
      - By salesman breakdown
      - By customer type breakdown
    - Purchase Report (similar structure)
    - Profit Analysis:
      - Gross margin
      - Cost of goods sold
      - Net profit
    - Stock Report:
      - Current inventory value
      - Stock age analysis
      - Expiry alerts
    - Audit Log View:
      - All transactions with who/what/when
      - Filterable by date range, user, entity type
    - Export to PDF/Excel for all reports

11. **User Management**
    - User list
    - Add/Edit user form:
      - Username (unique), password (hashed)
      - Full name, email
      - Role assignment
      - Active/Inactive toggle
    - User activity log

12. **Settings Module**
    - Company Settings:
      - Company name, address, logo upload
      - Contact info
      - Tax ID / Registration number
    - Warehouse Settings
    - Category Management
    - Brand Management
    - Salesman Management
    - Payment Terms/Methods
    - System backup/restore

---

## 💼 Core Business Logic (Must Implement)

### Sales Process
1. When creating a sale:
   - Validate customer credit limit (if credit sale)
   - Check product batch expiry (warn if expired)
   - Check available stock (prevent overselling)
   - Apply payment allocation logic: **Previous balance first, then current invoice**
   - Update customer ledger
   - Deduct stock from appropriate batch
   - Generate invoice (A4 PDF for distribution, thermal slip for retail)
   - Create audit log entry

2. Payment Processing:
   - Accept multiple payment methods
   - Calculate change
   - If customer has previous balance, apply payment to balance first
   - Only remaining payment goes to current invoice

3. Invoice Generation:
   - Retail: Thermal slip format (small receipt)
   - Distribution: Formal A4 PDF with:
     - Invoice number, date
     - Company letterhead with logo
     - Customer details
     - Line items (product, batch, qty, price)
     - Subtotal, discount, tax, total
     - Customer ledger info
     - Payment details

### Purchase Process
1. Create PurchaseInvoice with items
2. Validate supplier exists
3. Upon confirmation:
   - Create batches for each item
   - Receive goods (update stock with batch info)
   - Update supplier ledger
   - Create audit log

### Return Process (Item-level)
1. **Sales Return**:
   - Select original invoice
   - Choose specific items and quantities to return (not just whole invoice)
   - Calculate return amount (include tax)
   - Refund method: cash or credit to customer ledger
   - Update stock: return items to batch inventory
   - Update invoice status
   - Update customer ledger
   - Generate credit note
   - Create audit log

2. **Purchase Return**:
   - Select original purchase invoice
   - Choose items/quantities to return
   - Calculate return amount
   - Update stock (remove from batch)
   - Update supplier ledger
   - Generate debit note
   - Create audit log

### Stock Management
1. Stock is tracked by **Batch** (batch number + expiry date)
2. Stock calculation: `quantity_available = quantity_on_hand - quantity_reserved`
3. Low stock alert: when `quantity_on_hand < reorder_level`
4. Expiry warning: when product batch is within 30 days of expiry

### Customer Ledger
- Track opening balance
- Add sale amounts
- Deduct payments
- Calculate current balance
- Show transaction history

### Supplier Ledger
- Track opening balance
- Add purchase amounts
- Deduct payments/returns
- Calculate current balance
- Show transaction history

### Audit Logging
- Log every transaction: CREATE, UPDATE, DELETE, RETURN, PAYMENT
- Capture user, action, entity, timestamp
- Use for compliance and troubleshooting

---

## 🔐 Security Requirements

1. **Authentication**
   - JWT or OAuth2
   - Password hashing with bcrypt
   - Session management (auto-logout after inactivity)

2. **Authorization**
   - Role-based access control (RBAC)
   - Roles: Admin, Manager, Salesman, Accountant, Viewer
   - Module-level and action-level permissions

3. **Data Protection**
   - HTTPS/TLS encryption
   - Database encryption at rest
   - Sensitive data masking in logs

4. **Compliance**
   - Audit trail for all transactions
   - Data retention policies
   - GDPR/privacy compliance (if applicable)

---

## 📊 Reports Requirements

### Sales Reports
- Daily/Weekly/Monthly/Custom date range
- By customer, by salesman, by product category
- Discount analysis, tax summary
- Includes return transactions

### Purchase Reports
- By supplier, by category
- Cost analysis
- Includes return transactions

### Financial Reports
- Profit & Loss statement
- Gross margin analysis
- Customer aging (balance due)
- Supplier aging (balance due)

### Stock Reports
- Current inventory value
- Stock movement (in/out)
- Expiry alerts
- Low stock warnings

### Activity/Audit Reports
- User activity log
- Transaction history (filterable)
- Return transactions
- Payment reconciliation

---

## 🚀 Multi-Tenancy Architecture

1. **Database Schema**
   - Add `tenant_id` (organization_id) to all transactional tables
   - Shared master tables (Category, Brand) or tenant-specific
   - Isolate data at row level using tenant_id in WHERE clauses

2. **User Management**
   - Each user belongs to a tenant
   - Multiple admins per tenant
   - Tenant isolation in all queries

3. **Billing/Subscriptions** (Optional but recommended)
   - Subscription plans (Basic, Professional, Enterprise)
   - Feature toggles by plan
   - Usage tracking

---

## 📱 UI/UX Requirements

1. **Responsive Design**
   - Desktop-first approach
   - Mobile-friendly forms
   - Tablet support
   - Touch-friendly buttons and inputs

2. **Data Tables**
   - Sorting by column
   - Filtering/Search
   - Pagination
   - Bulk actions (export, delete)

3. **Forms**
   - Auto-complete for customer, product, supplier selectors
   - Real-time validation
   - Clear error messages
   - Save/Cancel buttons
   - Confirmation dialogs for critical actions

4. **Dashboard**
   - Real-time metric updates
   - Interactive charts
   - Drill-down capabilities
   - Customizable widgets

5. **Printing & PDF**
   - Generate PDFs on demand
   - Email invoices
   - Print-friendly views
   - Batch PDF generation

---

## ✅ Testing Requirements

1. **Unit Tests**
   - Business logic (calculations, validations)
   - Service methods

2. **Integration Tests**
   - Database transactions
   - API endpoints
   - Multi-step workflows (sale + payment + return)

3. **E2E Tests**
   - Critical user flows (complete sale, process return)
   - User login and role-based access

4. **Load Testing**
   - API performance
   - Database query optimization

---

## 📋 Implementation Checklist

### Phase 1: Setup & Core Data
- [ ] Set up project structure and CI/CD
- [ ] Design and create database schema with migrations
- [ ] Implement authentication system
- [ ] Build User and Company management

### Phase 2: Master Data & Inventory
- [ ] Product, Category, Brand management
- [ ] Batch and Stock management
- [ ] Warehouse management
- [ ] Customer and Supplier management

### Phase 3: Transactions
- [ ] Sales invoice creation and PDF generation
- [ ] Purchase invoice creation
- [ ] Payment processing
- [ ] Delivery management

### Phase 4: Returns
- [ ] Sales return (item-level)
- [ ] Purchase return (item-level)
- [ ] Refund processing
- [ ] Credit/Debit notes

### Phase 5: Reports & Analytics
- [ ] Sales, Purchase, and Profit reports
- [ ] Stock and Audit reports
- [ ] Chart visualizations
- [ ] PDF/Excel export

### Phase 6: UI Polish & Optimization
- [ ] Theme implementation (5 themes)
- [ ] Responsive design
- [ ] Performance optimization
- [ ] UX improvements

### Phase 7: Testing & Deployment
- [ ] Unit and integration tests
- [ ] Load testing
- [ ] Security audit
- [ ] Production deployment

---

## 🎯 Key Success Criteria

1. ✅ All features from desktop version fully implemented
2. ✅ UI visually matches desktop styling and color schemes
3. ✅ All business logic preserved (payment allocation, returns, ledgers)
4. ✅ Multi-tenant support for SaaS scalability
5. ✅ Zero data loss migration from SQLite
6. ✅ Comprehensive audit logging
7. ✅ Fast load times and responsive UI
8. ✅ Complete PDF report generation
9. ✅ Mobile-accessible (at least tablets)
10. ✅ Secure authentication and authorization

---

## 📞 Notes

- The original system uses **JavaFX** for UI and **SQLite** for data
- All CSS themes should be converted to **CSS3/Tailwind** or equivalent
- The **iText PDF library** logic should be replicated with appropriate web libraries (e.g., jsPDF, ReportLab)
- **Stock batch tracking** is critical - must preserve batch-level accuracy
- **Payment allocation logic** is unique - payments go to previous balance first
- **Item-level returns** (not invoice-level) is essential
- Audit logging is critical for compliance
- Multi-currency support should be considered (optional)

---

## 🔄 Expected Deliverables

1. Complete source code (GitHub repository)
2. Database schema and migration scripts
3. API documentation
4. User manual / Help documentation
5. Admin guide for deployment and configuration
6. Security audit report
7. Performance testing report
8. Deployment guide (Docker, AWS/Azure, etc.)

---

**End of Prompt - Use this as your specification document for AI-assisted development**
