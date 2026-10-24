import React, { useState } from 'react';
import {
  ShoppingCart,
  DollarSign,
  User,
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Eye,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Invoice, InvoiceItem } from '../../types';
import { formatSAR, formatNumber, formatDateDisplay, formatDateTimeDisplay, getTodayDateString } from '../../utils/formatters';
import { InvoiceModal } from '../common/InvoiceModal';

interface DraftSaleItem {
  tempId: string;
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  quantity: number;
  salePrice: number;
}

export const SalesEntryView: React.FC = () => {
  const {
    salesmen,
    products,
    createSalesInvoice,
    invoices,
    getSalesmanRemainingStock,
  } = useStock();

  // Invoice header
  const [selectedSalesmanId, setSelectedSalesmanId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(getTodayDateString());
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Line item builder form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');

  // Temporary Draft Invoice Items List
  const [draftItems, setDraftItems] = useState<DraftSaleItem[]>([]);

  // Feedback and Modal
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const selectedSalesman = salesmen.find((s) => s.id === selectedSalesmanId);
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Remaining salesman stock for selected product minus already drafted quantity
  const totalSalesmanHolding = selectedSalesmanId && selectedProductId
    ? getSalesmanRemainingStock(selectedSalesmanId, selectedProductId)
    : 0;

  const currentDraftAllocated = draftItems
    .filter((i) => i.productId === selectedProductId)
    .reduce((sum, i) => sum + i.quantity, 0);

  const availableToSell = Math.max(0, totalSalesmanHolding - currentDraftAllocated);

  const handleSalesmanChange = (id: string) => {
    setSelectedSalesmanId(id);
    setSelectedProductId('');
    setSalePrice('');
    setDraftItems([]); // Clean draft when changing salesman
    setStatusMessage(null);
  };

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setStatusMessage(null);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSalePrice(prod.salePrice.toString());
    } else {
      setSalePrice('');
    }
  };

  const handleMaxQuantity = () => {
    if (availableToSell > 0) {
      setQuantity(availableToSell.toString());
    }
  };

  // Add line item to draft sales invoice
  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedSalesmanId) {
      setStatusMessage({ type: 'error', text: 'Please select a salesman.' });
      return;
    }
    if (!selectedProductId || !selectedProduct) {
      setStatusMessage({ type: 'error', text: 'Please select a product.' });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setStatusMessage({ type: 'error', text: 'Quantity sold must be at least 1.' });
      return;
    }

    const price = parseFloat(salePrice);
    if (isNaN(price) || price < 0) {
      setStatusMessage({ type: 'error', text: 'Sale price must be a valid positive amount in SAR.' });
      return;
    }

    // Validation: prevent selling more than salesman holds
    if (qty > availableToSell) {
      setStatusMessage({
        type: 'error',
        text: `Cannot sell ${qty} units! Salesman only has ${availableToSell} ${selectedProduct.unit} remaining in hand.`,
      });
      return;
    }

    const existingIndex = draftItems.findIndex((i) => i.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...draftItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
        salePrice: price,
      };
      setDraftItems(updated);
    } else {
      const newItem: DraftSaleItem = {
        tempId: `draft-sls-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCode: selectedProduct.code,
        unit: selectedProduct.unit,
        quantity: qty,
        salePrice: price,
      };
      setDraftItems([...draftItems, newItem]);
    }

    setSelectedProductId('');
    setQuantity('');
    setSalePrice('');
  };

  const handleRemoveItem = (tempId: string) => {
    setDraftItems(draftItems.filter((i) => i.tempId !== tempId));
  };

  const handleEditRow = (item: DraftSaleItem) => {
    setSelectedProductId(item.productId);
    setQuantity(item.quantity.toString());
    setSalePrice(item.salePrice.toString());
    setDraftItems(draftItems.filter((i) => i.tempId !== item.tempId));
  };

  // Draft Totals
  const draftTotalQty = draftItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const draftGrandTotal = draftItems.reduce((acc, curr) => acc + curr.quantity * curr.salePrice, 0);

  // Save Sales Invoice Action
  const handleSaveInvoice = () => {
    setStatusMessage(null);

    if (!selectedSalesmanId) {
      setStatusMessage({ type: 'error', text: 'Please select a salesman.' });
      return;
    }

    if (draftItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'Cannot save empty invoice! Add at least one sold product.' });
      return;
    }

    const payloadItems = draftItems.map((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return {
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        unit: item.unit,
        quantity: item.quantity,
        purchasePrice: p ? p.purchasePrice : 0,
        salePrice: item.salePrice,
        unitPrice: item.salePrice,
      };
    });

    const result = createSalesInvoice({
      salesmanId: selectedSalesmanId,
      date: invoiceDate || getTodayDateString(),
      items: payloadItems,
      notes: invoiceNotes.trim() || undefined,
    });

    if (result.success && result.invoice) {
      setStatusMessage({
        type: 'success',
        text: `Sales Invoice #${result.invoice.invoiceNumber} saved! Total ${formatSAR(
          result.invoice.totalAmount
        )} recorded for ${selectedSalesman?.name}. Salesman stock deducted.`,
      });
      setDraftItems([]);
      setInvoiceNotes('');
      setViewingInvoice(result.invoice);
    } else {
      setStatusMessage({ type: 'error', text: result.message || 'Failed to save sales invoice.' });
    }
  };

  // Past Sales Invoices
  const salesInvoices = invoices.filter((inv) => inv.type === 'SALES');

  return (
    <div className="space-y-6">
      {/* Invoice Generator Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales Invoice Builder</h3>
              <p className="text-[11px] text-slate-500">
                Select a salesman and add sold products one by one, then save to record sales revenue
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-emerald-100/80 text-emerald-800 px-2.5 py-1 rounded font-semibold">
            Currency: SAR
          </span>
        </div>

        <div className="p-5 space-y-6">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Invoice Header Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Salesman <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedSalesmanId}
                onChange={(e) => handleSalesmanChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Choose salesman --</option>
                {salesmen.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.area})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sale Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer / Store Notes (Optional)
              </label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="e.g. Hyper Panda Branch 4, Cash Invoice"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Line Item Builder */}
          <div className="border border-emerald-200 bg-emerald-50/20 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add Sold Product To Invoice</span>
            </h4>

            <form onSubmit={handleAddLineItem} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Product */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!selectedSalesmanId}
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white disabled:bg-slate-50"
                  >
                    <option value="">
                      {!selectedSalesmanId ? '-- Select a salesman first --' : '-- Choose product sold --'}
                    </option>
                    {products.map((p) => {
                      const holding = selectedSalesmanId ? getSalesmanRemainingStock(selectedSalesmanId, p.id) : 0;
                      return (
                        <option key={p.id} value={p.id} disabled={holding <= 0}>
                          {p.name} ({p.code}) — {holding > 0 ? `${holding} ${p.unit} in salesman hand` : '0 in hand'}
                        </option>
                      );
                    })}
                  </select>

                  {selectedSalesmanId && selectedProduct && (
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>In Hand: <strong>{availableToSell} {selectedProduct.unit}</strong></span>
                      {availableToSell > 0 && (
                        <button
                          type="button"
                          onClick={handleMaxQuantity}
                          className="text-[10px] text-blue-700 font-semibold hover:underline"
                        >
                          Sell All ({availableToSell})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Sold <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={availableToSell || undefined}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                    {selectedProduct && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {selectedProduct.unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sale Price per Unit (SAR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              {/* Line total & Add button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600">
                  {parseInt(quantity, 10) > 0 && parseFloat(salePrice) >= 0 ? (
                    <span>
                      Line Total:{' '}
                      <strong className="text-emerald-700 font-mono font-bold">
                        {formatSAR(parseInt(quantity, 10) * parseFloat(salePrice))}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-slate-400">Fill in product and quantity sold to calculate line total.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedSalesmanId || !selectedProduct || availableToSell <= 0}
                  className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product to Sales Invoice</span>
                </button>
              </div>
            </form>
          </div>

          {/* Temporary Invoice Products Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Products in Temporary Sales Invoice ({draftItems.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Salesman remaining stock updates automatically when saved
              </span>
            </div>

            {draftItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                No sold products added to this invoice yet. Use the form above.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Name & Code</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Sale Price (SAR)</th>
                      <th className="py-2.5 px-3 text-right">Line Total (SAR)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftItems.map((item, idx) => {
                      const lineTotal = item.quantity * item.salePrice;
                      return (
                        <tr key={item.tempId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {item.productCode} · {item.unit}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                            {formatNumber(item.quantity)} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {formatSAR(item.salePrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                            {formatSAR(lineTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditRow(item)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit row"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.tempId)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Automatic Invoice Totals Banner */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-slate-500">Total Quantity Sold:</span>
                      <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {formatNumber(draftTotalQty)} units
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Grand Total Amount:</span>
                      <div className="font-mono font-bold text-emerald-700 text-base tabular-nums">
                        {formatSAR(draftGrandTotal)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveInvoice}
                    disabled={!selectedSalesmanId || draftItems.length === 0}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Sales Invoice & Update Achievement</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Invoices History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sales Invoices History ({salesInvoices.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click to view & print invoice</span>
        </div>

        {salesInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No sales invoices saved yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Salesman</th>
                  <th className="py-3 px-4 text-center">Items Count</th>
                  <th className="py-3 px-4 text-center">Total Quantity</th>
                  <th className="py-3 px-4 text-right">Grand Total (SAR)</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      <div>{formatDateDisplay(inv.date)}</div>
                      <div className="text-[10px] text-slate-400">{formatDateTimeDisplay(inv.timestamp)}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.salesmanName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                      {inv.items.length} products
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 tabular-nums">
                      {formatNumber(inv.totalQuantity)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatSAR(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {inv.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setViewingInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      <InvoiceModal
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />
    </div>
  );
};
