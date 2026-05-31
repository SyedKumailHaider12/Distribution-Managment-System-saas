import { getEmployees, getSalarySlips, generateSalarySlip } from './actions';
import { PayrollClient } from './PayrollClient';

export default async function PayrollPage() {
  const [employees, salarySlips] = await Promise.all([
    getEmployees(),
    getSalarySlips(),
  ]);

  return <PayrollClient initialEmployees={employees} initialSlips={salarySlips} />;
}