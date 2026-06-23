import { checkPermission } from '@/lib/authorization';
import { AccessRestricted } from '@/components/AccessRestricted';
import { Users as UsersIcon } from 'lucide-react';

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const hasAccess = await checkPermission('settings');
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-teal-600" /> System Users
          </h1>
        </div>
        <AccessRestricted />
      </div>
    );
  }
  return <>{children}</>;
}
