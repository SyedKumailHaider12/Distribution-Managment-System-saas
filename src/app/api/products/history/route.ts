import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    const organizationId = session.organizationId;

    // Fetch the latest purchase invoice items for this product
    // Group by batch to get unique packing history
    const items = await prisma.purchaseInvoiceItem.findMany({
      where: {
        organizationId,
        productId: parseInt(productId),
      },
      include: {
        batch: true,
        product: true,
        invoice: {
          select: { invoiceDate: true, invoiceNumber: true }
        }
      },
      orderBy: { invoice: { invoiceDate: 'desc' } },
      take: 20
    });

    // Deduplicate by batch + purchasePrice combination, keep the most recent
    const seenKeys = new Set<string>();
    const uniqueHistory: typeof items = [];
    for (const item of items) {
      const key = `${item.batchId}-${item.purchasePrice}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueHistory.push(item);
      }
    }

    // Also fetch current product sale prices
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId), organizationId },
      select: {
        id: true,
        name: true,
        purchasePrice: true,
        salePriceRetail: true,
        salePriceDistribution: true,
      }
    });

    return NextResponse.json({
      product,
      history: uniqueHistory.map(item => ({
        invoiceNumber: item.invoice.invoiceNumber,
        invoiceDate: item.invoice.invoiceDate,
        batchNumber: item.batch.batchNumber,
        expiryDate: item.batch.expiryDate,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        salePriceRetail: item.product.salePriceRetail,
        salePriceDistribution: item.product.salePriceDistribution,
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
