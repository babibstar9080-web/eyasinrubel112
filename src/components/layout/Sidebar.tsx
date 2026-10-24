import React from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Users,
  ArrowUpRight,
  ShoppingCart,
  RotateCcw,
  Award,
  History,
  Settings,
  Building2,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useStock } from '../../context/StockContext';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { lowStockProducts } = useStock();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package, badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined },
    { id: 'stock-entry', label: 'Stock Entry Invoice', icon: PlusCircle },
    { id: 'salesmen', label: 'Salesman Management', icon: Users },
    { id: 'product-issue', label: 'Stock Issue Invoice', icon: ArrowUpRight },
    { id: 'sales-entry', label: 'Sales Invoice', icon: ShoppingCart },
    { id: 'product-return', label: 'Product Return Invoice', icon: RotateCcw },
    { id: 'achievement', label: 'Salesman Achievement', icon: Award },
    { id: 'stock-history', label: 'History & Invoices', icon: History },
    { id: 'settings', label: 'Settings & Backup', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 bg-white">
        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
            Company Stock Manager
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Operations & Inventory</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                  title={`${item.badge} low stock items`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Manager Role & Currency Indicator */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="font-medium text-slate-600">Company Portal</span>
          <span className="font-mono text-[10px] bg-blue-100/80 text-blue-800 px-1.5 py-0.5 rounded font-bold">
            SAR Currency
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Manager access only. Direct control of stock allocations and invoices.
        </p>
      </div>
    </aside>
  );
};
