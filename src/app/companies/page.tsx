import { getCompanies } from './actions'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CompaniesClient from './CompaniesClient'

export default async function CompaniesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const companies = await getCompanies()
  
  return <CompaniesClient initialCompanies={companies} />
}
