import { prisma } from '@/lib/prisma'
import CustomersClient from './CustomersClient'
import { getCustomers } from './actions'
import { getSession } from '@/lib/auth'

export default async function CustomersPage() {
  const session = await getSession()
  const org = session?.organizationId

  const customers = await getCustomers()
  const areas = await prisma.area.findMany({ where: { organizationId: org }, select: { id: true, name: true } })

  return <CustomersClient initialCustomers={customers} areas={areas} />
}