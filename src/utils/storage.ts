import {
  Product,
  Salesman,
  Invoice,
  ProductIssueRecord,
  SaleRecord,
  ReturnRecord,
  StockTransaction,
} from '../types';

export interface AppStateData {
  products: Product[];
  salesmen: Salesman[];
  invoices: Invoice[];
  issueRecords: ProductIssueRecord[];
  salesRecords: SaleRecord[];
  returnRecords: ReturnRecord[];
  stockHistory: StockTransaction[];
  lastUpdated: string;
}

const STORAGE_KEY = 'company_stock_manager_data_v1';

export const getEmptyState = (): AppStateData => ({
  products: [],
  salesmen: [],
  invoices: [],
  issueRecords: [],
  salesRecords: [],
  returnRecords: [],
  stockHistory: [],
  lastUpdated: new Date().toISOString(),
});

export const loadStoredData = (): AppStateData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getEmptyState();
    }
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      salesmen: Array.isArray(parsed.salesmen) ? parsed.salesmen : [],
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
      issueRecords: Array.isArray(parsed.issueRecords) ? parsed.issueRecords : [],
      salesRecords: Array.isArray(parsed.salesRecords) ? parsed.salesRecords : [],
      returnRecords: Array.isArray(parsed.returnRecords) ? parsed.returnRecords : [],
      stockHistory: Array.isArray(parsed.stockHistory) ? parsed.stockHistory : [],
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to parse stored stock data from localStorage:', err);
    return getEmptyState();
  }
};

export const saveStoredData = (data: AppStateData): void => {
  try {
    const payload = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save stock data to localStorage:', err);
  }
};

export const exportDataAsJSON = (data: AppStateData): void => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `company_stock_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
};
