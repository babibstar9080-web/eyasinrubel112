import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowUpRight,
  ShoppingCart,
  Menu,
  X,
  PlusCircle,
  Users,
  RotateCcw,
  Award,
  History,
  Settings,
  Building2,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useStock } from '../../context/StockContext';

interface BottomNavProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { lowStockProducts } = useStock();

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    setDrawerOpen(false);
  };

  const isMainTab = ['dashboard', 'inventory', 'product-issue', 'sales-entry'].includes(currentTab);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-72 bg-white shadow-2xl flex flex-col p-4 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Company Stock Manager</h2>
                  <p className="text-[10px] text-slate-500">All Modules & Invoices</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-3 overflow-y-auto space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 tracking-wider">
                Invoice Operations
              </p>
              <button
                onClick={() => handleSelect('stock-entry')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'stock-entry' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Stock Entry Invoice</span>
              </button>
              <button
                onClick={() => handleSelect('product-issue')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'product-issue' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Stock Issue Invoice</span>
              </button>
              <button
                onClick={() => handleSelect('sales-entry')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'sales-entry' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Sales Invoice</span>
              </button>
              <button
                onClick={() => handleSelect('product-return')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'product-return' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Product Return Invoice</span>
              </button>

              <div className="my-2 border-t border-slate-100" />
              <p className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1 tracking-wider">
                Management & Reports
              </p>
              <button
                onClick={() => handleSelect('salesmen')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'salesmen' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Salesman Management</span>
              </button>
              <button
                onClick={() => handleSelect('achievement')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'achievement' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Salesman Achievement</span>
              </button>
              <button
                onClick={() => handleSelect('stock-history')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'stock-history' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History & Invoices Ledger</span>
              </button>
              <button
                onClick={() => handleSelect('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                  currentTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Data Backup & Settings</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              SAR Currency · Version 1.1
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar on Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 px-2 py-1 flex items-center justify-around shadow-lg">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px] ${
            currentTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => onSelectTab('inventory')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px] ${
            currentTab === 'inventory' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Inventory</span>
          {lowStockProducts.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        <button
          onClick={() => onSelectTab('product-issue')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px] ${
            currentTab === 'product-issue' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-5 h-5 mb-0.5" />
          <span>Issue Inv</span>
        </button>

        <button
          onClick={() => onSelectTab('sales-entry')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px] ${
            currentTab === 'sales-entry' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span>Sales Inv</span>
        </button>

        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-semibold transition-colors min-w-[56px] ${
            !isMainTab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
