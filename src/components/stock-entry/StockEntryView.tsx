import React, { useState } from 'react';
import {
  PlusCircle,
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  FileText,
  Eye,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Invoice, InvoiceItem } from '../../types';
import { formatSAR, formatNumber, formatDateDisplay, formatDateTimeDisplay, getTodayDateString } from '../../utils/formatters';
import { InvoiceModal } from '../common/InvoiceModal';

interface DraftItem {
  tempId: string;
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export const StockEntryView: React.FC = () => {
  const { products, createStockEntryInvoice, invoices } = useStock();

  // Invoice Header Information
  const [invoiceDate, setInvoiceDate] = useState(getTodayDateString());
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Form states for adding a product line item
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');

  // Temporary Invoice Items List
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [editingTempId, setEditingTempId] = useState<string | null>(null);

  // Status feedback and modal
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // When a product is selected in line item builder, prefill purchase and sale prices
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setStatusMessage(null);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setPurchasePrice(prod.purchasePrice.toString());
      setSalePrice(prod.salePrice.toString());
    } else {
      setPurchasePrice('');
      setSalePrice('');
    }
  };

  // Add line item to draft invoice
  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedProductId || !selectedProduct) {
      setStatusMessage({ type: 'error', text: 'Please select a product.' });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setStatusMessage({ type: 'error', text: 'Quantity must be at least 1.' });
      return;
    }

    const buyPrice = parseFloat(purchasePrice);
    if (isNaN(buyPrice) || buyPrice < 0) {
      setStatusMessage({ type: 'error', text: 'Purchase price must be a positive number in SAR.' });
      return;
    }

    const sellPrice = parseFloat(salePrice);
    if (isNaN(sellPrice) || sellPrice < 0) {
      setStatusMessage({ type: 'error', text: 'Sale price must be a positive number in SAR.' });
      return;
    }

    // Check if product already exists in draft invoice
    const existingIndex = draftItems.findIndex((item) => item.productId === selectedProductId);
    if (existingIndex >= 0) {
      // Update quantity and prices of existing row
      const updated = [...draftItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
        purchasePrice: buyPrice,
        salePrice: sellPrice,
      };
      setDraftItems(updated);
    } else {
      const newItem: DraftItem = {
        tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCode: selectedProduct.code,
        unit: selectedProduct.unit,
        quantity: qty,
        purchasePrice: buyPrice,
        salePrice: sellPrice,
      };
      setDraftItems([...draftItems, newItem]);
    }

    // Reset line item form
    setSelectedProductId('');
    setQuantity('');
    setPurchasePrice('');
    setSalePrice('');
  };

  // Remove row from draft invoice
  const handleRemoveItem = (tempId: string) => {
    setDraftItems(draftItems.filter((i) => i.tempId !== tempId));
  };

  // Edit row inline
  const handleEditRow = (item: DraftItem) => {
    setEditingTempId(item.tempId);
    setSelectedProductId(item.productId);
    setQuantity(item.quantity.toString());
    setPurchasePrice(item.purchasePrice.toString());
    setSalePrice(item.salePrice.toString());
    // Remove the row from draft list so the user can re-add after editing
    setDraftItems(draftItems.filter((i) => i.tempId !== item.tempId));
  };

  // Automatic Totals calculation for draft invoice
  const draftTotalQty = draftItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const draftTotalPurchase = draftItems.reduce((acc, curr) => acc + curr.quantity * curr.purchasePrice, 0);
  const draftTotalSale = draftItems.reduce((acc, curr) => acc + curr.quantity * curr.salePrice, 0);

  // Save Invoice Action
  const handleSaveInvoice = () => {
    setStatusMessage(null);

    if (draftItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'Cannot save empty invoice! Please add at least one product.' });
      return;
    }

    const payloadItems = draftItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productCode: item.productCode,
      unit: item.unit,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      unitPrice: item.purchasePrice,
    }));

    const result = createStockEntryInvoice({
      date: invoiceDate || getTodayDateString(),
      items: payloadItems,
      notes: invoiceNotes.trim() || undefined,
    });

    if (result.success && result.invoice) {
      setStatusMessage({
        type: 'success',
        text: `Invoice #${result.invoice.invoiceNumber} saved successfully! Inventory quantities updated (+${result.invoice.totalQuantity} units).`,
      });
      // Clear draft invoice
      setDraftItems([]);
      setInvoiceNotes('');
      // Open invoice modal preview
      setViewingInvoice(result.invoice);
    } else {
      setStatusMessage({ type: 'error', text: result.message || 'Failed to save invoice.' });
    }
  };

  // Past Stock Entry Invoices
  const stockInvoices = invoices.filter((inv) => inv.type === 'STOCK_ENTRY');

  return (
    <div className="space-y-6">
      {/* Invoice Generator Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stock Entry Invoice Builder</h3>
              <p className="text-[11px] text-slate-500">
                Add products one by one to a temporary invoice list, then save to increase inventory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono bg-blue-100/80 text-blue-800 px-2.5 py-1 rounded font-semibold">
              Currency: SAR
            </span>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Status Message */}
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

          {/* Invoice Header Details (Date & Supplier Notes) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier / Invoice Reference Notes (Optional)
              </label>
              <input
                type="text"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="e.g. Al-Madinah Central Wholesale Supplier, PO #98231"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Line Item Builder Form */}
          <div className="border border-blue-200 bg-blue-50/20 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add Product To Temporary Invoice List</span>
            </h4>

            {products.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                No products found in catalog. Please add products in Inventory first.
              </div>
            ) : (
              <form onSubmit={handleAddLineItem} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Product */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedProductId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="">-- Choose product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — Current: {p.currentStock} {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="e.g. 25"
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      />
                      {selectedProduct && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          {selectedProduct.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Purchase Price (SAR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sale Price (SAR) <span className="text-red-500">*</span>
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

                {/* Line total preview and Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-600">
                    {parseInt(quantity, 10) > 0 && parseFloat(purchasePrice) >= 0 ? (
                      <span>
                        Calculated Row Total: Cost:{' '}
                        <strong className="text-slate-900 font-mono">
                          {formatSAR(parseInt(quantity, 10) * parseFloat(purchasePrice))}
                        </strong>{' '}
                        · Retail:{' '}
                        <strong className="text-blue-700 font-mono">
                          {formatSAR(parseInt(quantity, 10) * parseFloat(salePrice || '0'))}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Fill in product, quantity, and prices to calculate line total.
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200/80 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product to Invoice</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Temporary Invoice Products Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Products in Temporary Invoice ({draftItems.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Inventory will only increase after saving the invoice
              </span>
            </div>

            {draftItems.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                No products added to the invoice yet. Use the form above to add items.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Name & Code</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Purchase Price</th>
                      <th className="py-2.5 px-3 text-right">Total Purchase (Cost)</th>
                      <th className="py-2.5 px-3 text-right">Sale Price</th>
                      <th className="py-2.5 px-3 text-right">Total Sale (Retail)</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftItems.map((item, idx) => {
                      const rowCost = item.quantity * item.purchasePrice;
                      const rowSale = item.quantity * item.salePrice;

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
                            {formatSAR(item.purchasePrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {formatSAR(rowCost)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                            {formatSAR(item.salePrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-blue-700">
                            {formatSAR(rowSale)}
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
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Total Quantity:</span>
                      <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {formatNumber(draftTotalQty)} units
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Purchase Cost:</span>
                      <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {formatSAR(draftTotalPurchase)}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Retail Value:</span>
                      <div className="font-mono font-bold text-blue-700 text-sm tabular-nums">
                        {formatSAR(draftTotalSale)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveInvoice}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Stock Entry Invoice</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Entry Invoices History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Stock Entry Invoices History ({stockInvoices.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click to view & print full invoice</span>
        </div>

        {stockInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No stock entry invoices saved yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-center">Items Count</th>
                  <th className="py-3 px-4 text-center">Total Quantity</th>
                  <th className="py-3 px-4 text-right">Total Cost (SAR)</th>
                  <th className="py-3 px-4 text-right">Retail Value (SAR)</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      <div>{formatDateDisplay(inv.date)}</div>
                      <div className="text-[10px] text-slate-400">{formatDateTimeDisplay(inv.timestamp)}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                      {inv.items.length} products
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 tabular-nums">
                      +{formatNumber(inv.totalQuantity)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatSAR(inv.totalPurchaseAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-blue-700 tabular-nums">
                      {formatSAR(inv.totalSaleAmount)}
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
