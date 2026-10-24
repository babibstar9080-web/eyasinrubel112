import React from 'react';
import { ActiveTab } from '../../types';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';

interface HeaderProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickIssue?: () => void;
  onOpenQuickSale?: () => void;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of stock, issued goods, and sales' },
  inventory: { title: 'Inventory Management', subtitle: 'Product catalog, unit pricing, and stock levels' },
  'stock-entry': { title: 'Stock Entry Invoices', subtitle: 'Create and save warehouse stock intake invoices' },
  salesmen: { title: 'Salesman Management', subtitle: 'Field representatives and product holding balances' },
  'product-issue': { title: 'Salesman Issue Invoices', subtitle: 'Allocate warehouse stock to salesmen with issue invoices' },
  'sales-entry': { title: 'Sales Invoices', subtitle: 'Record customer sales invoices and calculate line totals' },
  'product-return': { title: 'Product Return Invoices', subtitle: 'Receive unsold goods back with return invoices' },
  achievement: { title: 'Salesman Achievement', subtitle: 'Performance metrics and sales breakdown' },
  'stock-history': { title: 'Stock History & Invoices', subtitle: 'Audit trail and invoice voucher archive' },
  settings: { title: 'Settings & Data Backup', subtitle: 'Persistent storage, backup, and restore' },
};

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const meta = tabTitles[currentTab] || { title: 'Stock Manager', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
      {/* Title & Context */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
          {meta.title}
        </h2>
        <p className="text-xs text-slate-500 hidden sm:block">{meta.subtitle}</p>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onSelectTab('product-issue')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>New Issue Invoice</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('sales-entry')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>New Sales Invoice</span>
        </button>
      </div>
    </header>
  );
};
