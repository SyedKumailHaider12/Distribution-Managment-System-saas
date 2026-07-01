import { getSASession } from '@/lib/superauth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Building2, Users, Activity, CreditCard, DollarSign } from 'lucide-react';

export default async function SuperAdminDashboard() {
  const sa = await getSASession();
  if (!sa) {
    redirect('/superadmin/Azantech/distribution/ms');
  }

  // Fetch quick stats
  const totalOrgs = await prisma.organization.count();
  const activeOrgs = await prisma.organization.count({ where: { subscriptionStatus: 'ACTIVE' } });
  const trialOrgs = await prisma.organization.count({ where: { subscriptionStatus: 'TRIAL' } });
  const expiredOrgs = await prisma.organization.count({ where: { subscriptionStatus: 'EXPIRED' } });
  
  const totalUsers = await prisma.user.count();

  // Revenue calc
  const paidOrgs = await prisma.organization.findMany({
    where: { paymentStatus: 'PAID' },
    select: { subscriptionFee: true }
  });
  const totalRevenue = paidOrgs.reduce((sum, org) => sum + (org.subscriptionFee || 0), 0);
  
  // Recent orgs
  const recentOrgs = await prisma.organization.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, subscriptionStatus: true, createdAt: true }
  });

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Organizations', value: totalOrgs, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Active Subscriptions', value: activeOrgs, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Trial Organizations', value: trialOrgs, icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">System Overview</h1>
        <p className="text-slate-400 mt-1">Welcome back, {sa.fullName || sa.username}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
                  <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orgs */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Recent Organizations</h2>
          <div className="space-y-4">
            {recentOrgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="font-bold text-white">{org.name}</p>
                  <p className="text-xs text-slate-500">{new Date(org.createdAt).toLocaleDateString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  org.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                  org.subscriptionStatus === 'TRIAL' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {org.subscriptionStatus}
                </div>
              </div>
            ))}
            {recentOrgs.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No organizations found.</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">System Health</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Database Connection</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Expired Accounts</span>
                <span className="text-red-400 font-bold">{expiredOrgs} found</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${(expiredOrgs / Math.max(totalOrgs, 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
