import React from 'react';
import {
  Package,
  Layers,
  ArrowUpRight,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  Users,
  Award,
  ChevronRight,
  ArrowRight,
  PackageX,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatSAR, formatNumber, formatPercentage } from '../../utils/formatters';
import { ActiveTab } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    totalProductsCount,
    totalAvailableStock,
    totalProductsIssuedToSalesmen,
    totalProductsSold,
    totalSalesAmount,
    lowStockProducts,
    salesmenPerformances,
    products,
    loadStarterSampleData,
  } = useStock();

  return (
    <div className="space-y-6">
      {/* Zero Products Banner with clean Quick Start helper */}
      {products.length === 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-blue-950">Welcome to Company Stock Manager</h3>
            <p className="text-xs text-blue-700 leading-relaxed max-w-xl">
              Start by creating your company's product catalog and adding salesmen. You can also load realistic sample data to explore how tracking works.
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('inventory')}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Add First Product
            </button>
            <button
              onClick={loadStarterSampleData}
              className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-blue-700 bg-white hover:bg-blue-100/50 border border-blue-300 rounded-lg transition-colors whitespace-nowrap"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Products</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatNumber(totalProductsCount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Catalog items</p>
          </div>
        </div>

        {/* Total Available Warehouse Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Available Stock</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
              {formatNumber(totalAvailableStock)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Warehouse balance</p>
          </div>
        </div>

        {/* Products Issued to Salesmen */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Issued in Field</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-indigo-600 tabular-nums">
              {formatNumber(totalProductsIssuedToSalesmen)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">With active salesmen</p>
          </div>
        </div>

        {/* Total Products Sold */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Products Sold</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              {formatNumber(totalProductsSold)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Units delivered</p>
          </div>
        </div>

        {/* Total Sales Amount in SAR */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Sales</span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums truncate">
              {formatSAR(totalSalesAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Revenue collected</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Manager Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigate('stock-entry')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Stock Entry Invoice</div>
              <div className="text-[11px] text-slate-500 truncate">Create intake invoice</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('product-issue')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Stock Issue Invoice</div>
              <div className="text-[11px] text-slate-500 truncate">Allocate to salesman</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('sales-entry')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Sales Invoice</div>
              <div className="text-[11px] text-slate-500 truncate">Record customer sale</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">Add Product</div>
              <div className="text-[11px] text-slate-500 truncate">Create catalog item</div>
            </div>
          </button>
        </div>
      </div>

      {/* Two Columns: Low Stock Alerts & Salesman Achievement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Low Stock Products</h3>
                <p className="text-[11px] text-slate-500">Warehouse inventory at or below threshold</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Inventory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs font-medium text-slate-600">All warehouse stock levels are healthy</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No products currently below minimum threshold</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Code: {p.code} · Threshold: {p.minStockThreshold} {p.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-amber-700 tabular-nums">
                        {p.currentStock} {p.unit}
                      </div>
                      <span className="text-[10px] text-amber-600 font-medium">Reorder required</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Salesman Achievement Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Salesman Achievement</h3>
                <p className="text-[11px] text-slate-500">Representative delivery performance</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('achievement')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {salesmenPerformances.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs font-medium text-slate-600">No salesmen registered yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add salesmen to track issue and sales achievements</p>
                <button
                  onClick={() => onNavigate('salesmen')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Register Salesman
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                {salesmenPerformances.map((perf) => (
                  <div key={perf.salesman.id} className="p-3 hover:bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{perf.salesman.name}</span>
                        <span className="text-[11px] text-slate-400">·</span>
                        <span className="text-[11px] text-slate-500">{perf.salesman.area}</span>
                      </div>
                      <div className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                        {formatSAR(perf.totalSalesAmount)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-mono">
                      <span>Issued: {perf.totalProductsIssued}</span>
                      <span>Sold: {perf.totalProductsSold}</span>
                      <span>Holding: {perf.remainingStock}</span>
                      <span className="font-bold text-blue-700">
                        {formatPercentage(perf.achievementRate)} Achieved
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, perf.achievementRate))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
