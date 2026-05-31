import { getPurchaseInvoices, getPurchaseReturns } from './actions';
import { PurchaseReturnsClient } from './PurchaseReturnsClient';

export default async function PurchaseReturnsPage() {
  const invoices = await getPurchaseInvoices();
  const returns = await getPurchaseReturns();
  
  return <PurchaseReturnsClient invoices={invoices} returns={returns} />;
}
