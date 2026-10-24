import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  Package,
  ShoppingCart,
  RotateCcw,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Salesman, SalesmanStockItem, Invoice } from '../../types';
import { formatSAR, formatNumber, formatDateDisplay, formatPercentage, getTodayDateString } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { InvoiceModal } from '../common/InvoiceModal';

export const SalesmenView: React.FC = () => {
  const { salesmen, addSalesman, updateSalesman, deleteSalesman, getSalesmanStockItems, invoices } = useStock();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Salesman | null>(null);
  const [viewingSalesman, setViewingSalesman] = useState<Salesman | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [deletingSalesman, setDeletingSalesman] = useState<Salesman | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    area: string;
    dateJoined: string;
    notes: string;
  }>({
    name: '',
    phone: '',
    email: '',
    area: '',
    dateJoined: getTodayDateString(),
    notes: '',
  });

  const openAddModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      area: '',
      dateJoined: getTodayDateString(),
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (salesman: Salesman) => {
    setFormError(null);
    setEditingSalesman(salesman);
    setFormData({
      name: salesman.name,
      phone: salesman.phone,
      email: salesman.email || '',
      area: salesman.area,
      dateJoined: salesman.dateJoined,
      notes: salesman.notes || '',
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const res = addSalesman({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      area: formData.area.trim(),
      dateJoined: formData.dateJoined || getTodayDateString(),
      notes: formData.notes.trim() || undefined,
    });

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(res.message || 'Failed to add salesman.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalesman) return;
    setFormError(null);

    const res = updateSalesman(editingSalesman.id, {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      area: formData.area.trim(),
      dateJoined: formData.dateJoined,
      notes: formData.notes.trim() || undefined,
    });

    if (res.success) {
      setEditingSalesman(null);
    } else {
      setFormError(res.message || 'Failed to update salesman.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingSalesman) return;
    const res = deleteSalesman(deletingSalesman.id);
    if (!res.success) {
      alert(res.message);
    }
    setDeletingSalesman(null);
  };

  // Detailed items for currently viewed salesman
  const viewedItems: SalesmanStockItem[] = viewingSalesman ? getSalesmanStockItems(viewingSalesman.id) : [];

  const totalIssued = viewedItems.reduce((acc, curr) => acc + curr.totalIssued, 0);
  const totalSold = viewedItems.reduce((acc, curr) => acc + curr.totalSold, 0);
  const totalReturned = viewedItems.reduce((acc, curr) => acc + curr.totalReturned, 0);
  const totalRemaining = viewedItems.reduce((acc, curr) => acc + curr.remainingStock, 0);
  const totalRevenue = viewedItems.reduce((acc, curr) => acc + curr.totalSalesAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Salesmen Team ({salesmen.length})</h3>
          <p className="text-xs text-slate-500">
            Field representatives authorized to receive stock and execute sales
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Salesman</span>
        </button>
      </div>

      {/* Salesmen Grid */}
      {salesmen.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">No salesmen registered</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add salesmen who will receive products from the company warehouse and deliver to customers.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Salesman Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {salesmen.map((salesman) => {
            const items = getSalesmanStockItems(salesman.id);
            const holdingStock = items.reduce((sum, item) => sum + item.remainingStock, 0);
            const soldCount = items.reduce((sum, item) => sum + item.totalSold, 0);
            const salesSAR = items.reduce((sum, item) => sum + item.totalSalesAmount, 0);

            return (
              <div
                key={salesman.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  {/* Top: Name & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {salesman.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{salesman.area}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(salesman)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit salesman"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingSalesman(salesman)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete salesman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1 text-xs text-slate-600 py-2 border-y border-slate-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{salesman.phone}</span>
                    </div>
                    {salesman.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{salesman.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joined {formatDateDisplay(salesman.dateJoined)}</span>
                    </div>
                  </div>

                  {/* Stock Metrics summary */}
                  <div className="grid grid-cols-3 gap-2 py-3 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-medium">Remaining</div>
                      <div className="text-sm font-bold font-mono text-indigo-700 tabular-nums">
                        {holdingStock}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-medium">Sold</div>
                      <div className="text-sm font-bold font-mono text-emerald-700 tabular-nums">
                        {soldCount}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-500 font-medium">Revenue</div>
                      <div className="text-xs font-bold font-mono text-slate-900 tabular-nums truncate">
                        {formatSAR(salesSAR)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  type="button"
                  onClick={() => setViewingSalesman(salesman)}
                  className="w-full mt-2 py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Product Holding & Sales Details</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Salesman Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Salesman"
        description="Register a new salesman authorized to handle company stock."
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Salesman Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tariq Al-Mansoor"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +966 50 123 4567"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="salesman@company.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Territory / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g. Riyadh - Central"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Joined
              </label>
              <input
                type="date"
                value={formData.dateJoined}
                onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Van #4 route operator"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Save Salesman
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Salesman Modal */}
      <Modal
        isOpen={!!editingSalesman}
        onClose={() => setEditingSalesman(null)}
        title="Edit Salesman"
        description="Update salesman contact and territory details."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Salesman Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Territory / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Joined
              </label>
              <input
                type="date"
                value={formData.dateJoined}
                onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingSalesman(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* View Salesman Details Modal (Issued, Sold, Returned, Remaining) */}
      <Modal
        isOpen={!!viewingSalesman}
        onClose={() => setViewingSalesman(null)}
        title={viewingSalesman ? `${viewingSalesman.name} — Product Holdings & Sales` : 'Salesman Details'}
        description={`Area: ${viewingSalesman?.area || ''} · Phone: ${viewingSalesman?.phone || ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg">
              <span className="text-[10px] text-blue-800 font-semibold uppercase">Total Issued</span>
              <div className="text-lg font-bold font-mono text-blue-900 tabular-nums">
                {formatNumber(totalIssued)}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
              <span className="text-[10px] text-emerald-800 font-semibold uppercase">Total Sold</span>
              <div className="text-lg font-bold font-mono text-emerald-900 tabular-nums">
                {formatNumber(totalSold)}
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-lg">
              <span className="text-[10px] text-amber-800 font-semibold uppercase">Returned</span>
              <div className="text-lg font-bold font-mono text-amber-900 tabular-nums">
                {formatNumber(totalReturned)}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg">
              <span className="text-[10px] text-indigo-800 font-semibold uppercase">Remaining Stock</span>
              <div className="text-lg font-bold font-mono text-indigo-900 tabular-nums">
                {formatNumber(totalRemaining)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500">
              Total Revenue Generated: <strong className="text-slate-900 font-mono">{formatSAR(totalRevenue)}</strong>
            </span>
            <span className="text-slate-500 font-mono">
              Delivery Achievement:{' '}
              <strong className="text-blue-700">
                {totalIssued > 0 ? formatPercentage((totalSold / totalIssued) * 100) : '0%'}
              </strong>
            </span>
          </div>

          {/* Product breakdown table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {viewedItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No products have been issued to this salesman yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Product Name & Code</th>
                    <th className="py-2.5 px-3 text-center">Issued</th>
                    <th className="py-2.5 px-3 text-center">Sold</th>
                    <th className="py-2.5 px-3 text-center">Returned</th>
                    <th className="py-2.5 px-3 text-center bg-blue-50/50 text-blue-900">Remaining</th>
                    <th className="py-2.5 px-3 text-right">Sales (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewedItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {item.productCode} · {item.unit}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700">
                        {item.totalIssued}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-emerald-700 font-medium">
                        {item.totalSold}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-amber-700">
                        {item.totalReturned}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums font-bold text-indigo-700 bg-blue-50/30">
                        {item.remainingStock}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatSAR(item.totalSalesAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Salesman Invoices Section */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Recent Invoices for {viewingSalesman?.name}
            </h4>
            {viewingSalesman && invoices.filter((i) => i.salesmanId === viewingSalesman.id).length === 0 ? (
              <p className="text-[11px] text-slate-400">No invoices generated for this salesman yet.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {viewingSalesman &&
                  invoices
                    .filter((i) => i.salesmanId === viewingSalesman.id)
                    .map((inv) => (
                      <div key={inv.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-blue-700">{inv.invoiceNumber}</span>
                          <span className="text-[11px] text-slate-400 ml-2">
                            {formatDateDisplay(inv.date)} · {inv.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">{formatSAR(inv.totalAmount)}</span>
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded"
                          >
                            View Invoice
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setViewingSalesman(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Invoice Modal */}
      <InvoiceModal
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSalesman}
        onClose={() => setDeletingSalesman(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Salesman"
        message={`Are you sure you want to remove salesman "${deletingSalesman?.name}"?`}
        confirmLabel="Delete Salesman"
      />
    </div>
  );
};
