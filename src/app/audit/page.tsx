import { prisma } from '@/lib/prisma';
import { Search, Filter } from 'lucide-react';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { action?: string; table?: string };
}) {
  const where: any = {};

  if (searchParams.action) {
    where.action = searchParams.action;
  }
  if (searchParams.table) {
    where.tableName = searchParams.table;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: true,
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  const uniqueActions = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
  });

  const uniqueTables = await prisma.auditLog.findMany({
    select: { tableName: true },
    distinct: ['tableName'],
    where: { tableName: { not: null } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
        <p className="text-slate-400 mt-1">Track all system activities</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <a
          href="/audit"
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            !searchParams.action ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          All Actions
        </a>
        {uniqueActions.map((log) => (
          <a
            key={log.action}
            href={`/audit?action=${log.action}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              searchParams.action === log.action
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {log.action}
          </a>
        ))}
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/50">
        <table className="w-full">
          <thead className="bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                Table
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                Record ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 bg-slate-800/30">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionColors: Record<string, string> = {
                  CREATE: 'bg-emerald-500/20 text-emerald-400',
                  UPDATE: 'bg-blue-500/20 text-blue-400',
                  DELETE: 'bg-red-500/20 text-red-400',
                  RETURN: 'bg-purple-500/20 text-purple-400',
                  PAYMENT: 'bg-amber-500/20 text-amber-400',
                };

                return (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {log.user?.fullName || log.user?.username || 'System'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          actionColors[log.action] || 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{log.tableName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{log.recordId || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}