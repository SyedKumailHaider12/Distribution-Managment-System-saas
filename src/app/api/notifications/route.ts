import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = session.organizationId;

    const settings = await prisma.settings.findUnique({ where: { organizationId: org } });
    const lowStockThreshold = parseInt(settings?.alertStockThreshold || '10');
    const expiryAlertDays = parseInt(settings?.alertExpiryDays || '30');
    const expiryAlertDate = new Date();
    expiryAlertDate.setDate(expiryAlertDate.getDate() + expiryAlertDays);

    const [lowStockItems, expiringItems] = await Promise.all([
      prisma.stock.findMany({
        where: {
          organizationId: org,
          quantity: { lte: lowStockThreshold },
        },
        include: {
          product: { select: { name: true, reorderLevel: true } },
          warehouse: { select: { name: true } },
        },
        take: 20,
      }),
      prisma.stock.findMany({
        where: {
          organizationId: org,
          quantity: { gt: 0 },
          batch: { expiryDate: { lte: expiryAlertDate, gt: new Date() } },
        },
        include: {
          product: { select: { name: true } },
          batch: { select: { batchNumber: true, expiryDate: true } },
          warehouse: { select: { name: true } },
        },
        take: 20,
      }),
    ]);

    const notifications: {
      id: string;
      type: 'low_stock' | 'expiring';
      title: string;
      message: string;
      severity: 'warning' | 'critical';
      timestamp: Date;
    }[] = [];

    for (const item of lowStockItems) {
      const severity = item.quantity === 0 ? 'critical' : 'warning';
      notifications.push({
        id: `ls-${item.id}`,
        type: 'low_stock',
        title: item.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
        message: `${item.product.name} — ${item.quantity} units left in ${item.warehouse.name}`,
        severity,
        timestamp: new Date(),
      });
    }

    for (const item of expiringItems) {
      const daysLeft = Math.ceil(
        (new Date(item.batch.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `exp-${item.id}`,
        type: 'expiring',
        title: 'Expiry Alert',
        message: `${item.product.name} (Batch: ${item.batch.batchNumber}) expires in ${daysLeft} days`,
        severity: daysLeft <= 7 ? 'critical' : 'warning',
        timestamp: new Date(),
      });
    }

    return NextResponse.json({
      notifications,
      counts: {
        total: notifications.length,
        critical: notifications.filter((n) => n.severity === 'critical').length,
        lowStock: lowStockItems.length,
        expiring: expiringItems.length,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
