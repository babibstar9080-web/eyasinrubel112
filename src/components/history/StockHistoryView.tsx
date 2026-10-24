import React, { useState, useMemo } from 'react';
import {
  History,
  Download,
  Filter,
  Search,
  ArrowDownToLine,
  ArrowUpRight,
  ShoppingCart,
  RotateCcw,
  Printer,
  FileText,
  Eye,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { TransactionType, Invoice, InvoiceType, StockTransaction } from '../../types';
import { formatSAR, formatNumber, formatDateDisplay, formatDateTimeDisplay } from '../../utils/formatters';
import { InvoiceModal } from '../common/InvoiceModal';

export const StockHistoryView: React.FC = () => {
  const { stockHistory, products, salesmen, invoices } = useStock();

  const [activeView, setActiveView] = useState<'transactions' | 'invoices'>('transactions');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [salesmanFilter, setSalesmanFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const transactionTypeMeta: Record<
    TransactionType,
    { label: string; icon: React.FC<{ className?: string }>; color: string }
  > = {
    STOCK_IN: {
      label: 'Stock In (Warehouse Entry)',
      icon: ArrowDownToLine,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    ISSUE_TO_SALESMAN: {
      label: 'Issue to Salesman',
      icon: ArrowUpRight,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    SALE_RECORDED: {
      label: 'Sale Recorded',
      icon: ShoppingCart,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    RETURN_FROM_SALESMAN: {
      label: 'Return from Salesman',
      icon: RotateCcw,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
  };

  const invoiceTypeMeta: Record<InvoiceType, { label: string; color: string }> = {
    STOCK_ENTRY: { label: 'Stock Entry', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    PRODUCT_ISSUE: { label: 'Stock Issue', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    SALES: { label: 'Sales Invoice', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    PRODUCT_RETURN: { label: 'Product Return', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  };

  const filteredHistory = useMemo(() => {
    return stockHistory.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (productFilter !== 'all' && tx.productId !== productFilter) return false;
      if (salesmanFilter !== 'all' && tx.salesmanId !== salesmanFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesProduct =
          tx.productName.toLowerCase().includes(query) ||
          tx.productCode.toLowerCase().includes(query);
        const matchesSalesman = tx.salesmanName && tx.salesmanName.toLowerCase().includes(query);
        const matchesNotes = tx.notes && tx.notes.toLowerCase().includes(query);
        const matchesInvoice = tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(query);
        if (!matchesProduct && !matchesSalesman && !matchesNotes && !matchesInvoice) return false;
      }

      return true;
    });
  }, [stockHistory, typeFilter, productFilter, salesmanFilter, searchQuery]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (typeFilter !== 'all' && inv.type !== typeFilter) return false;
      if (salesmanFilter !== 'all' && inv.salesmanId !== salesmanFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesInvNo = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesSalesman = inv.salesmanName && inv.salesmanName.toLowerCase().includes(query);
        const matchesNotes = inv.notes && inv.notes.toLowerCase().includes(query);
        const matchesProduct = inv.items.some(
          (i) => i.productName.toLowerCase().includes(query) || i.productCode.toLowerCase().includes(query)
        );
        if (!matchesInvNo && !matchesSalesman && !matchesNotes && !matchesProduct) return false;
      }

      return true;
    });
  }, [invoices, typeFilter, salesmanFilter, searchQuery]);

  const handleExportCSV = () => {
    if (activeView === 'transactions') {
      if (filteredHistory.length === 0) return;

      const headers = [
        'Transaction ID',
        'Invoice #',
        'Date',
        'Timestamp',
        'Transaction Type',
        'Product Name',
        'Product Code',
        'Quantity',
        'Warehouse Balance After',
        'Salesman',
        'Unit Price (SAR)',
        'Total Amount (SAR)',
        'Notes',
      ];

      const rows = filteredHistory.map((tx) => [
        `"${tx.id}"`,
        `"${tx.invoiceNumber || ''}"`,
        `"${tx.date}"`,
        `"${tx.timestamp}"`,
        `"${tx.type}"`,
        `"${tx.productName.replace(/"/g, '""')}"`,
        `"${tx.productCode}"`,
        tx.quantity,
        tx.warehouseStockAfter,
        `"${(tx.salesmanName || '').replace(/"/g, '""')}"`,
        tx.unitPrice || 0,
        tx.totalAmount || 0,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `company_stock_history_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      if (filteredInvoices.length === 0) return;

      const headers = [
        'Invoice Number',
        'Invoice Type',
        'Date',
        'Timestamp',
        'Salesman',
        'Items Count',
        'Total Quantity',
        'Grand Total (SAR)',
        'Notes',
      ];

      const rows = filteredInvoices.map((inv) => [
        `"${inv.invoiceNumber}"`,
        `"${inv.type}"`,
        `"${inv.date}"`,
        `"${inv.timestamp}"`,
        `"${(inv.salesmanName || '').replace(/"/g, '""')}"`,
        inv.items.length,
        inv.totalQuantity,
        inv.totalAmount,
        `"${(inv.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `company_invoices_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const handleOpenInvoiceByNumber = (invNum: string) => {
    const inv = invoices.find((i) => i.invoiceNumber === invNum);
    if (inv) {
      setViewingInvoice(inv);
    }
  };

  return (
    <div className="space-y-4">
      {/* Switcher & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('transactions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeView === 'transactions'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transactions Stream ({stockHistory.length})
            </button>
            <button
              onClick={() => setActiveView('invoices')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeView === 'invoices'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoices Master Ledger ({invoices.length})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, product, salesman, or notes..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">All Types</option>
              {activeView === 'transactions' ? (
                <>
                  <option value="STOCK_IN">Stock In (Warehouse Entry)</option>
                  <option value="ISSUE_TO_SALESMAN">Issue to Salesman</option>
                  <option value="SALE_RECORDED">Sale Recorded</option>
                  <option value="RETURN_FROM_SALESMAN">Return from Salesman</option>
                </>
              ) : (
                <>
                  <option value="STOCK_ENTRY">Stock Entry Invoices</option>
                  <option value="PRODUCT_ISSUE">Stock Issue Invoices</option>
                  <option value="SALES">Sales Invoices</option>
                  <option value="PRODUCT_RETURN">Return Invoices</option>
                </>
              )}
            </select>
          </div>

          <div>
            <select
              value={salesmanFilter}
              onChange={(e) => setSalesmanFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">All Salesmen</option>
              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      {activeView === 'transactions' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Transaction Audit Trail ({filteredHistory.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Linked to generated invoices</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No transactions match your search filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Product Name & Code</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-center">Warehouse Balance After</th>
                    <th className="py-3 px-4">Salesman</th>
                    <th className="py-3 px-4 text-right">Amount (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((tx) => {
                    const meta = transactionTypeMeta[tx.type] || {
                      label: tx.type,
                      icon: History,
                      color: 'text-slate-700 bg-slate-50',
                    };
                    const Icon = meta.icon;

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          <div>{formatDateDisplay(tx.date)}</div>
                          <div className="text-[10px] text-slate-400">{formatDateTimeDisplay(tx.timestamp)}</div>
                        </td>

                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          {tx.invoiceNumber ? (
                            <button
                              onClick={() => handleOpenInvoiceByNumber(tx.invoiceNumber!)}
                              className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              title="Click to view full invoice document"
                            >
                              <span>{tx.invoiceNumber}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-800">{meta.label}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{tx.productName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{tx.productCode}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                          <span
                            className={
                              tx.type === 'STOCK_IN' || tx.type === 'RETURN_FROM_SALESMAN'
                                ? 'text-emerald-700'
                                : 'text-blue-700'
                            }
                          >
                            {tx.type === 'STOCK_IN' || tx.type === 'RETURN_FROM_SALESMAN' ? '+' : '-'}
                            {formatNumber(tx.quantity)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                          {formatNumber(tx.warehouseStockAfter)}
                        </td>

                        <td className="py-3 px-4 text-slate-700">
                          {tx.salesmanName || '-'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {tx.totalAmount !== undefined ? formatSAR(tx.totalAmount) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Invoices Master Ledger ({filteredInvoices.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Formal invoice vouchers</span>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No invoices match your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Salesman</th>
                    <th className="py-3 px-4 text-center">Items Count</th>
                    <th className="py-3 px-4 text-center">Total Quantity</th>
                    <th className="py-3 px-4 text-right">Grand Total (SAR)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const meta = invoiceTypeMeta[inv.type] || {
                      label: inv.type,
                      color: 'text-slate-700 bg-slate-100 border-slate-200',
                    };

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                          <div>{formatDateDisplay(inv.date)}</div>
                          <div className="text-[10px] text-slate-400">{formatDateTimeDisplay(inv.timestamp)}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-800 font-medium">
                          {inv.salesmanName || 'Company Warehouse'}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-700 tabular-nums">
                          {inv.items.length} items
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 tabular-nums">
                          {formatNumber(inv.totalQuantity)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatSAR(inv.totalAmount)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View / Print</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Printable Invoice Modal */}
      <InvoiceModal
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />
    </div>
  );
};
