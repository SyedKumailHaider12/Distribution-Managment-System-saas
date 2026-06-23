"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Warehouse, Tags, Layers,
  ShoppingCart, Receipt, Truck, RotateCcw, CornerDownLeft,
  Users, Building2, UserCheck, Building,
  Shield, FileText, Settings, X, LogOut, User
} from 'lucide-react';
import { useAuth } from './AuthProvider';

const MENU_ITEMS = [
  { section: 'MAIN', moduleId: 'dashboard', items: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }
  ]},
  { section: 'INVENTORY', moduleId: 'inventory', items: [
    { name: 'Purchase', icon: ShoppingCart, path: '/purchases' },
    { name: 'Stock', icon: Warehouse, path: '/stock' },
    { name: 'Categories', icon: Tags, path: '/categories' },
    { name: 'Batches', icon: Layers, path: '/batches' },
  ]},
  { section: 'TRANSACTIONS', moduleId: 'sales', items: [
    { name: 'Sales Invoices', icon: Receipt, path: '/sales' },
    { name: 'Deliveries', icon: Truck, path: '/deliveries' },
  ]},
  { section: 'RETURNS', moduleId: 'returns', items: [
    { name: 'Customer Returns', icon: RotateCcw, path: '/returns/sales' },
    { name: 'Company Returns', icon: CornerDownLeft, path: '/returns/purchase' },
  ]},
  { section: 'PEOPLE', moduleId: 'people', items: [
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Suppliers', icon: Building2, path: '/suppliers' },
    { name: 'Salesmen', icon: UserCheck, path: '/salesmen' },
    { name: 'Employees', icon: User, path: '/employees' },
  ]},
  { section: 'MASTER DATA', moduleId: 'master_data', items: [
    { name: 'Companies', icon: Building, path: '/companies' },
    { name: 'Warehouses', icon: Warehouse, path: '/warehouses' },
  ]},
  { section: 'REPORTS', moduleId: 'reports', items: [
    { name: 'Sales Report', icon: Receipt, path: '/reports/sales' },
    { name: 'Purchase Report', icon: ShoppingCart, path: '/reports/purchase' },
    { name: 'Stock Report', icon: Package, path: '/reports/stock' },
    { name: 'Audit Logs', icon: FileText, path: '/audit' },
  ]},
  { section: 'SYSTEM', moduleId: 'settings', items: [
    { name: 'Users', icon: Shield, path: '/users' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ]},
];

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user: {
    id: number;
    username: string;
    role: string;
    fullName: string | null;
    permissions?: string[];
  };
}

export function Sidebar({ isOpen, toggleSidebar, user }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-screen w-[260px] 
        bg-[var(--glass-bg)] backdrop-blur-2xl 
        border-r border-[var(--glass-border)]
        transition-transform duration-300 ease-in-out z-40
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Gradient Top Line */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-600 shrink-0"></div>
        
        {/* Logo Section */}
        <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white mb-0.5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">AzanTechDMS</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              Distribution Management
            </p>
          </div>
          <button onClick={toggleSidebar} className="text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto scrollbar-none">
          {MENU_ITEMS.map((section, idx) => {
            const hasPermission = user.permissions?.includes('*') || user.permissions?.includes(section.moduleId);
            if (!hasPermission) return null;

            return (
              <div key={idx}>
                <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.section}
                </h3>
              <div className="space-y-1">
                {section.items.map((item, i) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={i} 
                      href={item.path}
                      className={`
                        group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }
                      `}
                    >
                      <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                      {item.name}
                    </Link>
                  )
                })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user.fullName?.[0] || user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-white truncate">
                {user.fullName || user.username}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
