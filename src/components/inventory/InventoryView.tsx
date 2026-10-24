import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { Product, UnitType } from '../../types';
import { formatSAR, formatNumber, formatDateDisplay } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

const standardUnits: UnitType[] = ['Pcs', 'Box', 'Carton', 'Kg', 'Pack', 'Dozen', 'Ltr', 'Set', 'Meter'];

export const InventoryView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStock();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    purchasePrice: string;
    salePrice: string;
    currentStock: string;
    unit: string;
    category: string;
    minStockThreshold: string;
  }>({
    name: '',
    code: '',
    purchasePrice: '',
    salePrice: '',
    currentStock: '0',
    unit: 'Pcs',
    category: '',
    minStockThreshold: '5',
  });

  const openAddModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      purchasePrice: '',
      salePrice: '',
      currentStock: '0',
      unit: 'Pcs',
      category: '',
      minStockThreshold: '5',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormError(null);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      purchasePrice: product.purchasePrice.toString(),
      salePrice: product.salePrice.toString(),
      currentStock: product.currentStock.toString(),
      unit: product.unit,
      category: product.category || '',
      minStockThreshold: product.minStockThreshold.toString(),
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const purchase = parseFloat(formData.purchasePrice);
    const sale = parseFloat(formData.salePrice);
    const stock = parseInt(formData.currentStock, 10);
    const minThreshold = parseInt(formData.minStockThreshold, 10);

    if (isNaN(purchase) || purchase < 0) {
      setFormError('Please enter a valid purchase price in SAR.');
      return;
    }
    if (isNaN(sale) || sale < 0) {
      setFormError('Please enter a valid sale price in SAR.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setFormError('Current stock cannot be negative.');
      return;
    }

    const result = addProduct({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      purchasePrice: purchase,
      salePrice: sale,
      currentStock: stock,
      unit: formData.unit,
      category: formData.category.trim() || undefined,
      minStockThreshold: isNaN(minThreshold) ? 5 : minThreshold,
    });

    if (result.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(result.message || 'Failed to add product.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError(null);

    const purchase = parseFloat(formData.purchasePrice);
    const sale = parseFloat(formData.salePrice);
    const minThreshold = parseInt(formData.minStockThreshold, 10);

    if (isNaN(purchase) || purchase < 0) {
      setFormError('Please enter a valid purchase price in SAR.');
      return;
    }
    if (isNaN(sale) || sale < 0) {
      setFormError('Please enter a valid sale price in SAR.');
      return;
    }

    const result = updateProduct(editingProduct.id, {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      purchasePrice: purchase,
      salePrice: sale,
      unit: formData.unit,
      category: formData.category.trim() || undefined,
      minStockThreshold: isNaN(minThreshold) ? 5 : minThreshold,
    });

    if (result.success) {
      setEditingProduct(null);
    } else {
      setFormError(result.message || 'Failed to update product.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    const res = deleteProduct(deletingProduct.id);
    if (!res.success) {
      alert(res.message);
    }
    setDeletingProduct(null);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (stockFilter === 'low') {
        return p.currentStock > 0 && p.currentStock <= p.minStockThreshold;
      }
      if (stockFilter === 'out') {
        return p.currentStock === 0;
      }
      return true;
    });
  }, [products, searchQuery, stockFilter]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, code, or category..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
          />
        </div>

        {/* Filter controls & Add button */}
        <div className="flex items-center gap-2">
          {/* Filter segment */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                stockFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                stockFilter === 'low' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                stockFilter === 'out' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Product Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {products.length === 0
                ? 'Your inventory is currently empty. Add your first product to start tracking stock.'
                : 'No products match your current search query or filter.'}
            </p>
            {products.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Name & Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Purchase Price</th>
                  <th className="py-3 px-4">Sale Price</th>
                  <th className="py-3 px-4 text-center">Warehouse Stock</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStockThreshold;
                  const isOut = p.currentStock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {p.code}
                          {isLow && (
                            <span className="ml-2 text-amber-600 font-sans font-medium">
                              · Low Stock (&le; {p.minStockThreshold})
                            </span>
                          )}
                          {isOut && (
                            <span className="ml-2 text-red-600 font-sans font-medium">
                              · Out of Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600">
                        {p.category || '-'}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {formatSAR(p.purchasePrice)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-blue-700">
                        {formatSAR(p.salePrice)}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono tabular-nums font-bold text-sm ${
                            isOut
                              ? 'text-red-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {formatNumber(p.currentStock)}
                        </span>
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {p.unit}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
        description="Enter product details, pricing in Saudi Riyal (SAR), and warehouse balance."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Al-Rabie Orange Juice 1L"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Code / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. BEV-001"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price (SAR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sale Price (SAR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                {standardUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formData.minStockThreshold}
                onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                placeholder="5"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category (Optional)
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Beverages, Dairy, Dry Goods, Cleaning"
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
              Add Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
        description="Update product pricing and specifications."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Code / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price (SAR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sale Price (SAR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                {standardUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formData.minStockThreshold}
                onChange={(e) => setFormData({ ...formData, minStockThreshold: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            Note: Current warehouse stock ({editingProduct?.currentStock} {editingProduct?.unit}) is updated via Stock Entry, Issue, or Return records to preserve inventory transaction integrity.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.name}" (${deletingProduct?.code})? This will permanently remove it from the product catalog.`}
        confirmLabel="Delete Product"
      />
    </div>
  );
};
