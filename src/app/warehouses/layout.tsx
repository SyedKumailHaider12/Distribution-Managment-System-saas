import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { Warehouse } from 'lucide-react';

export default async function WarehousesLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('master_data');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Warehouse className="w-8 h-8 text-amber-600" /> Warehouses
          </h1>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
