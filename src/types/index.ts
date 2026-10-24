export type UnitType = 'Pcs' | 'Box' | 'Carton' | 'Kg' | 'Pack' | 'Dozen' | 'Ltr' | 'Set' | 'Meter';

export interface Product {
  id: string;
  name: string;
  code: string; // SKU or Barcode
  purchasePrice: number; // In SAR
  salePrice: number; // In SAR
  currentStock: number; // Warehouse stock available
  unit: UnitType | string;
  category?: string;
  minStockThreshold: number; // For low-stock alerts
  createdAt: string;
  updatedAt: string;
}

export interface Salesman {
  id: string;
  name: string;
  phone: string;
  email?: string;
  area: string; // Assigned territory/region
  dateJoined: string;
  notes?: string;
  createdAt: string;
}

export type TransactionType = 
  | 'STOCK_IN'              // Stock Entry: added to warehouse
  | 'ISSUE_TO_SALESMAN'     // Issued from warehouse to salesman
  | 'SALE_RECORDED'         // Sold by salesman
  | 'RETURN_FROM_SALESMAN'; // Returned by salesman back to warehouse

export type InvoiceType = 
  | 'STOCK_ENTRY' 
  | 'PRODUCT_ISSUE' 
  | 'SALES' 
  | 'PRODUCT_RETURN';

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  quantity: number;
  purchasePrice: number; // In SAR
  salePrice: number; // In SAR
  unitPrice: number; // Primary effective unit price for line calculation
  totalPurchaseAmount: number; // quantity * purchasePrice
  totalSaleAmount: number; // quantity * salePrice
  lineTotal: number; // quantity * unitPrice
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. STK-20261023-0001
  type: InvoiceType;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  salesmanId?: string;
  salesmanName?: string;
  items: InvoiceItem[];
  totalQuantity: number;
  totalAmount: number; // Grand total amount in SAR
  totalPurchaseAmount: number; // Total at purchase price
  totalSaleAmount: number; // Total at sale price
  notes?: string;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  type: TransactionType;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  warehouseStockAfter: number;
  salesmanId?: string;
  salesmanName?: string;
  unitPrice?: number; // In SAR
  totalAmount?: number; // In SAR
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface ProductIssueRecord {
  id: string;
  date: string;
  salesmanId: string;
  salesmanName: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalAmount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  salesmanId: string;
  salesmanName: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  salePrice: number; // In SAR
  totalAmount: number; // In SAR (quantity * salePrice)
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface ReturnRecord {
  id: string;
  date: string;
  salesmanId: string;
  salesmanName: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalAmount?: number;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface SalesmanStockItem {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  totalIssued: number;
  totalSold: number;
  totalReturned: number;
  remainingStock: number; // totalIssued - totalSold - totalReturned
  totalSalesAmount: number; // Total revenue generated for this item
}

export interface SalesmanPerformance {
  salesman: Salesman;
  totalProductsIssued: number;
  totalProductsSold: number;
  totalProductsReturned: number;
  remainingStock: number;
  totalSalesAmount: number; // In SAR
  achievementRate: number; // Percentage (sold / issued * 100)
  items: SalesmanStockItem[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'inventory'
  | 'stock-entry'
  | 'salesmen'
  | 'product-issue'
  | 'sales-entry'
  | 'product-return'
  | 'achievement'
  | 'stock-history'
  | 'settings';
