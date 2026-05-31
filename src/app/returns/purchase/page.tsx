import { getPurchaseInvoicesForReturn } from '../actions';
import { PurchaseReturnsClient } from './PurchaseReturnsClient';

export default async function PurchaseReturnsPage() {
  const invoices = await getPurchaseInvoicesForReturn();
  return <PurchaseReturnsClient initialInvoices={invoices} />;
}