// src/lib/api.ts

// NOTE: In a real deployment these would call your backend REST endpoints.
// For now we return mocked data that matches the JavaFX Dashboard expectations.

export interface KPIs {
  todaySales: number;
  receivables: number;
  payables: number;
  lowStock: number;
  expiring: number;
}

export interface ProductData {
  name: string;
  quantity: number;
}

export interface SalesInvoice {
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  totalAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface ExpiringItem {
  name: string;
  expiryDate: string; // ISO date string
}

// Simulate network latency
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const fetchKPIs = async (): Promise<KPIs> => {
  await delay(200);
  return {
    todaySales: 12450.75,
    receivables: 8420.00,
    payables: 5320.50,
    lowStock: 12,
    expiring: 4,
  };
};

export const fetchTopProducts = async (): Promise<ProductData[]> => {
  await delay(200);
  return [
    { name: 'Paracetamol', quantity: 120 },
    { name: 'Ibuprofen', quantity: 95 },
    { name: 'Aspirin', quantity: 80 },
    { name: 'Cough Syrup', quantity: 70 },
    { name: 'Vitamin C', quantity: 65 },
  ];
};

export const fetchRecentInvoices = async (): Promise<SalesInvoice[]> => {
  await delay(200);
  return [
    { invoiceNumber: 'INV-00123', invoiceDate: '2026-05-20', totalAmount: 2300.0, status: 'paid' },
    { invoiceNumber: 'INV-00122', invoiceDate: '2026-05-19', totalAmount: 1500.0, status: 'partial' },
    { invoiceNumber: 'INV-00121', invoiceDate: '2026-05-18', totalAmount: 970.5, status: 'unpaid' },
    { invoiceNumber: 'INV-00120', invoiceDate: '2026-05-17', totalAmount: 4200.0, status: 'paid' },
    { invoiceNumber: 'INV-00119', invoiceDate: '2026-05-16', totalAmount: 1130.75, status: 'partial' },
  ];
};

export const fetchExpiringItems = async (): Promise<ExpiringItem[]> => {
  await delay(200);
  return [
    { name: 'Amoxicillin', expiryDate: '2026-07-15' },
    { name: 'Insulin', expiryDate: '2026-07-30' },
    { name: 'Epinephrine', expiryDate: '2026-08-05' },
  ];
};
