import React, { useState } from 'react';
import { StockProvider } from './context/StockContext';
import { ActiveTab } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { StockEntryView } from './components/stock-entry/StockEntryView';
import { SalesmenView } from './components/salesmen/SalesmenView';
import { ProductIssueView } from './components/product-issue/ProductIssueView';
import { SalesEntryView } from './components/sales-entry/SalesEntryView';
import { ProductReturnView } from './components/product-return/ProductReturnView';
import { AchievementView } from './components/achievement/AchievementView';
import { StockHistoryView } from './components/history/StockHistoryView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'inventory':
        return <InventoryView />;
      case 'stock-entry':
        return <StockEntryView />;
      case 'salesmen':
        return <SalesmenView />;
      case 'product-issue':
        return <ProductIssueView />;
      case 'sales-entry':
        return <SalesEntryView />;
      case 'product-return':
        return <ProductReturnView />;
      case 'achievement':
        return <AchievementView />;
      case 'stock-history':
        return <StockHistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <StockProvider>
      <div className="min-h-screen flex bg-slate-100/70 text-slate-900 font-sans antialiased">
        {/* Desktop Sidebar Navigation */}
        <Sidebar currentTab={activeTab} onSelectTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <Header currentTab={activeTab} onSelectTab={setActiveTab} />

          {/* Page Body Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto">
              {renderActiveView()}
            </div>
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <BottomNav currentTab={activeTab} onSelectTab={setActiveTab} />
        </div>
      </div>
    </StockProvider>
  );
}
