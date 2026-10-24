import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Package,
  Users,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Eye,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Invoice } from '../../types';
import { formatSAR, formatNumber, formatDateDisplay, formatDateTimeDisplay, getTodayDateString } from '../../utils/formatters';
import { InvoiceModal } from '../common/InvoiceModal';

interface DraftReturnItem {
  tempId: string;
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export const ProductReturnView: React.FC = () => {
  const {
    salesmen,
    products,
    createProductReturnInvoice,
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
  const [unitPrice, setUnitPrice] = useState('');

  // Draft invoice items list
  const [draftItems, setDraftItems] = useState<DraftReturnItem[]>([]);

  // Feedback and modal
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const selectedSalesman = salesmen.find((s) => s.id === selectedSalesmanId);
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Salesman stock currently in hand minus already drafted return quantities
  const totalSalesmanHolding = selectedSalesmanId && selectedProductId
    ? getSalesmanRemainingStock(selectedSalesmanId, selectedProductId)
    : 0;

  const currentDraftAllocated = draftItems
    .filter((i) => i.productId === selectedProductId)
    .reduce((sum, i) => sum + i.quantity, 0);

  const availableToReturn = Math.max(0, totalSalesmanHolding - currentDraftAllocated);

  const handleSalesmanChange = (id: string) => {
    setSelectedSalesmanId(id);
    setSelectedProductId('');
    setUnitPrice('');
    setDraftItems([]);
    setStatusMessage(null);
  };

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setStatusMessage(null);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setUnitPrice(prod.salePrice.toString());
    } else {
      setUnitPrice('');
    }
  };

  const handleReturnAll = () => {
    if (availableToReturn > 0) {
      setQuantity(availableToReturn.toString());
    }
  };

  // Add line item to draft return invoice
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
      setStatusMessage({ type: 'error', text: 'Quantity returned must be at least 1.' });
      return;
    }

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      setStatusMessage({ type: 'error', text: 'Unit price must be a valid number.' });
      return;
    }

    if (qty > availableToReturn) {
      setStatusMessage({
        type: 'error',
        text: `Cannot return ${qty} units. Salesman only currently holds ${availableToReturn} ${selectedProduct.unit} available for return.`,
      });
      return;
    }

    const existingIndex = draftItems.findIndex((i) => i.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...draftItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
        unitPrice: price,
      };
      setDraftItems(updated);
    } else {
      const newItem: DraftReturnItem = {
        tempId: `draft-ret-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCode: selectedProduct.code,
        unit: selectedProduct.unit,
        quantity: qty,
        unitPrice: price,
      };
      setDraftItems([...draftItems, newItem]);
    }

    setSelectedProductId('');
    setQuantity('');
    setUnitPrice('');
  };

  const handleRemoveItem = (tempId: string) => {
    setDraftItems(draftItems.filter((i) => i.tempId !== tempId));
  };

  const handleEditRow = (item: DraftReturnItem) => {
    setSelectedProductId(item.productId);
    setQuantity(item.quantity.toString());
    setUnitPrice(item.unitPrice.toString());
    setDraftItems(draftItems.filter((i) => i.tempId !== item.tempId));
  };

  // Draft Totals
  const draftTotalQty = draftItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const draftGrandTotal = draftItems.reduce((acc, curr) => acc + curr.quantity * curr.unitPrice, 0);

  // Save Return Invoice Action
  const handleSaveInvoice = () => {
    setStatusMessage(null);

    if (!selectedSalesmanId) {
      setStatusMessage({ type: 'error', text: 'Please select a salesman.' });
      return;
    }

    if (draftItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'Cannot save empty invoice! Add at least one returned product.' });
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
        salePrice: item.unitPrice,
        unitPrice: item.unitPrice,
      };
    });

    const result = createProductReturnInvoice({
      salesmanId: selectedSalesmanId,
      date: invoiceDate || getTodayDateString(),
      items: payloadItems,
      notes: invoiceNotes.trim() || undefined,
    });

    if (result.success && result.invoice) {
      setStatusMessage({
        type: 'success',
        text: `Return Invoice #${result.invoice.invoiceNumber} saved! Restored ${result.invoice.totalQuantity} units to warehouse stock from ${selectedSalesman?.name}.`,
      });
      setDraftItems([]);
      setInvoiceNotes('');
      setViewingInvoice(result.invoice);
    } else {
      setStatusMessage({ type: 'error', text: result.message || 'Failed to save return invoice.' });
    }
  };

  // Past Return Invoices
  const returnInvoices = invoices.filter((inv) => inv.type === 'PRODUCT_RETURN');

  return (
    <div className="space-y-6">
      {/* Invoice Generator Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product Return Invoice Builder</h3>
              <p className="text-[11px] text-slate-500">
                Record unsold goods returned by a salesman and restore warehouse inventory
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-amber-100/80 text-amber-800 px-2.5 py-1 rounded font-semibold">
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
                Select Salesman Returning Stock <span className="text-red-500">*</span>
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
                Return Date <span className="text-red-500">*</span>
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
                Inspection / Return Reason (Optional)
              </label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="e.g. End of route unsold items, undamaged seals"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Line Item Builder */}
          <div className="border border-amber-200 bg-amber-50/20 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Add Returned Product To Invoice</span>
            </h4>

            <form onSubmit={handleAddLineItem} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Product */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Product Returned <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!selectedSalesmanId}
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white disabled:bg-slate-50"
                  >
                    <option value="">
                      {!selectedSalesmanId ? '-- Select a salesman first --' : '-- Choose product --'}
                    </option>
                    {products.map((p) => {
                      const holding = selectedSalesmanId ? getSalesmanRemainingStock(selectedSalesmanId, p.id) : 0;
                      return (
                        <option key={p.id} value={p.id} disabled={holding <= 0}>
                          {p.name} ({p.code}) — {holding > 0 ? `${holding} ${p.unit} in salesman hand` : 'None in hand'}
                        </option>
                      );
                    })}
                  </select>

                  {selectedSalesmanId && selectedProduct && (
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Available for Return: <strong>{availableToReturn} {selectedProduct.unit}</strong></span>
                      {availableToReturn > 0 && (
                        <button
                          type="button"
                          onClick={handleReturnAll}
                          className="text-[10px] text-amber-800 font-semibold hover:underline"
                        >
                          Return All ({availableToReturn})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Returned <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={availableToReturn || undefined}
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

                {/* Valuation Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Price (SAR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              {/* Line total & Add button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600">
                  {parseInt(quantity, 10) > 0 && parseFloat(unitPrice) >= 0 ? (
                    <span>
                      Return Line Value:{' '}
                      <strong className="text-slate-900 font-mono">
                        {formatSAR(parseInt(quantity, 10) * parseFloat(unitPrice))}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-slate-400">Fill in product and quantity returned.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selectedSalesmanId || !selectedProduct || availableToReturn <= 0}
                  className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product to Return Invoice</span>
                </button>
              </div>
            </form>
          </div>

          {/* Temporary Invoice Products Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Products in Temporary Return Invoice ({draftItems.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Warehouse inventory increases upon saving
              </span>
            </div>

            {draftItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                No returned products added to this invoice yet. Use the form above.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Name & Code</th>
                      <th className="py-2.5 px-3 text-center">Quantity Returned</th>
                      <th className="py-2.5 px-3 text-right">Unit Value (SAR)</th>
                      <th className="py-2.5 px-3 text-right">Line Total (SAR)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftItems.map((item, idx) => {
                      const lineTotal = item.quantity * item.unitPrice;
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
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 tabular-nums">
                            +{formatNumber(item.quantity)} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                            {formatSAR(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
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
                      <span className="text-slate-500">Total Quantity Restored:</span>
                      <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        +{formatNumber(draftTotalQty)} units
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Grand Total Valuation:</span>
                      <div className="font-mono font-bold text-amber-700 text-base tabular-nums">
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
                    <span>Save Return Invoice & Restore Stock</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Return Invoices History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Product Return Invoices History ({returnInvoices.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click to view & print invoice</span>
        </div>

        {returnInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No product return invoices saved yet.
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
                {returnInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 whitespace-nowrap">
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
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-700 tabular-nums">
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
