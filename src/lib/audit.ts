import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function logActivity({
  action,
  tableName,
  recordId,
  details
}: {
  action: string;
  tableName?: string;
  recordId?: number;
  details?: string;
}) {
  try {
    const session = await getSession();
    if (!session) return; // Silent fail if no session

    await prisma.auditLog.create({
      data: {
        organizationId: session.organizationId,
        userId: session.id,
        action,
        tableName,
        recordId,
        details,
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
