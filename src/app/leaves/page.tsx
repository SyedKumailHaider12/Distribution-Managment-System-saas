import { getLeaves } from './actions';
import { LeavesClient } from './LeavesClient';

export default async function LeavesPage() {
  const { employees, leaves } = await getLeaves();
  return <LeavesClient employees={employees} leaves={leaves} />;
}