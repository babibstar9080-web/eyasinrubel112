import React, { useState, useMemo } from 'react';
import {
  Award,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  Printer,
  ChevronDown,
  User,
  Clock,
  Layers,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { formatSAR, formatNumber, formatPercentage, formatDateDisplay, getTodayDateString } from '../../utils/formatters';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export const AchievementView: React.FC = () => {
  const { salesmenPerformances, salesRecords, issueRecords, returnRecords, salesmen, products } = useStock();

  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('all');

  // Calculate cutoff date string for filters
  const today = getTodayDateString();

  const filteredSales = useMemo(() => {
    const now = new Date();
    return salesRecords.filter((s) => {
      // Salesman filter
      if (selectedSalesmanId !== 'all' && s.salesmanId !== selectedSalesmanId) {
        return false;
      }

      // Time range filter
      if (timeRange === 'today') {
        return s.date === today;
      }
      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return new Date(s.date) >= weekAgo;
      }
      if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        return new Date(s.date) >= monthAgo;
      }
      return true;
    });
  }, [salesRecords, timeRange, selectedSalesmanId, today]);

  // Aggregate metrics for selected period
  const periodTotalRevenue = filteredSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const periodTotalQtySold = filteredSales.reduce((acc, curr) => acc + curr.quantity, 0);
  const periodTransactionsCount = filteredSales.length;
  const periodAvgOrderValue = periodTransactionsCount > 0 ? periodTotalRevenue / periodTransactionsCount : 0;

  // Breakdown by product in the selected period
  const productPeriodBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; code: string; unit: string; qty: number; amount: number }>();
    filteredSales.forEach((s) => {
      const existing = map.get(s.productId);
      if (existing) {
        existing.qty += s.quantity;
        existing.amount += s.totalAmount;
      } else {
        map.set(s.productId, {
          name: s.productName,
          code: s.productCode,
          unit: s.unit,
          qty: s.quantity,
          amount: s.totalAmount,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredSales]);

  // Breakdown by salesman in the selected period
  const salesmanPeriodBreakdown = useMemo(() => {
    const map = new Map<string, { id: string; name: string; area: string; qty: number; amount: number }>();
    filteredSales.forEach((s) => {
      const existing = map.get(s.salesmanId);
      if (existing) {
        existing.qty += s.quantity;
        existing.amount += s.totalAmount;
      } else {
        map.set(s.salesmanId, {
          id: s.salesmanId,
          name: s.salesmanName,
          area: salesmen.find((sm) => sm.id === s.salesmanId)?.area || '-',
          qty: s.quantity,
          amount: s.totalAmount,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredSales, salesmen]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Time Range Filter Bar & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
        {/* Time Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              timeRange === 'today' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily (Today)
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              timeRange === 'week' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly (7 Days)
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              timeRange === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly (30 Days)
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              timeRange === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All-Time
          </button>
        </div>

        {/* Salesman filter dropdown & Print */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSalesmanId}
            onChange={(e) => setSelectedSalesmanId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="all">All Salesmen</option>
            {salesmen.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            title="Print or Save PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* Period Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Period Sales Revenue</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 tabular-nums mt-1">
            {formatSAR(periodTotalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {timeRange === 'today'
              ? 'Today only'
              : timeRange === 'week'
              ? 'Last 7 days'
              : timeRange === 'month'
              ? 'Last 30 days'
              : 'Cumulative total'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Units Sold</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-700 tabular-nums mt-1">
            {formatNumber(periodTotalQtySold)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Delivered to customers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Sales Orders</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums mt-1">
            {formatNumber(periodTransactionsCount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Invoices logged</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium">Average Sale Value</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-700 tabular-nums mt-1">
            {formatSAR(periodAvgOrderValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Per order transaction</p>
        </div>
      </div>

      {/* Main Section: Complete Salesman Achievement Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Salesman Achievement & Holding Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Comprehensive balance of goods issued, sold, returned, and held in hand
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {salesmenPerformances.length} Active Representatives
          </div>
        </div>

        {salesmenPerformances.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No salesmen data available. Register salesmen and issue products to generate achievement stats.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Salesman Name</th>
                  <th className="py-3 px-4">Territory Area</th>
                  <th className="py-3 px-4 text-center">Products Issued</th>
                  <th className="py-3 px-4 text-center">Products Sold</th>
                  <th className="py-3 px-4 text-center">Returned</th>
                  <th className="py-3 px-4 text-center bg-blue-50/40 text-blue-900">Remaining Stock</th>
                  <th className="py-3 px-4 text-right">Total Sales (SAR)</th>
                  <th className="py-3 px-4 text-center">Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesmenPerformances.map((perf) => (
                  <tr key={perf.salesman.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{perf.salesman.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{perf.salesman.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {perf.salesman.area}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700 font-medium">
                      {formatNumber(perf.totalProductsIssued)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-emerald-700 font-bold">
                      {formatNumber(perf.totalProductsSold)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-amber-700">
                      {formatNumber(perf.totalProductsReturned)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-indigo-700 bg-blue-50/30">
                      {formatNumber(perf.remainingStock)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatSAR(perf.totalSalesAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-blue-700">
                          {formatPercentage(perf.achievementRate)}
                        </span>
                        <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, perf.achievementRate))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two columns: Period Product Ranking & Salesman Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products in Selected Period */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Product Sales Performance ({timeRange.toUpperCase()})
          </h4>
          <p className="text-[11px] text-slate-500 mb-4">Volume and revenue by catalog item</p>

          {productPeriodBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No sales recorded in this time period.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {productPeriodBreakdown.map((item, idx) => (
                <div key={item.code} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {item.qty} {item.unit} sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-emerald-700 tabular-nums">
                      {formatSAR(item.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Salesman Ranking in Selected Period */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 mb-1">
            Salesman Leaderboard ({timeRange.toUpperCase()})
          </h4>
          <p className="text-[11px] text-slate-500 mb-4">Revenue generation ranking</p>

          {salesmanPeriodBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No sales recorded for this period.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {salesmanPeriodBreakdown.map((sm, idx) => (
                <div key={sm.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 w-5">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{sm.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {sm.area} · {sm.qty} units sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                      {formatSAR(sm.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
