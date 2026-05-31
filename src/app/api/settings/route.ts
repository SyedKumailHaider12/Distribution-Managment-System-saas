import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await prisma.settings.findUnique({
    where: { organizationId: session.organizationId },
  });

  if (!settings) {
    // Return defaults
    return NextResponse.json({
      companyName: '',
      companyContact: '',
      companyPhone: '',
      companyEmail: '',
      companyAddress: '',
      companyCity: '',
      invoiceHeader: '',
      invoiceFooter: '',
      invoicePrefix: 'INV',
      invoiceTax: '0',
      currency: 'PKR',
      invoiceShowLogo: true,
      alertExpiryDays: '30',
      alertStockThreshold: '10',
      alertEmailEnabled: false,
      alertEmail: '',
      theme: 'light',
    });
  }

  return NextResponse.json({
    companyName: settings.companyName || '',
    companyContact: settings.companyContact || '',
    companyPhone: settings.companyPhone || '',
    companyEmail: settings.companyEmail || '',
    companyAddress: settings.companyAddress || '',
    companyCity: settings.companyCity || '',
    invoiceHeader: settings.invoiceHeader || '',
    invoiceFooter: settings.invoiceFooter || '',
    invoicePrefix: settings.invoicePrefix || 'INV',
    invoiceTax: settings.invoiceTax || '0',
    currency: settings.currency || 'PKR',
    invoiceShowLogo: settings.invoiceShowLogo ?? true,
    alertExpiryDays: settings.alertExpiryDays || '30',
    alertStockThreshold: settings.alertStockThreshold || '10',
    alertEmailEnabled: settings.alertEmailEnabled ?? false,
    alertEmail: settings.alertEmail || '',
    theme: settings.theme || 'light',
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const excelFile = formData.get('excelFile') as File | null;

  let excelPath: string | undefined;
  if (excelFile) {
    // Save the uploaded file to src/data folder (ensure folder exists)
    const dataDir = path.resolve('src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const fileName = excelFile.name || 'Products.xlsx';
    const filePath = path.join(dataDir, fileName);
    const arrayBuffer = await excelFile.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    excelPath = `src/data/${fileName}`;
  }

  // Upsert settings record
  const updated = await prisma.settings.upsert({
    where: { organizationId: session.organizationId },
    update: { ...(excelPath ? { excelPath } : {}) },
    create: { organizationId: session.organizationId, ...(excelPath ? { excelPath } : {}) },
  });

  return NextResponse.json(updated);
}
