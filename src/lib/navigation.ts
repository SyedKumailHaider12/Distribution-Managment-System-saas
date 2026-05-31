import { LayoutDashboard, Database, Building2, Layers, Warehouse, Boxes, Archive, ShoppingCart, CreditCard, RotateCcw, Settings, User, LogOut, Users, DollarSign, Calendar, UserCheck } from 'lucide-react';

export const navigation = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { name: 'Companies', href: '/companies', icon: Building2 },
      { name: 'Categories', href: '/categories', icon: Layers },
      { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { name: 'Stock', href: '/stock', icon: Boxes },
      { name: 'Batches', href: '/batches', icon: Archive },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
      { name: 'Sales', href: '/sales', icon: CreditCard },
      { name: 'Returns', href: '/returns', icon: RotateCcw },
    ],
  },
  {
    title: 'HR & Payroll',
    items: [
      { name: 'Employees', href: '/employees', icon: Users },
      { name: 'Attendance', href: '/attendance', icon: UserCheck },
      { name: 'Leave Management', href: '/leaves', icon: Calendar },
      { name: 'Payroll', href: '/payroll', icon: DollarSign },
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Profile', href: '/profile', icon: User },
      { name: 'Logout', href: '/api/auth/logout', icon: LogOut },
    ],
  },
];
