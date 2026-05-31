// src/components/RecentInvoicesTable.tsx
import React, { useEffect, useState } from 'react';
import { fetchRecentInvoices, SalesInvoice } from '@/lib/api';
import { CurrencyFormatter } from '@/util/CurrencyFormatter'; // placeholder util, will fallback to simple format

import { useCurrency } from '@/contexts/CurrencyContext';

export const RecentInvoicesTable: React.FC = () => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const { symbol } = useCurrency();

  useEffect(() => {
    fetchRecentInvoices()
      .then(setInvoices)
      .catch(console.error);
  }, []);

  const formatCurrency = (val: number) => {
    return `${symbol} ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#4CAF50';
      case 'partial':
        return '#FFC107';
      default:
        return '#f44336';
    }
  };

  return (
    <table className="styled-table">
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv) => (
          <tr key={inv.invoiceNumber}>
            <td>{inv.invoiceNumber}</td>
            <td>{inv.invoiceDate}</td>
            <td>{formatCurrency(inv.totalAmount)}</td>
            <td style={{ color: statusColor(inv.status) }}>{inv.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
