import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { RefreshCcw } from 'lucide-react';

export default async function ReturnsLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('returns');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <RefreshCcw className="w-8 h-8 text-rose-600" /> Returns Management
          </h1>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
