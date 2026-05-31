import { getSalesInvoices, getCustomerReturns } from './actions';
import { CustomerReturnsClient } from './CustomerReturnsClient';

export default async function CustomerReturnsPage() {
  const invoices = await getSalesInvoices();
  const returns = await getCustomerReturns();
  
  return <CustomerReturnsClient invoices={invoices} returns={returns} />;
}
