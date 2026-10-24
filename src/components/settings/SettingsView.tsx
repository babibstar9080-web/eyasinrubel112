import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Users,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import { exportDataAsJSON, loadStoredData } from '../../utils/storage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatSAR, formatNumber } from '../../utils/formatters';

export const SettingsView: React.FC = () => {
  const {
    products,
    salesmen,
    invoices,
    stockHistory,
    totalAvailableStock,
    totalSalesAmount,
    resetAllData,
    importData,
    loadStarterSampleData,
  } = useStock();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmSampleOpen, setConfirmSampleOpen] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const fullData = loadStoredData();
    exportDataAsJSON(fullData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const res = importData(parsed);
        if (res.success) {
          setImportMessage({
            type: 'success',
            text: 'Backup data imported successfully! All products, stock, and salesmen restored.',
          });
        } else {
          setImportMessage({
            type: 'error',
            text: res.message || 'Invalid backup file structure.',
          });
        }
      } catch (err) {
        setImportMessage({
          type: 'error',
          text: 'Failed to read backup file. Make sure it is a valid JSON file exported from Company Stock Manager.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Storage Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Persistent Local Database</h3>
            <p className="text-xs text-slate-500">
              Data is saved automatically in your browser's persistent storage on every transaction
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100">
          <div>
            <span className="text-[11px] text-slate-500">Products in Catalog</span>
            <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
              {formatNumber(products.length)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500">Salesmen</span>
            <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
              {formatNumber(salesmen.length)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500">Invoices Created</span>
            <div className="text-base font-bold font-mono text-blue-700 tabular-nums">
              {formatNumber(invoices.length)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-slate-500">Transactions Logged</span>
            <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
              {formatNumber(stockHistory.length)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Offline capable: All data persists across browser refreshes, tab restarts, and device reboots.
          </span>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Backup & Restore</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Save a copy of your company database to your computer, or restore from a previously exported backup file.
          </p>
        </div>

        {importMessage && (
          <div
            className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
              importMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {importMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{importMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Database Backup (.json)</span>
          </button>

          <label className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Restore / Import Backup</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Quick Setup / Sample Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Quick Testing / Starter Catalog</h3>
        <p className="text-xs text-slate-500">
          If you want to test how the system tracks products, van dispatches, and sales achievements, you can load realistic starter data with Saudi Riyal pricing.
        </p>

        <div>
          <button
            onClick={() => setConfirmSampleOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            Load Starter Sample Data
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/50 rounded-xl border border-red-200 p-5 shadow-xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-red-900">Danger Zone</h3>
          <p className="text-xs text-red-700 mt-0.5">
            Reset all product records, salesman allocations, and transaction history to start with a completely blank database.
          </p>
        </div>

        <div>
          <button
            onClick={() => setConfirmResetOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
          >
            Reset All Database Data
          </button>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={resetAllData}
        title="Reset All Database Data"
        message="Are you sure you want to erase all products, salesmen, sales, and audit history? This action cannot be undone unless you have exported a backup file."
        confirmLabel="Erase All Data"
        isDestructive={true}
      />

      {/* Confirm Load Sample Dialog */}
      <ConfirmDialog
        isOpen={confirmSampleOpen}
        onClose={() => setConfirmSampleOpen(false)}
        onConfirm={loadStarterSampleData}
        title="Load Starter Sample Data"
        message="This will load realistic sample products (juices, milk, tea), salesmen, issued goods, and recorded sales in Saudi Riyal (SAR). Existing data will be replaced."
        confirmLabel="Load Sample Data"
        isDestructive={false}
      />
    </div>
  );
};
