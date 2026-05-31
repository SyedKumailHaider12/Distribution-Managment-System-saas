import { getEmployees } from './actions';
import { getEmployeeRoles } from '../settings/roleActions';
import { EmployeesClient } from './EmployeesClient';

export default async function EmployeesPage() {
  const employees = await getEmployees();
  const roles = await getEmployeeRoles();
  return <EmployeesClient initialEmployees={employees} availableRoles={roles} />;
}