'use client';

import { useState, useEffect } from 'react';
import { Building2, FileText, Bell, Database, Palette, Save, Sun, Moon, Upload, X, UserCog, Plus, Trash2 } from 'lucide-react';
import { saveOrganizationSettings } from './actions';
import { getEmployeeRoles, createEmployeeRole, deleteEmployeeRole, getRolePermissions, updateRolePermissions } from './roleActions';
import { useTheme } from '@/components/ThemeProvider';

const TABS = [
  { id: 'company', name: 'Organization Company', icon: Building2 },
  { id: 'invoice', name: 'Invoice Settings', icon: FileText },
  { id: 'roles', name: 'Employee Roles', icon: UserCog },
  { id: 'alerts', name: 'Alert Settings', icon: Bell },
  { id: 'backup', name: 'Backup Settings', icon: Database },
  { id: 'appearance', name: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const { theme: globalTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [company, setCompany] = useState({
    name: '', contactPerson: '', phone: '', email: '', address: '', city: ''
  });

  const [invoice, setInvoice] = useState({
    header: '', footer: '', prefix: 'INV', tax: '0', currency: 'PKR', showLogo: true
  });

  const [alerts, setAlerts] = useState({
    expiryDays: '30', lowStockThreshold: '10', emailAlerts: false, alertEmail: ''
  });

  const [backup, setBackup] = useState({
    path: '/backups', frequency: 'daily', time: '00:00', lastBackup: 'Never'
  });

  const [roles, setRoles] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string | null>(null);
  const [selectedRoleModules, setSelectedRoleModules] = useState<string[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory', label: 'Inventory (Purchases, Stock, etc)' },
    { id: 'sales', label: 'Transactions (Sales)' },
    { id: 'returns', label: 'Returns' },
    { id: 'people', label: 'People (Customers, Suppliers, etc)' },
    { id: 'master_data', label: 'Master Data (Companies, Warehouses)' },
    { id: 'reports', label: 'Reports & Logs' },
    { id: 'settings', label: 'System & Settings' },
  ];

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data && !data.error) {
          setCompany({
            name: data.companyName || '',
            contactPerson: data.companyContact || '',
            phone: data.companyPhone || '',
            email: data.companyEmail || '',
            address: data.companyAddress || '',
            city: data.companyCity || ''
          });
          setInvoice({
            header: data.invoiceHeader || '',
            footer: data.invoiceFooter || '',
            prefix: data.invoicePrefix || 'INV',
            tax: data.invoiceTax || '0',
            currency: data.currency || 'PKR',
            showLogo: data.invoiceShowLogo ?? true
          });
          setAlerts({
            expiryDays: data.alertExpiryDays || '30',
            lowStockThreshold: data.alertStockThreshold || '10',
            emailAlerts: data.alertEmailEnabled ?? false,
            alertEmail: data.alertEmail || ''
          });
        }

        // Load employee roles and permissions
        const [rolesData, permsData] = await Promise.all([
          getEmployeeRoles(),
          getRolePermissions()
        ]);
        setRoles(rolesData);
        setRolePermissions(permsData);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
      setIsLoaded(true);
    }
    loadSettings();
  }, []);

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setIsAddingRole(true);
    try {
      await createEmployeeRole(newRoleName.trim());
      const rolesData = await getEmployeeRoles();
      setRoles(rolesData);
      setNewRoleName('');
    } catch (err: any) {
      alert(err.message || 'Failed to add role');
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await deleteEmployeeRole(id);
      const rolesData = await getEmployeeRoles();
      setRoles(rolesData);
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  const openRolePermissions = (roleName: string) => {
    setSelectedRoleForPerms(roleName);
    const existing = rolePermissions.find(p => p.role === roleName);
    if (existing && existing.modules) {
      try {
        setSelectedRoleModules(JSON.parse(existing.modules));
      } catch {
        setSelectedRoleModules([]);
      }
    } else {
      setSelectedRoleModules([]);
    }
  };

  const toggleRoleModule = (moduleId: string) => {
    setSelectedRoleModules(prev => 
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForPerms) return;
    setIsSavingPerms(true);
    try {
      await updateRolePermissions(selectedRoleForPerms, selectedRoleModules);
      const permsData = await getRolePermissions();
      setRolePermissions(permsData);
      setSelectedRoleForPerms(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveOrganizationSettings({
        companyName: company.name,
        companyContact: company.contactPerson,
        companyPhone: company.phone,
        companyEmail: company.email,
        companyAddress: company.address,
        companyCity: company.city,
        invoiceHeader: invoice.header,
        invoiceFooter: invoice.footer,
        invoicePrefix: invoice.prefix,
        invoiceTax: invoice.tax,
        currency: invoice.currency,
        invoiceShowLogo: invoice.showLogo,
        alertExpiryDays: alerts.expiryDays,
        alertStockThreshold: alerts.lowStockThreshold,
        alertEmailEnabled: alerts.emailAlerts,
        alertEmail: alerts.alertEmail,
      });

      // Handle Logo Upload via API Route if file exists
      if (logoFile) {
        const formData = new FormData();
        formData.append('excelFile', logoFile);
        await fetch('/api/settings', { method: 'POST', body: formData });
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-teal-600" /> Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure system preferences and company profile</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-4 h-4" /> {tab.name}
            </button>
          );
        })}
      </div>

      {saved && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3"><Save className="w-5 h-5" /> Settings saved successfully!</div>}

      {/* ===== ORGANIZATION COMPANY TAB ===== */}
      {activeTab === 'company' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Organization Company</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
              <input type="text" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Upload Organization Logo</label>
              <div className="flex items-center gap-4">
                 <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
              <input type="text" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City</label>
              <input type="text" value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
              <textarea value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={2}></textarea>
            </div>
          </div>
        </div>
      )}

      {/* ===== INVOICE SETTINGS TAB ===== */}
      {activeTab === 'invoice' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Invoice Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Invoice Header</label>
              <textarea value={invoice.header} onChange={(e) => setInvoice({ ...invoice, header: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={2}></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Invoice Footer</label>
              <textarea value={invoice.footer} onChange={(e) => setInvoice({ ...invoice, footer: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={2}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Invoice Prefix</label>
              <input type="text" value={invoice.prefix} onChange={(e) => setInvoice({ ...invoice, prefix: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tax %</label>
              <input type="number" value={invoice.tax} onChange={(e) => setInvoice({ ...invoice, tax: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
              <select value={invoice.currency} onChange={(e) => setInvoice({ ...invoice, currency: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                <option value="PKR">PKR (Rs) - Pakistan Rupees</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="SAR">SAR (﷼) - Saudi Riyal</option>
                <option value="AED">AED (د.إ) - UAE Dirham</option>
              </select>
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={invoice.showLogo} onChange={(e) => setInvoice({ ...invoice, showLogo: e.target.checked })} className="w-4 h-4 text-teal-600 rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Show Logo on Invoice</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ===== EMPLOYEE ROLES TAB ===== */}
      {activeTab === 'roles' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Employee Roles</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage custom employee roles for your organization</p>
            </div>
          </div>

          {/* Add New Role */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add New Role</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newRoleName} 
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                placeholder="e.g., Warehouse Manager, Delivery Driver"
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
              <button 
                onClick={handleAddRole}
                disabled={isAddingRole || !newRoleName.trim()}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Roles List */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">System Roles (Default)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
              {['Admin', 'Manager', 'Cashier', 'Salesman'].map(role => (
                <div key={role} className="flex flex-col p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{role}</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded">System</span>
                  </div>
                  {role.toLowerCase() !== 'admin' && (
                    <button 
                      onClick={() => openRolePermissions(role.toLowerCase())}
                      className="mt-2 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium text-left"
                    >
                      Manage Permissions
                    </button>
                  )}
                </div>
              ))}
            </div>

            {roles.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6">Custom Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {roles.map(role => (
                    <div key={role.id} className="flex flex-col p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCog className="w-4 h-4 text-teal-600" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{role.name}</span>
                        </div>
                        {!role.isSystem && (
                          <button 
                            onClick={() => handleDeleteRole(role.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => openRolePermissions(role.name)}
                        className="mt-2 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium text-left"
                      >
                        Manage Permissions
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {roles.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <UserCog className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No custom roles added yet. Add your first custom role above.</p>
              </div>
            )}
          </div>

          {/* Permissions Modal/Slide-over */}
          {selectedRoleForPerms && (
            <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white capitalize">Permissions for: {selectedRoleForPerms}</h3>
                  <button onClick={() => setSelectedRoleForPerms(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                  <p className="text-sm text-slate-500 mb-4">Select which modules this role is allowed to access.</p>
                  {MODULES.map(module => (
                    <label key={module.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <input 
                        type="checkbox" 
                        checked={selectedRoleModules.includes(module.id)} 
                        onChange={() => toggleRoleModule(module.id)}
                        className="w-4 h-4 text-teal-600 rounded" 
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{module.label}</span>
                    </label>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                  <button onClick={() => setSelectedRoleForPerms(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800">
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveRolePermissions}
                    disabled={isSavingPerms}
                    className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {isSavingPerms ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ALERT SETTINGS TAB ===== */}
      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Alert Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Expiry Alert Days</label>
              <input type="number" value={alerts.expiryDays} onChange={(e) => setAlerts({ ...alerts, expiryDays: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Low Stock Threshold</label>
              <input type="number" value={alerts.lowStockThreshold} onChange={(e) => setAlerts({ ...alerts, lowStockThreshold: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2 flex items-center">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={alerts.emailAlerts} onChange={(e) => setAlerts({ ...alerts, emailAlerts: e.target.checked })} className="w-4 h-4 text-teal-600 rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Enable Email Alerts</span>
              </label>
            </div>
            {alerts.emailAlerts && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Alert Email</label>
                <input type="email" value={alerts.alertEmail} onChange={(e) => setAlerts({ ...alerts, alertEmail: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== BACKUP SETTINGS TAB ===== */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Backup Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Backup Path</label>
              <input type="text" value={backup.path} onChange={(e) => setBackup({ ...backup, path: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Auto Backup Frequency</label>
              <select value={backup.frequency} onChange={(e) => setBackup({ ...backup, frequency: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            {backup.frequency !== 'manual' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Backup Time</label>
                <input type="time" value={backup.time} onChange={(e) => setBackup({ ...backup, time: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Backup</label>
              <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500">{backup.lastBackup}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== APPEARANCE TAB ===== */}
      {activeTab === 'appearance' && isLoaded && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-slate-700 dark:text-slate-300">Light Mode</span>
              </div>
              <button
                onClick={() => globalTheme !== 'light' && toggleTheme()}
                className={`w-5 h-5 rounded-full border-2 ${globalTheme === 'light' ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-500" />
                <span className="text-slate-700 dark:text-slate-300">Dark Mode</span>
              </div>
              <button
                onClick={() => globalTheme !== 'dark' && toggleTheme()}
                className={`w-5 h-5 rounded-full border-2 ${globalTheme === 'dark' ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}