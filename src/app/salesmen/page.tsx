import { getSalesmen, getAvailableEmployees } from './actions'
import SalesmenClient from './SalesmenClient'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SalesmenPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [salesmen, employees] = await Promise.all([
    getSalesmen(),
    getAvailableEmployees(),
  ])

  return <SalesmenClient initialSalesmen={salesmen} availableEmployees={employees} />
}
