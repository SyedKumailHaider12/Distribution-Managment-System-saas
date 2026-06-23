import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { FileDown } from 'lucide-react';

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('reports');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <FileDown className="w-8 h-8 text-indigo-600" /> Reports
          </h1>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
