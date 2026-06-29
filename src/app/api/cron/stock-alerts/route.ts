import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint is called by Vercel Cron or an external scheduler
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/stock-alerts", "schedule": "0 8 * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (set CRON_SECRET in env to protect this endpoint)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process all organizations
    const organizations = await prisma.organization.findMany({
      select: { id: true, name: true, email: true },
    });

    const results: { orgId: number; orgName: string; lowStock: number; expiring: number; emailSent: boolean }[] = [];

    for (const org of organizations) {
      const settings = await prisma.settings.findUnique({ where: { organizationId: org.id } });
      const lowStockThreshold = parseInt(settings?.alertStockThreshold || '10');
      const expiryAlertDays = parseInt(settings?.alertExpiryDays || '30');
      const expiryAlertDate = new Date();
      expiryAlertDate.setDate(expiryAlertDate.getDate() + expiryAlertDays);

      const [lowStockItems, expiringItems] = await Promise.all([
        prisma.stock.findMany({
          where: {
            organizationId: org.id,
            quantity: { lte: lowStockThreshold },
          },
          include: {
            product: { select: { name: true } },
            warehouse: { select: { name: true } },
          },
        }),
        prisma.stock.findMany({
          where: {
            organizationId: org.id,
            quantity: { gt: 0 },
            batch: { expiryDate: { lte: expiryAlertDate, gt: new Date() } },
          },
          include: {
            product: { select: { name: true } },
            batch: { select: { batchNumber: true, expiryDate: true } },
          },
        }),
      ]);

      // Only send emails if there are alerts and an org email exists
      let emailSent = false;
      if ((lowStockItems.length > 0 || expiringItems.length > 0) && org.email) {
        try {
          emailSent = await sendAlertEmail(org.email, org.name, lowStockItems, expiringItems);
        } catch (e) {
          console.error(`Email failed for org ${org.name}:`, e);
        }
      }

      // Log the cron run
      const adminUser = await prisma.user.findFirst({
        where: { organizationId: org.id, role: 'admin' },
        select: { id: true },
      });

      if (adminUser && (lowStockItems.length > 0 || expiringItems.length > 0)) {
        await prisma.auditLog.create({
          data: {
            organizationId: org.id,
            userId: adminUser.id,
            action: 'CRON_STOCK_ALERT',
            details: `Low stock: ${lowStockItems.length}, Expiring: ${expiringItems.length}. Email ${emailSent ? 'sent' : 'skipped'}.`,
          },
        });
      }

      results.push({
        orgId: org.id,
        orgName: org.name,
        lowStock: lowStockItems.length,
        expiring: expiringItems.length,
        emailSent,
      });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Cron stock-alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendAlertEmail(
  to: string,
  orgName: string,
  lowStockItems: any[],
  expiringItems: any[]
): Promise<boolean> {
  // Use Resend if available, otherwise log
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log(`[EMAIL SKIPPED] No RESEND_API_KEY set. Would send to ${to}:`);
    console.log(`  Low stock: ${lowStockItems.length}, Expiring: ${expiringItems.length}`);
    return false;
  }

  const lowStockHtml = lowStockItems.length > 0
    ? `<h3 style="color: #d97706;">⚠️ Low Stock Items (${lowStockItems.length})</h3>
       <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
         <tr style="background:#f8fafc;"><th style="padding:8px; text-align:left; border-bottom:1px solid #e2e8f0;">Product</th><th style="padding:8px; text-align:left; border-bottom:1px solid #e2e8f0;">Qty</th><th style="padding:8px; text-align:left; border-bottom:1px solid #e2e8f0;">Warehouse</th></tr>
         ${lowStockItems.map(i => `<tr><td style="padding:8px; border-bottom:1px solid #f1f5f9;">${i.product.name}</td><td style="padding:8px; border-bottom:1px solid #f1f5f9; color:${i.quantity === 0 ? '#ef4444' : '#d97706'}; font-weight:bold;">${i.quantity}</td><td style="padding:8px; border-bottom:1px solid #f1f5f9;">${i.warehouse.name}</td></tr>`).join('')}
       </table>`
    : '';

  const expiringHtml = expiringItems.length > 0
    ? `<h3 style="color: #ef4444;">🕐 Expiring Soon (${expiringItems.length})</h3>
       <table style="width:100%; border-collapse:collapse;">
         <tr style="background:#f8fafc;"><th style="padding:8px; text-align:left; border-bottom:1px solid #e2e8f0;">Product</th><th style="padding:8px; text-align:left; border-bottom:1px solid #e2e8f0;">Batch</th><th style="padding:8px; text-align:left; border-bottom:1px solid #e2e8f0;">Expiry</th></tr>
         ${expiringItems.map(i => `<tr><td style="padding:8px; border-bottom:1px solid #f1f5f9;">${i.product.name}</td><td style="padding:8px; border-bottom:1px solid #f1f5f9;">${i.batch.batchNumber}</td><td style="padding:8px; border-bottom:1px solid #f1f5f9; color:#ef4444; font-weight:bold;">${new Date(i.batch.expiryDate).toLocaleDateString()}</td></tr>`).join('')}
       </table>`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:600px; margin:0 auto; padding:24px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding:24px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:20px;">📦 Stock Alert — ${orgName}</h1>
        <p style="margin:8px 0 0; opacity:0.9; font-size:14px;">Daily inventory alert from AzanTechSolutions DMS</p>
      </div>
      <div style="background:white; padding:24px; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 12px 12px;">
        ${lowStockHtml}
        ${expiringHtml}
        <p style="color:#94a3b8; font-size:12px; margin-top:24px; text-align:center;">This is an automated alert. Login to your dashboard for full details.</p>
      </div>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: 'AzanTech DMS <alerts@azantechsolutions.com>',
      to: [to],
      subject: `Stock Alert: ${lowStockItems.length} low stock, ${expiringItems.length} expiring — ${orgName}`,
      html,
    }),
  });

  return res.ok;
}
