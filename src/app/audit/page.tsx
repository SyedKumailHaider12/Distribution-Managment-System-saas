import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AuditClient from './AuditClient';

export default async function AuditPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const organizationId = session.organizationId;

  const [logs, users] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, fullName: true, username: true } } },
      orderBy: { timestamp: 'desc' },
      take: 500,
    }),
    prisma.user.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, fullName: true, username: true, role: true },
      orderBy: { fullName: 'asc' },
    }),
  ]);

  return <AuditClient logs={logs} users={users} />;
}
