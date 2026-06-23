import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { ShieldAlert } from 'lucide-react';

export default async function AuditLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('reports');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-600" /> System Audit Logs
          </h1>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
