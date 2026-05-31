import { getSalesmen } from './actions'
import SalesmenClient from './SalesmenClient'

export default async function SalesmenPage() {
  const salesmen = await getSalesmen()
  return <SalesmenClient initialSalesmen={salesmen} />
}
