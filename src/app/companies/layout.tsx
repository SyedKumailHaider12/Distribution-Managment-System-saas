import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { Building2 } from 'lucide-react';

export default async function CompaniesLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('master_data');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" /> Company Master
          </h1>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
