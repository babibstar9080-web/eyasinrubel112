import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Salesman,
  Invoice,
  InvoiceItem,
  InvoiceType,
  ProductIssueRecord,
  SaleRecord,
  ReturnRecord,
  StockTransaction,
  SalesmanPerformance,
  SalesmanStockItem,
} from '../types';
import { loadStoredData, saveStoredData, getEmptyState, AppStateData } from '../utils/storage';
import { getTodayDateString } from '../utils/formatters';

interface StockContextType {
  products: Product[];
  salesmen: Salesman[];
  invoices: Invoice[];
  issueRecords: ProductIssueRecord[];
  salesRecords: SaleRecord[];
  returnRecords: ReturnRecord[];
  stockHistory: StockTransaction[];

  // KPI Metrics
  totalProductsCount: number;
  totalAvailableStock: number;
  totalProductsIssuedToSalesmen: number;
  totalProductsSold: number;
  totalSalesAmount: number;
  lowStockProducts: Product[];
  salesmenPerformances: SalesmanPerformance[];

  // Product Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string };
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>) => { success: boolean; message?: string };
  deleteProduct: (id: string) => { success: boolean; message?: string };

  // Salesman Actions
  addSalesman: (salesman: Omit<Salesman, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateSalesman: (id: string, updates: Partial<Omit<Salesman, 'id' | 'createdAt'>>) => { success: boolean; message?: string };
  deleteSalesman: (id: string) => { success: boolean; message?: string };

  // Invoice-based Operations
  createStockEntryInvoice: (data: {
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }) => { success: boolean; invoice?: Invoice; message?: string };

  createProductIssueInvoice: (data: {
    salesmanId: string;
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }) => { success: boolean; invoice?: Invoice; message?: string };

  createSalesInvoice: (data: {
    salesmanId: string;
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }) => { success: boolean; invoice?: Invoice; message?: string };

  createProductReturnInvoice: (data: {
    salesmanId: string;
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }) => { success: boolean; invoice?: Invoice; message?: string };

  getSalesmanRemainingStock: (salesmanId: string, productId: string) => number;
  getSalesmanStockItems: (salesmanId: string) => SalesmanStockItem[];
  resetAllData: () => void;
  importData: (data: AppStateData) => { success: boolean; message?: string };
  loadStarterSampleData: () => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppStateData>(() => loadStoredData());

  // Automatically save to localStorage whenever data changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Helper: generate unique IDs
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Helper: generate formatted invoice numbers
  const generateInvoiceNumber = (type: InvoiceType): string => {
    const prefixMap: Record<InvoiceType, string> = {
      STOCK_ENTRY: 'STK',
      PRODUCT_ISSUE: 'ISS',
      SALES: 'SLS',
      PRODUCT_RETURN: 'RET',
    };
    const prefix = prefixMap[type] || 'INV';
    const datePart = (getTodayDateString()).replace(/-/g, '');
    const countToday = data.invoices.filter((inv) => inv.type === type).length + 1;
    const seq = String(countToday).padStart(4, '0');
    return `${prefix}-${datePart}-${seq}`;
  };

  // Helper: calculate remaining stock for a salesman and product
  const getSalesmanRemainingStock = (salesmanId: string, productId: string): number => {
    const totalIssued = data.issueRecords
      .filter((r) => r.salesmanId === salesmanId && r.productId === productId)
      .reduce((sum, r) => sum + r.quantity, 0);

    const totalSold = data.salesRecords
      .filter((r) => r.salesmanId === salesmanId && r.productId === productId)
      .reduce((sum, r) => sum + r.quantity, 0);

    const totalReturned = data.returnRecords
      .filter((r) => r.salesmanId === salesmanId && r.productId === productId)
      .reduce((sum, r) => sum + r.quantity, 0);

    const remaining = totalIssued - totalSold - totalReturned;
    return Math.max(0, remaining);
  };

  // Helper: get detailed stock breakdown for a salesman
  const getSalesmanStockItems = (salesmanId: string): SalesmanStockItem[] => {
    const productIdsSet = new Set<string>();
    data.issueRecords
      .filter((r) => r.salesmanId === salesmanId)
      .forEach((r) => productIdsSet.add(r.productId));

    const items: SalesmanStockItem[] = [];

    productIdsSet.forEach((prodId) => {
      const product = data.products.find((p) => p.id === prodId);
      const totalIssued = data.issueRecords
        .filter((r) => r.salesmanId === salesmanId && r.productId === prodId)
        .reduce((sum, r) => sum + r.quantity, 0);

      const totalSold = data.salesRecords
        .filter((r) => r.salesmanId === salesmanId && r.productId === prodId)
        .reduce((sum, r) => sum + r.quantity, 0);

      const totalReturned = data.returnRecords
        .filter((r) => r.salesmanId === salesmanId && r.productId === prodId)
        .reduce((sum, r) => sum + r.quantity, 0);

      const totalSalesAmount = data.salesRecords
        .filter((r) => r.salesmanId === salesmanId && r.productId === prodId)
        .reduce((sum, r) => sum + r.totalAmount, 0);

      const remainingStock = Math.max(0, totalIssued - totalSold - totalReturned);

      items.push({
        productId: prodId,
        productName: product ? product.name : 'Unknown Product',
        productCode: product ? product.code : '-',
        unit: product ? product.unit : 'Pcs',
        totalIssued,
        totalSold,
        totalReturned,
        remainingStock,
        totalSalesAmount,
      });
    });

    return items;
  };

  // Add Product
  const addProduct = (
    productInput: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): { success: boolean; message?: string } => {
    if (!productInput.name.trim()) {
      return { success: false, message: 'Product name is required.' };
    }
    if (!productInput.code.trim()) {
      return { success: false, message: 'Product code is required.' };
    }

    const existingCode = data.products.find(
      (p) => p.code.toLowerCase().trim() === productInput.code.toLowerCase().trim()
    );
    if (existingCode) {
      return { success: false, message: `Product code "${productInput.code}" already exists.` };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productInput,
      id: generateId(),
      purchasePrice: Math.max(0, Number(productInput.purchasePrice) || 0),
      salePrice: Math.max(0, Number(productInput.salePrice) || 0),
      currentStock: Math.max(0, Number(productInput.currentStock) || 0),
      minStockThreshold: Math.max(0, Number(productInput.minStockThreshold) || 5),
      createdAt: now,
      updatedAt: now,
    };

    let newHistory = [...data.stockHistory];

    if (newProduct.currentStock > 0) {
      const initialTx: StockTransaction = {
        id: generateId(),
        timestamp: now,
        date: getTodayDateString(),
        type: 'STOCK_IN',
        productId: newProduct.id,
        productName: newProduct.name,
        productCode: newProduct.code,
        quantity: newProduct.currentStock,
        warehouseStockAfter: newProduct.currentStock,
        unitPrice: newProduct.purchasePrice,
        totalAmount: newProduct.currentStock * newProduct.purchasePrice,
        notes: 'Initial catalog stock on creation',
      };
      newHistory = [initialTx, ...newHistory];
    }

    setData((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
      stockHistory: newHistory,
    }));

    return { success: true };
  };

  // Update Product
  const updateProduct = (
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt'>>
  ): { success: boolean; message?: string } => {
    const existing = data.products.find((p) => p.id === id);
    if (!existing) {
      return { success: false, message: 'Product not found.' };
    }

    if (updates.code && updates.code.trim() !== existing.code) {
      const duplicate = data.products.find(
        (p) => p.id !== id && p.code.toLowerCase().trim() === updates.code!.toLowerCase().trim()
      );
      if (duplicate) {
        return { success: false, message: `Product code "${updates.code}" already exists on another item.` };
      }
    }

    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
              purchasePrice:
                updates.purchasePrice !== undefined
                  ? Math.max(0, Number(updates.purchasePrice))
                  : p.purchasePrice,
              salePrice:
                updates.salePrice !== undefined ? Math.max(0, Number(updates.salePrice)) : p.salePrice,
              minStockThreshold:
                updates.minStockThreshold !== undefined
                  ? Math.max(0, Number(updates.minStockThreshold))
                  : p.minStockThreshold,
              updatedAt: now,
            }
          : p
      ),
    }));

    return { success: true };
  };

  // Delete Product
  const deleteProduct = (id: string): { success: boolean; message?: string } => {
    const product = data.products.find((p) => p.id === id);
    if (!product) {
      return { success: false, message: 'Product not found.' };
    }

    const hasRemainingWithSalesman = data.salesmen.some((s) => {
      const remaining = getSalesmanRemainingStock(s.id, id);
      return remaining > 0;
    });

    if (hasRemainingWithSalesman) {
      return {
        success: false,
        message: 'Cannot delete product: A salesman still has active stock holding for this product. Return or sell the stock first.',
      };
    }

    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));

    return { success: true };
  };

  // Add Salesman
  const addSalesman = (salesmanInput: Omit<Salesman, 'id' | 'createdAt'>): { success: boolean; message?: string } => {
    if (!salesmanInput.name.trim()) {
      return { success: false, message: 'Salesman name is required.' };
    }
    if (!salesmanInput.phone.trim()) {
      return { success: false, message: 'Phone number is required.' };
    }

    const now = new Date().toISOString();
    const newSalesman: Salesman = {
      ...salesmanInput,
      id: generateId(),
      createdAt: now,
    };

    setData((prev) => ({
      ...prev,
      salesmen: [...prev.salesmen, newSalesman],
    }));

    return { success: true };
  };

  // Update Salesman
  const updateSalesman = (
    id: string,
    updates: Partial<Omit<Salesman, 'id' | 'createdAt'>>
  ): { success: boolean; message?: string } => {
    const existing = data.salesmen.find((s) => s.id === id);
    if (!existing) {
      return { success: false, message: 'Salesman not found.' };
    }

    setData((prev) => ({
      ...prev,
      salesmen: prev.salesmen.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));

    return { success: true };
  };

  // Delete Salesman
  const deleteSalesman = (id: string): { success: boolean; message?: string } => {
    const items = getSalesmanStockItems(id);
    const activeStock = items.reduce((sum, item) => sum + item.remainingStock, 0);

    if (activeStock > 0) {
      return {
        success: false,
        message: `Cannot delete salesman: They still hold ${activeStock} unreturned products. Record return or sales before deleting.`,
      };
    }

    setData((prev) => ({
      ...prev,
      salesmen: prev.salesmen.filter((s) => s.id !== id),
    }));

    return { success: true };
  };

  // 1. STOCK ENTRY INVOICE
  const createStockEntryInvoice = (invoiceData: {
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }): { success: boolean; invoice?: Invoice; message?: string } => {
    if (!invoiceData.items || invoiceData.items.length === 0) {
      return { success: false, message: 'Please add at least one product line item to the invoice.' };
    }

    for (const item of invoiceData.items) {
      if (item.quantity <= 0) {
        return { success: false, message: `Invalid quantity for ${item.productName}. Must be > 0.` };
      }
    }

    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('STOCK_ENTRY');
    const invoiceId = generateId();

    const finalizedItems: InvoiceItem[] = invoiceData.items.map((item) => {
      const purchasePrice = Number(item.purchasePrice) || 0;
      const salePrice = Number(item.salePrice) || 0;
      const totalPurchase = item.quantity * purchasePrice;
      const totalSale = item.quantity * salePrice;
      return {
        ...item,
        id: generateId(),
        purchasePrice,
        salePrice,
        unitPrice: purchasePrice,
        totalPurchaseAmount: totalPurchase,
        totalSaleAmount: totalSale,
        lineTotal: totalPurchase,
      };
    });

    const totalQuantity = finalizedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalPurchaseAmount = finalizedItems.reduce((acc, curr) => acc + curr.totalPurchaseAmount, 0);
    const totalSaleAmount = finalizedItems.reduce((acc, curr) => acc + curr.totalSaleAmount, 0);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      type: 'STOCK_ENTRY',
      date: invoiceData.date || getTodayDateString(),
      timestamp: now,
      items: finalizedItems,
      totalQuantity,
      totalAmount: totalPurchaseAmount,
      totalPurchaseAmount,
      totalSaleAmount,
      notes: invoiceData.notes,
      createdAt: now,
    };

    // Calculate updated warehouse products and transaction logs
    const updatedProducts = [...data.products];
    const newTransactions: StockTransaction[] = [];

    finalizedItems.forEach((item) => {
      const pIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        const currentStock = updatedProducts[pIndex].currentStock;
        const newStock = currentStock + item.quantity;
        updatedProducts[pIndex] = {
          ...updatedProducts[pIndex],
          currentStock: newStock,
          purchasePrice: item.purchasePrice > 0 ? item.purchasePrice : updatedProducts[pIndex].purchasePrice,
          salePrice: item.salePrice > 0 ? item.salePrice : updatedProducts[pIndex].salePrice,
          updatedAt: now,
        };

        newTransactions.push({
          id: generateId(),
          timestamp: now,
          date: invoiceData.date || getTodayDateString(),
          type: 'STOCK_IN',
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          warehouseStockAfter: newStock,
          unitPrice: item.purchasePrice,
          totalAmount: item.totalPurchaseAmount,
          invoiceId,
          invoiceNumber,
          notes: invoiceData.notes ? `Invoice #${invoiceNumber} - ${invoiceData.notes}` : `Stock Entry Invoice #${invoiceNumber}`,
        });
      }
    });

    setData((prev) => ({
      ...prev,
      products: updatedProducts,
      invoices: [newInvoice, ...prev.invoices],
      stockHistory: [...newTransactions, ...prev.stockHistory],
    }));

    return { success: true, invoice: newInvoice };
  };

  // 2. PRODUCT ISSUE INVOICE
  const createProductIssueInvoice = (invoiceData: {
    salesmanId: string;
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }): { success: boolean; invoice?: Invoice; message?: string } => {
    const salesman = data.salesmen.find((s) => s.id === invoiceData.salesmanId);
    if (!salesman) {
      return { success: false, message: 'Please select a valid salesman.' };
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      return { success: false, message: 'Please add at least one product line item to the invoice.' };
    }

    // Group requested quantities by productId to validate against warehouse stock
    const requestedStockMap = new Map<string, number>();
    for (const item of invoiceData.items) {
      if (item.quantity <= 0) {
        return { success: false, message: `Invalid quantity for ${item.productName}. Must be > 0.` };
      }
      requestedStockMap.set(item.productId, (requestedStockMap.get(item.productId) || 0) + item.quantity);
    }

    // Check available warehouse stock
    for (const [prodId, reqQty] of requestedStockMap.entries()) {
      const prod = data.products.find((p) => p.id === prodId);
      if (!prod) {
        return { success: false, message: `Product not found.` };
      }
      if (reqQty > prod.currentStock) {
        return {
          success: false,
          message: `Cannot issue ${reqQty} ${prod.unit} of "${prod.name}". Only ${prod.currentStock} ${prod.unit} currently available in warehouse!`,
        };
      }
    }

    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('PRODUCT_ISSUE');
    const invoiceId = generateId();

    const finalizedItems: InvoiceItem[] = invoiceData.items.map((item) => {
      const unitPrice = Number(item.unitPrice) || Number(item.salePrice) || 0;
      const totalAmount = item.quantity * unitPrice;
      return {
        ...item,
        id: generateId(),
        purchasePrice: item.purchasePrice || 0,
        salePrice: unitPrice,
        unitPrice,
        totalPurchaseAmount: item.quantity * (item.purchasePrice || 0),
        totalSaleAmount: totalAmount,
        lineTotal: totalAmount,
      };
    });

    const totalQuantity = finalizedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalAmount = finalizedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      type: 'PRODUCT_ISSUE',
      date: invoiceData.date || getTodayDateString(),
      timestamp: now,
      salesmanId: salesman.id,
      salesmanName: salesman.name,
      items: finalizedItems,
      totalQuantity,
      totalAmount,
      totalPurchaseAmount: finalizedItems.reduce((acc, curr) => acc + curr.totalPurchaseAmount, 0),
      totalSaleAmount: totalAmount,
      notes: invoiceData.notes,
      createdAt: now,
    };

    const updatedProducts = [...data.products];
    const newIssueRecords: ProductIssueRecord[] = [];
    const newTransactions: StockTransaction[] = [];

    finalizedItems.forEach((item) => {
      const pIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        const newStock = updatedProducts[pIndex].currentStock - item.quantity;
        updatedProducts[pIndex] = {
          ...updatedProducts[pIndex],
          currentStock: newStock,
          updatedAt: now,
        };

        newIssueRecords.push({
          id: generateId(),
          date: invoiceData.date || getTodayDateString(),
          salesmanId: salesman.id,
          salesmanName: salesman.name,
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalAmount: item.lineTotal,
          invoiceId,
          invoiceNumber,
          notes: invoiceData.notes,
          createdAt: now,
        });

        newTransactions.push({
          id: generateId(),
          timestamp: now,
          date: invoiceData.date || getTodayDateString(),
          type: 'ISSUE_TO_SALESMAN',
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          warehouseStockAfter: newStock,
          salesmanId: salesman.id,
          salesmanName: salesman.name,
          unitPrice: item.unitPrice,
          totalAmount: item.lineTotal,
          invoiceId,
          invoiceNumber,
          notes: invoiceData.notes ? `Invoice #${invoiceNumber} - ${invoiceData.notes}` : `Issued to ${salesman.name} (Invoice #${invoiceNumber})`,
        });
      }
    });

    setData((prev) => ({
      ...prev,
      products: updatedProducts,
      invoices: [newInvoice, ...prev.invoices],
      issueRecords: [...newIssueRecords, ...prev.issueRecords],
      stockHistory: [...newTransactions, ...prev.stockHistory],
    }));

    return { success: true, invoice: newInvoice };
  };

  // 3. SALES INVOICE
  const createSalesInvoice = (invoiceData: {
    salesmanId: string;
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }): { success: boolean; invoice?: Invoice; message?: string } => {
    const salesman = data.salesmen.find((s) => s.id === invoiceData.salesmanId);
    if (!salesman) {
      return { success: false, message: 'Please select a valid salesman.' };
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      return { success: false, message: 'Please add at least one product line item to the invoice.' };
    }

    // Validate that salesman holds enough remaining stock for each requested product
    const requestedStockMap = new Map<string, number>();
    for (const item of invoiceData.items) {
      if (item.quantity <= 0) {
        return { success: false, message: `Invalid quantity for ${item.productName}. Must be > 0.` };
      }
      requestedStockMap.set(item.productId, (requestedStockMap.get(item.productId) || 0) + item.quantity);
    }

    for (const [prodId, reqQty] of requestedStockMap.entries()) {
      const prod = data.products.find((p) => p.id === prodId);
      const remainingWithSalesman = getSalesmanRemainingStock(salesman.id, prodId);
      if (reqQty > remainingWithSalesman) {
        return {
          success: false,
          message: `Cannot record sale of ${reqQty} ${prod?.unit || 'units'} of "${prod?.name}". Salesman ${salesman.name} only holds ${remainingWithSalesman} ${prod?.unit || 'units'} in hand!`,
        };
      }
    }

    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('SALES');
    const invoiceId = generateId();

    const finalizedItems: InvoiceItem[] = invoiceData.items.map((item) => {
      const unitPrice = Number(item.unitPrice) || Number(item.salePrice) || 0;
      const totalAmount = item.quantity * unitPrice;
      return {
        ...item,
        id: generateId(),
        purchasePrice: item.purchasePrice || 0,
        salePrice: unitPrice,
        unitPrice,
        totalPurchaseAmount: item.quantity * (item.purchasePrice || 0),
        totalSaleAmount: totalAmount,
        lineTotal: totalAmount,
      };
    });

    const totalQuantity = finalizedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalAmount = finalizedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      type: 'SALES',
      date: invoiceData.date || getTodayDateString(),
      timestamp: now,
      salesmanId: salesman.id,
      salesmanName: salesman.name,
      items: finalizedItems,
      totalQuantity,
      totalAmount,
      totalPurchaseAmount: finalizedItems.reduce((acc, curr) => acc + curr.totalPurchaseAmount, 0),
      totalSaleAmount: totalAmount,
      notes: invoiceData.notes,
      createdAt: now,
    };

    const newSalesRecords: SaleRecord[] = [];
    const newTransactions: StockTransaction[] = [];

    finalizedItems.forEach((item) => {
      const prod = data.products.find((p) => p.id === item.productId);

      newSalesRecords.push({
        id: generateId(),
        date: invoiceData.date || getTodayDateString(),
        salesmanId: salesman.id,
        salesmanName: salesman.name,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        unit: item.unit,
        salePrice: item.unitPrice,
        totalAmount: item.lineTotal,
        invoiceId,
        invoiceNumber,
        notes: invoiceData.notes,
        createdAt: now,
      });

      newTransactions.push({
        id: generateId(),
        timestamp: now,
        date: invoiceData.date || getTodayDateString(),
        type: 'SALE_RECORDED',
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        warehouseStockAfter: prod ? prod.currentStock : 0,
        salesmanId: salesman.id,
        salesmanName: salesman.name,
        unitPrice: item.unitPrice,
        totalAmount: item.lineTotal,
        invoiceId,
        invoiceNumber,
        notes: invoiceData.notes ? `Invoice #${invoiceNumber} - ${invoiceData.notes}` : `Sales Invoice #${invoiceNumber} (${salesman.name})`,
      });
    });

    setData((prev) => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
      salesRecords: [...newSalesRecords, ...prev.salesRecords],
      stockHistory: [...newTransactions, ...prev.stockHistory],
    }));

    return { success: true, invoice: newInvoice };
  };

  // 4. PRODUCT RETURN INVOICE
  const createProductReturnInvoice = (invoiceData: {
    salesmanId: string;
    date: string;
    items: Omit<InvoiceItem, 'id' | 'totalPurchaseAmount' | 'totalSaleAmount' | 'lineTotal'>[];
    notes?: string;
  }): { success: boolean; invoice?: Invoice; message?: string } => {
    const salesman = data.salesmen.find((s) => s.id === invoiceData.salesmanId);
    if (!salesman) {
      return { success: false, message: 'Please select a valid salesman.' };
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      return { success: false, message: 'Please add at least one product line item to the invoice.' };
    }

    // Validate that salesman holds enough remaining stock for return
    const requestedStockMap = new Map<string, number>();
    for (const item of invoiceData.items) {
      if (item.quantity <= 0) {
        return { success: false, message: `Invalid quantity for ${item.productName}. Must be > 0.` };
      }
      requestedStockMap.set(item.productId, (requestedStockMap.get(item.productId) || 0) + item.quantity);
    }

    for (const [prodId, reqQty] of requestedStockMap.entries()) {
      const prod = data.products.find((p) => p.id === prodId);
      const remainingWithSalesman = getSalesmanRemainingStock(salesman.id, prodId);
      if (reqQty > remainingWithSalesman) {
        return {
          success: false,
          message: `Cannot return ${reqQty} ${prod?.unit || 'units'} of "${prod?.name}". Salesman ${salesman.name} only holds ${remainingWithSalesman} ${prod?.unit || 'units'} in hand!`,
        };
      }
    }

    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber('PRODUCT_RETURN');
    const invoiceId = generateId();

    const finalizedItems: InvoiceItem[] = invoiceData.items.map((item) => {
      const unitPrice = Number(item.unitPrice) || Number(item.salePrice) || 0;
      const totalAmount = item.quantity * unitPrice;
      return {
        ...item,
        id: generateId(),
        purchasePrice: item.purchasePrice || 0,
        salePrice: unitPrice,
        unitPrice,
        totalPurchaseAmount: item.quantity * (item.purchasePrice || 0),
        totalSaleAmount: totalAmount,
        lineTotal: totalAmount,
      };
    });

    const totalQuantity = finalizedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalAmount = finalizedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      type: 'PRODUCT_RETURN',
      date: invoiceData.date || getTodayDateString(),
      timestamp: now,
      salesmanId: salesman.id,
      salesmanName: salesman.name,
      items: finalizedItems,
      totalQuantity,
      totalAmount,
      totalPurchaseAmount: finalizedItems.reduce((acc, curr) => acc + curr.totalPurchaseAmount, 0),
      totalSaleAmount: totalAmount,
      notes: invoiceData.notes,
      createdAt: now,
    };

    const updatedProducts = [...data.products];
    const newReturnRecords: ReturnRecord[] = [];
    const newTransactions: StockTransaction[] = [];

    finalizedItems.forEach((item) => {
      const pIndex = updatedProducts.findIndex((p) => p.id === item.productId);
      if (pIndex >= 0) {
        const newStock = updatedProducts[pIndex].currentStock + item.quantity;
        updatedProducts[pIndex] = {
          ...updatedProducts[pIndex],
          currentStock: newStock,
          updatedAt: now,
        };

        newReturnRecords.push({
          id: generateId(),
          date: invoiceData.date || getTodayDateString(),
          salesmanId: salesman.id,
          salesmanName: salesman.name,
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalAmount: item.lineTotal,
          invoiceId,
          invoiceNumber,
          notes: invoiceData.notes,
          createdAt: now,
        });

        newTransactions.push({
          id: generateId(),
          timestamp: now,
          date: invoiceData.date || getTodayDateString(),
          type: 'RETURN_FROM_SALESMAN',
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          warehouseStockAfter: newStock,
          salesmanId: salesman.id,
          salesmanName: salesman.name,
          unitPrice: item.unitPrice,
          totalAmount: item.lineTotal,
          invoiceId,
          invoiceNumber,
          notes: invoiceData.notes ? `Invoice #${invoiceNumber} - ${invoiceData.notes}` : `Returned from ${salesman.name} (Invoice #${invoiceNumber})`,
        });
      }
    });

    setData((prev) => ({
      ...prev,
      products: updatedProducts,
      invoices: [newInvoice, ...prev.invoices],
      returnRecords: [...newReturnRecords, ...prev.returnRecords],
      stockHistory: [...newTransactions, ...prev.stockHistory],
    }));

    return { success: true, invoice: newInvoice };
  };

  // KPI Calculations
  const totalProductsCount = data.products.length;

  const totalAvailableStock = useMemo(() => {
    return data.products.reduce((sum, p) => sum + p.currentStock, 0);
  }, [data.products]);

  const totalProductsIssuedToSalesmen = useMemo(() => {
    const issued = data.issueRecords.reduce((sum, r) => sum + r.quantity, 0);
    const sold = data.salesRecords.reduce((sum, r) => sum + r.quantity, 0);
    const returned = data.returnRecords.reduce((sum, r) => sum + r.quantity, 0);
    return Math.max(0, issued - sold - returned);
  }, [data.issueRecords, data.salesRecords, data.returnRecords]);

  const totalProductsSold = useMemo(() => {
    return data.salesRecords.reduce((sum, r) => sum + r.quantity, 0);
  }, [data.salesRecords]);

  const totalSalesAmount = useMemo(() => {
    return data.salesRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [data.salesRecords]);

  const lowStockProducts = useMemo(() => {
    return data.products.filter((p) => p.currentStock <= p.minStockThreshold);
  }, [data.products]);

  const salesmenPerformances = useMemo(() => {
    return data.salesmen.map((salesman) => {
      const items = getSalesmanStockItems(salesman.id);
      const totalIssued = items.reduce((sum, i) => sum + i.totalIssued, 0);
      const totalSold = items.reduce((sum, i) => sum + i.totalSold, 0);
      const totalReturned = items.reduce((sum, i) => sum + i.totalReturned, 0);
      const remainingStock = Math.max(0, totalIssued - totalSold - totalReturned);
      const totalSalesAmt = items.reduce((sum, i) => sum + i.totalSalesAmount, 0);
      const achievementRate = totalIssued > 0 ? (totalSold / totalIssued) * 100 : 0;

      return {
        salesman,
        totalProductsIssued: totalIssued,
        totalProductsSold: totalSold,
        totalProductsReturned: totalReturned,
        remainingStock,
        totalSalesAmount: totalSalesAmt,
        achievementRate,
        items,
      };
    });
  }, [data.salesmen, data.issueRecords, data.salesRecords, data.returnRecords, data.products]);

  const resetAllData = () => {
    const empty = getEmptyState();
    setData(empty);
  };

  const importData = (imported: AppStateData): { success: boolean; message?: string } => {
    if (!imported || !Array.isArray(imported.products)) {
      return { success: false, message: 'Invalid backup file format.' };
    }
    setData({
      products: Array.isArray(imported.products) ? imported.products : [],
      salesmen: Array.isArray(imported.salesmen) ? imported.salesmen : [],
      invoices: Array.isArray(imported.invoices) ? imported.invoices : [],
      issueRecords: Array.isArray(imported.issueRecords) ? imported.issueRecords : [],
      salesRecords: Array.isArray(imported.salesRecords) ? imported.salesRecords : [],
      returnRecords: Array.isArray(imported.returnRecords) ? imported.returnRecords : [],
      stockHistory: Array.isArray(imported.stockHistory) ? imported.stockHistory : [],
      lastUpdated: new Date().toISOString(),
    });
    return { success: true };
  };

  const loadStarterSampleData = () => {
    const now = new Date().toISOString();
    const today = getTodayDateString();

    const sampleProducts: Product[] = [
      {
        id: 'p1',
        name: 'Al-Rabie Orange Juice 1L',
        code: 'BEV-001',
        purchasePrice: 4.5,
        salePrice: 7.0,
        currentStock: 120,
        unit: 'Carton',
        category: 'Beverages',
        minStockThreshold: 15,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'p2',
        name: 'Almarai Full Fat Milk 2L',
        code: 'DRY-102',
        purchasePrice: 7.25,
        salePrice: 11.0,
        currentStock: 45,
        unit: 'Box',
        category: 'Dairy',
        minStockThreshold: 20,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'p3',
        name: 'Fine Classic Facial Tissues (10x200)',
        code: 'PAP-305',
        purchasePrice: 18.0,
        salePrice: 26.5,
        currentStock: 14,
        unit: 'Pack',
        category: 'Household',
        minStockThreshold: 15,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'p4',
        name: 'Afia Corn Oil 1.5L x 2',
        code: 'OIL-401',
        purchasePrice: 22.0,
        salePrice: 31.0,
        currentStock: 60,
        unit: 'Box',
        category: 'Groceries',
        minStockThreshold: 10,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const sampleSalesmen: Salesman[] = [
      {
        id: 's1',
        name: 'Tariq Al-Mansoor',
        phone: '+966 50 123 4567',
        email: 'tariq.mansoor@company.com',
        area: 'Riyadh - Al Olaya',
        dateJoined: '2026-01-15',
        notes: 'Senior route executive',
        createdAt: now,
      },
      {
        id: 's2',
        name: 'Faisal Al-Harbi',
        phone: '+966 54 987 6543',
        email: 'faisal.harbi@company.com',
        area: 'Jeddah - Al Hamra',
        dateJoined: '2026-03-01',
        notes: 'Commercial van specialist',
        createdAt: now,
      },
    ];

    const sampleInvoices: Invoice[] = [
      {
        id: 'inv-stk-1',
        invoiceNumber: 'STK-20261023-0001',
        type: 'STOCK_ENTRY',
        date: today,
        timestamp: now,
        items: [
          {
            id: 'it-1',
            productId: 'p1',
            productName: 'Al-Rabie Orange Juice 1L',
            productCode: 'BEV-001',
            unit: 'Carton',
            quantity: 148,
            purchasePrice: 4.5,
            salePrice: 7.0,
            unitPrice: 4.5,
            totalPurchaseAmount: 666.0,
            totalSaleAmount: 1036.0,
            lineTotal: 666.0,
          },
        ],
        totalQuantity: 148,
        totalAmount: 666.0,
        totalPurchaseAmount: 666.0,
        totalSaleAmount: 1036.0,
        notes: 'Initial warehouse shipment intake',
        createdAt: now,
      },
      {
        id: 'inv-iss-1',
        invoiceNumber: 'ISS-20261023-0001',
        type: 'PRODUCT_ISSUE',
        date: today,
        timestamp: now,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        items: [
          {
            id: 'it-2',
            productId: 'p1',
            productName: 'Al-Rabie Orange Juice 1L',
            productCode: 'BEV-001',
            unit: 'Carton',
            quantity: 30,
            purchasePrice: 4.5,
            salePrice: 7.0,
            unitPrice: 7.0,
            totalPurchaseAmount: 135.0,
            totalSaleAmount: 210.0,
            lineTotal: 210.0,
          },
        ],
        totalQuantity: 30,
        totalAmount: 210.0,
        totalPurchaseAmount: 135.0,
        totalSaleAmount: 210.0,
        notes: 'Morning van stock issue',
        createdAt: now,
      },
      {
        id: 'inv-sls-1',
        invoiceNumber: 'SLS-20261023-0001',
        type: 'SALES',
        date: today,
        timestamp: now,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        items: [
          {
            id: 'it-3',
            productId: 'p1',
            productName: 'Al-Rabie Orange Juice 1L',
            productCode: 'BEV-001',
            unit: 'Carton',
            quantity: 20,
            purchasePrice: 4.5,
            salePrice: 7.0,
            unitPrice: 7.0,
            totalPurchaseAmount: 90.0,
            totalSaleAmount: 140.0,
            lineTotal: 140.0,
          },
        ],
        totalQuantity: 20,
        totalAmount: 140.0,
        totalPurchaseAmount: 90.0,
        totalSaleAmount: 140.0,
        notes: 'Supermarket delivery sale',
        createdAt: now,
      },
      {
        id: 'inv-ret-1',
        invoiceNumber: 'RET-20261023-0001',
        type: 'PRODUCT_RETURN',
        date: today,
        timestamp: now,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        items: [
          {
            id: 'it-4',
            productId: 'p1',
            productName: 'Al-Rabie Orange Juice 1L',
            productCode: 'BEV-001',
            unit: 'Carton',
            quantity: 2,
            purchasePrice: 4.5,
            salePrice: 7.0,
            unitPrice: 7.0,
            totalPurchaseAmount: 9.0,
            totalSaleAmount: 14.0,
            lineTotal: 14.0,
          },
        ],
        totalQuantity: 2,
        totalAmount: 14.0,
        totalPurchaseAmount: 9.0,
        totalSaleAmount: 14.0,
        notes: 'Customer order adjustment return',
        createdAt: now,
      },
    ];

    const sampleIssues: ProductIssueRecord[] = [
      {
        id: 'iss-1',
        date: today,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        productId: 'p1',
        productName: 'Al-Rabie Orange Juice 1L',
        productCode: 'BEV-001',
        quantity: 30,
        unit: 'Carton',
        unitPrice: 7.0,
        totalAmount: 210.0,
        invoiceId: 'inv-iss-1',
        invoiceNumber: 'ISS-20261023-0001',
        notes: 'Morning dispatch batch A',
        createdAt: now,
      },
    ];

    const sampleSales: SaleRecord[] = [
      {
        id: 'sl-1',
        date: today,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        productId: 'p1',
        productName: 'Al-Rabie Orange Juice 1L',
        productCode: 'BEV-001',
        quantity: 20,
        unit: 'Carton',
        salePrice: 7.0,
        totalAmount: 140.0,
        invoiceId: 'inv-sls-1',
        invoiceNumber: 'SLS-20261023-0001',
        notes: 'Sold to Supermarket Al-Sadhan',
        createdAt: now,
      },
    ];

    const sampleReturns: ReturnRecord[] = [
      {
        id: 'ret-1',
        date: today,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        productId: 'p1',
        productName: 'Al-Rabie Orange Juice 1L',
        productCode: 'BEV-001',
        quantity: 2,
        unit: 'Carton',
        unitPrice: 7.0,
        totalAmount: 14.0,
        invoiceId: 'inv-ret-1',
        invoiceNumber: 'RET-20261023-0001',
        notes: 'Undamaged return to warehouse',
        createdAt: now,
      },
    ];

    const sampleHistory: StockTransaction[] = [
      {
        id: 'tx-4',
        timestamp: now,
        date: today,
        type: 'RETURN_FROM_SALESMAN',
        productId: 'p1',
        productName: 'Al-Rabie Orange Juice 1L',
        productCode: 'BEV-001',
        quantity: 2,
        warehouseStockAfter: 120,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        invoiceId: 'inv-ret-1',
        invoiceNumber: 'RET-20261023-0001',
        notes: 'Returned from Tariq Al-Mansoor (Invoice #RET-20261023-0001)',
      },
      {
        id: 'tx-3',
        timestamp: now,
        date: today,
        type: 'SALE_RECORDED',
        productId: 'p1',
        productName: 'Al-Rabie Orange Juice 1L',
        productCode: 'BEV-001',
        quantity: 20,
        warehouseStockAfter: 118,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        unitPrice: 7.0,
        totalAmount: 140.0,
        invoiceId: 'inv-sls-1',
        invoiceNumber: 'SLS-20261023-0001',
        notes: 'Sales Invoice #SLS-20261023-0001 (Tariq Al-Mansoor)',
      },
      {
        id: 'tx-2',
        timestamp: now,
        date: today,
        type: 'ISSUE_TO_SALESMAN',
        productId: 'p1',
        productName: 'Al-Rabie Orange Juice 1L',
        productCode: 'BEV-001',
        quantity: 30,
        warehouseStockAfter: 118,
        salesmanId: 's1',
        salesmanName: 'Tariq Al-Mansoor',
        unitPrice: 7.0,
        totalAmount: 210.0,
        invoiceId: 'inv-iss-1',
        invoiceNumber: 'ISS-20261023-0001',
        notes: 'Issued to Tariq Al-Mansoor (Invoice #ISS-20261023-0001)',
      },
      {
        id: 'tx-1',
        timestamp: now,
        date: today,
        type: 'STOCK_IN',
        productId: 'p1',
        productName: 'Al-Rabie Orange Juice 1L',
        productCode: 'BEV-001',
        quantity: 148,
        warehouseStockAfter: 148,
        unitPrice: 4.5,
        totalAmount: 666.0,
        invoiceId: 'inv-stk-1',
        invoiceNumber: 'STK-20261023-0001',
        notes: 'Stock Entry Invoice #STK-20261023-0001',
      },
    ];

    const starterState: AppStateData = {
      products: sampleProducts,
      salesmen: sampleSalesmen,
      invoices: sampleInvoices,
      issueRecords: sampleIssues,
      salesRecords: sampleSales,
      returnRecords: sampleReturns,
      stockHistory: sampleHistory,
      lastUpdated: now,
    };

    setData(starterState);
  };

  return (
    <StockContext.Provider
      value={{
        products: data.products,
        salesmen: data.salesmen,
        invoices: data.invoices,
        issueRecords: data.issueRecords,
        salesRecords: data.salesRecords,
        returnRecords: data.returnRecords,
        stockHistory: data.stockHistory,
        totalProductsCount,
        totalAvailableStock,
        totalProductsIssuedToSalesmen,
        totalProductsSold,
        totalSalesAmount,
        lowStockProducts,
        salesmenPerformances,
        addProduct,
        updateProduct,
        deleteProduct,
        addSalesman,
        updateSalesman,
        deleteSalesman,
        createStockEntryInvoice,
        createProductIssueInvoice,
        createSalesInvoice,
        createProductReturnInvoice,
        getSalesmanRemainingStock,
        getSalesmanStockItems,
        resetAllData,
        importData,
        loadStarterSampleData,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};
