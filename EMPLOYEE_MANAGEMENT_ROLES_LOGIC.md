# Employee Management, Attendance, Payroll & Role Access (HR)

This describes how **Employee Management** works in this project and how **role-based access control** (RBAC) is enforced.

> Main files
- UI: `src/app/employees/EmployeesClient.tsx`
- Server actions: `src/app/employees/actions.ts`
- Page + permission gate: `src/app/employees/page.tsx`
- Auth + permissions plumbing:
  - `src/lib/auth.ts`
  - `src/lib/authorization.ts`
  - `src/components/AccessRestricted.tsx`

---

## 1) HR Modules in the UI (EmployeeClient)
The HR screen is tabbed and provides three modules:

### A) Directory (Employees)
In `EmployeesClient.tsx` (`activeTab === 'DIRECTORY'`):
- Shows a list of employees.
- Lets users **Add Staff** or edit/delete existing staff.

Employee modal fields (Create):
- Full name (`name`)
- Employee code (`employeeCode`)
- Role (`role`)
- Phone (`phone`)
- Base salary (`baseSalary`)
- Join date (`joinDate`)
- Branch (`branchId`)
- Optional login credentials:
  - `username`
  - `password`

### B) Attendance
In `EmployeesClient.tsx` (`activeTab === 'ATTENDANCE'`):
- User selects a date (`attDate`).
- For each employee, user can mark one status:
  - `PRESENT`
  - `ABSENT`
  - `HALF_DAY`
  - `LEAVE`

### C) Payroll
In `EmployeesClient.tsx` (`activeTab === 'PAYROLL'`):
- User selects a month (`payMonth`, type=`month`).
- For each employee:
  - If a salary slip exists for the month, it shows:
    - deductions
    - net salary
    - status (`PAID`/`UNPAID`)
  - If it doesn’t exist, user can **Generate**.

---

## 2) Server-side actions (what really happens)
All HR write operations run via server actions in `src/app/employees/actions.ts`.

### 2.1 getEmployees / getEmployeeById
Both call:
- `requirePermissionForAction('people')`

They only return employees that belong to the current session’s `organizationId`.

### 2.2 createEmployee (and creating linked user + salesman profile)
When a new employee is registered:
1. Permission check
   - `requirePermissionForAction('people')`
2. Validate branch exists for the same org
3. Create `employee` row with:
   - `organizationId`, `branchId`, role, baseSalary, etc.
4. If `username` + `password` are provided:
   - Hash password via `hashPassword()` from `src/lib/auth.ts`
   - Create a `user` row
   - Map role to user role used by login:
     - if employee role is `Admin` → user role `admin`
     - if `Manager` → `manager`
     - else → `cashier`
   - Link user to employee via `employee.userId`
5. If role is exactly `Salesman`:
   - Create a `salesman` profile row linked by `employeeId`

### 2.3 updateEmployee
- Permission: `requirePermissionForAction('people')`
- Updates employee fields scoped by `(id, organizationId)`

### 2.4 deleteEmployee
- Permission: `requirePermissionForAction('people')`
- Deletes the employee scoped by `(id, organizationId)`

### 2.5 Attendance (markAttendance)
- Permission: `requirePermissionForAction('people')`
- Verifies employee belongs to the org
- Uses `prisma.attendance.upsert` keyed by `(employeeId, date)` so marking the same date updates instead of duplicating.

Statuses stored:
- `PRESENT | ABSENT | HALF_DAY | LEAVE`

### 2.6 Payroll
- `generateSalarySlip()`
  - Permission: `requirePermissionForAction('people')`
  - Computes:
    - `netSalary = baseSalary - deductions + bonuses`
  - Writes/updates a `salarySlip` for `(employeeId, month)` using `upsert`.
- `markSalaryPaid()`
  - Permission: `requirePermissionForAction('people')`
  - Verifies the salary slip’s employee is in the same org.
  - Updates slip status to `PAID` and sets `paidDate`.

---

## 3) Role Access Control (RBAC) - how permission is enforced
There are two layers:

### Layer 1: Page-level gate
In `src/app/employees/page.tsx`:
- Loads session via `getSession()`.
- Redirects to `/login` if no session.
- Checks access:
  - `hasAccess = await checkPermission('people')`

If `hasAccess` is false:
- The page does not fetch employees/roles/slips/attendance.
- It still renders `EmployeesClient` with `hasAccess={false}`.

### Layer 2: Server-action permission enforcement
In `src/app/employees/actions.ts` every action starts with:
- `requirePermissionForAction('people')`

This means even if the UI is bypassed, the server refuses unauthorized actions.

---

## 4) How roles are interpreted (admin vs module permissions)
Permissions come from:
- `src/lib/auth.ts` → `login()` creates `permissions` array for the user.

Rules in `src/lib/authorization.ts`:
- If `session.role === 'admin'` → access always allowed
- If `session.permissions` contains `'*'` → access always allowed
- Otherwise:
  - module access is based on whether `session.permissions.includes(moduleId)`

For HR module, the module id is:
- `people`

---

## 5) Where “Access Restricted” appears
UI uses `hasAccess` to disable actions.
- Add Staff button disabled when `!hasAccess`
- Attendance marking and payroll actions are disabled when `!hasAccess`

`src/components/AccessRestricted.tsx` exists for showing a dedicated blocked panel, but this HR screen primarily shows the table with disabled/empty state.

---

## 6) Summary
- **Employee Management (Directory)**: CRUD of employees, optional creation of login user, optional salesman profile.
- **Attendance**: upsert attendance records per employee per date.
- **Payroll**: generate salary slips (month) and mark them as paid.
- **RBAC**: all HR server actions require `people` permission; admin bypasses permission checks.

