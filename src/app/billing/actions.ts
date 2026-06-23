'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function processMockPayment() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const org = session.organizationId;
  const now = new Date();
  const subscriptionEndsAt = new Date(now.getTime() + 30 * 86400000); // Add 30 days

  await prisma.organization.update({
    where: { id: org },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionEndsAt,
    }
  });

  return { success: true };
}
