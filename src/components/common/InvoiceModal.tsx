import React, { useRef, useState } from 'react';
import {
  Printer,
  Share2,
  Download,
  X,
  FileText,
  Building2,
  CheckCircle2,
  Percent,
  Tag,
  Loader2,
} from 'lucide-react';
import { Invoice, InvoiceType } from '../../types';
import { formatSAR, formatNumber, formatDateDisplay, formatDateTimeDisplay } from '../../utils/formatters';
import { generateInvoicePDF, downloadPDF, shareInvoicePDF } from '../../utils/pdfGenerator';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const invoiceTypeLabels: Record<InvoiceType, { title: string; subtitle: string; badgeColor: string }> = {
  STOCK_ENTRY: {
    title: 'STOCK ENTRY INVOICE',
    subtitle: 'Warehouse Stock Intake & Valuation',
    badgeColor: 'bg-blue-600 text-white',
  },
  PRODUCT_ISSUE: {
    title: 'SALESMAN STOCK ISSUE INVOICE',
    subtitle: 'Van Allocation & Field Custody Voucher',
    badgeColor: 'bg-indigo-600 text-white',
  },
  SALES: {
    title: 'SALES INVOICE',
    subtitle: 'Commercial Delivery & Customer Sale',
    badgeColor: 'bg-emerald-600 text-white',
  },
  PRODUCT_RETURN: {
    title: 'PRODUCT RETURN INVOICE',
    subtitle: 'Warehouse Restock & Return Voucher',
    badgeColor: 'bg-amber-600 text-white',
  },
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const invoicePageRef = useRef<HTMLDivElement>(null);

  // Invoice tax & discount configuration states
  const [includeVat, setIncludeVat] = useState<boolean>(false); // 15% KSA VAT
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!invoice) return null;

  const meta = invoiceTypeLabels[invoice.type] || {
    title: 'INVOICE',
    subtitle: 'Official Inventory Document',
    badgeColor: 'bg-slate-800 text-white',
  };

  const parsedDiscount = Math.max(0, parseFloat(discountAmount) || 0);

  // Calculate Subtotal based on invoice type
  const subtotal = invoice.type === 'STOCK_ENTRY'
    ? invoice.totalPurchaseAmount
    : invoice.totalAmount;

  const discountedSubtotal = Math.max(0, subtotal - parsedDiscount);
  const vatAmount = includeVat ? discountedSubtotal * 0.15 : 0;
  const grandTotal = discountedSubtotal + vatAmount;

  // Adaptive density based on number of product rows to guarantee single A4 page fit
  const rowCount = invoice.items.length;
  const isCompact = rowCount > 6 && rowCount <= 14;
  const isUltraCompact = rowCount > 14;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Direct Print Action (isolates only the invoice in A4 format)
  const handlePrint = () => {
    window.print();
  };

  // 2. Download PDF Action
  const handleDownloadPDF = async () => {
    if (!invoicePageRef.current) return;
    setIsExporting(true);
    try {
      const filename = `Invoice_${invoice.invoiceNumber}.pdf`;
      const { blob } = await generateInvoicePDF(invoicePageRef.current, filename);
      downloadPDF(blob, filename);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to generate PDF. Using print dialog.');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Native Share Action
  const handleShare = async () => {
    if (!invoicePageRef.current) return;
    setIsExporting(true);
    try {
      const result = await shareInvoicePDF(invoice.invoiceNumber, invoicePageRef.current);
      if (result.success) {
        if (result.method === 'file') {
          showToast('Invoice PDF shared successfully!');
        } else if (result.method === 'text') {
          showToast('Shared via device dialog & PDF saved!');
        } else {
          showToast('Invoice PDF downloaded to device!');
        }
      } else if (result.message && !result.message.includes('cancelled')) {
        showToast(result.message);
      }
    } catch (err) {
      console.error('Share error:', err);
      showToast('Share failed. Please use Download PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col max-h-[96vh] overflow-hidden">
        {/* Top Control Header Toolbar (Hidden during print) */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">
                Invoice #{invoice.invoiceNumber}
              </span>
              <span className="text-[10px] text-slate-500 ml-2 hidden sm:inline">
                A4 Single-Page Document
              </span>
            </div>
          </div>

          {/* Quick VAT & Discount config switches */}
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-[11px] font-semibold text-slate-700">15% VAT</span>
            </label>

            <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-md">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-slate-500">Disc:</span>
              <input
                type="number"
                min="0"
                step="1"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="0"
                className="w-14 text-[11px] font-mono text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-400">SAR</span>
            </div>

            {/* Action Buttons: Print, Download, Share */}
            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
                title="Print only this invoice on A4"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors"
                title="Download single-page PDF"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-600" />}
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                title="Share invoice PDF with customer or salesman"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors ml-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Temporary Feedback Toast */}
        {toastMessage && (
          <div className="bg-slate-900 text-white text-xs px-4 py-2 text-center animate-in fade-in duration-150 no-print">
            {toastMessage}
          </div>
        )}

        {/* Printable Invoice Wrapper (A4 Proportions) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/50 flex justify-center">
          {/* A4 Document Canvas Container */}
          <div
            id="printable-invoice-root"
            ref={invoicePageRef}
            className="w-full max-w-[210mm] min-h-[280mm] bg-white p-6 sm:p-8 shadow-md border border-slate-200 rounded-xs flex flex-col justify-between text-slate-900"
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* 1. Header: Logo, Company Name & Document Badge */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-none">
                      Company Stock Manager
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600 mt-1">
                      Commercial Inventory & Logistics Distribution
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Kingdom of Saudi Arabia (KSA) · Tax & VAT Compliant
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded ${meta.badgeColor}`}>
                    {meta.title}
                  </span>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1.5">
                    #{invoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Date: {formatDateDisplay(invoice.date)}
                  </div>
                </div>
              </div>

              {/* 2. Metadata Strip: Salesman & Transaction Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Invoice Type
                  </span>
                  <span className="font-semibold text-slate-800">
                    {meta.subtitle}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {invoice.salesmanName ? 'Authorized Salesman' : 'Origin / Warehouse'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {invoice.salesmanName || 'Main Company Warehouse'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Time Issued
                  </span>
                  <span className="font-mono text-slate-700">
                    {formatDateTimeDisplay(invoice.timestamp)}
                  </span>
                </div>
              </div>

              {/* 3. Product Items Table (Adaptive Density to fit exactly 1 page) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden mt-3">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                      <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} w-8`}>#</th>
                      <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'}`}>
                        Product Description & Code
                      </th>
                      <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} text-center w-24`}>
                        Qty
                      </th>
                      {invoice.type === 'STOCK_ENTRY' ? (
                        <>
                          <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} text-right w-28`}>
                            Cost (SAR)
                          </th>
                          <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} text-right w-28`}>
                            Total Cost
                          </th>
                          <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} text-right w-28`}>
                            Retail (SAR)
                          </th>
                        </>
                      ) : (
                        <>
                          <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} text-right w-28`}>
                            Unit Price
                          </th>
                          <th className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2'} text-right w-32`}>
                            Line Total (SAR)
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className={`px-3 text-slate-400 font-mono text-[10px] ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2.5'}`}>
                          {idx + 1}
                        </td>
                        <td className={`px-3 ${isUltraCompact ? 'py-1' : isCompact ? 'py-1.5' : 'py-2.5'}`}>
                          <div className={`font-bold text-slate-900 ${isUltraCompact ? 'text-[11px]' : 'text-xs'}`}>
                            {item.productName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Code: {item.productCode} · Unit: {item.unit}
                          </div>
                        </td>
                        <td className={`px-3 text-center font-mono font-bold text-slate-900 tabular-nums ${isUltraCompact ? 'text-[11px] py-1' : isCompact ? 'text-xs py-1.5' : 'text-xs py-2.5'}`}>
                          {formatNumber(item.quantity)} {item.unit}
                        </td>

                        {invoice.type === 'STOCK_ENTRY' ? (
                          <>
                            <td className={`px-3 text-right font-mono tabular-nums text-slate-700 ${isUltraCompact ? 'text-[11px] py-1' : 'text-xs py-2'}`}>
                              {formatSAR(item.purchasePrice)}
                            </td>
                            <td className={`px-3 text-right font-mono tabular-nums font-bold text-slate-900 ${isUltraCompact ? 'text-[11px] py-1' : 'text-xs py-2'}`}>
                              {formatSAR(item.totalPurchaseAmount)}
                            </td>
                            <td className={`px-3 text-right font-mono tabular-nums text-blue-700 ${isUltraCompact ? 'text-[11px] py-1' : 'text-xs py-2'}`}>
                              {formatSAR(item.salePrice)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className={`px-3 text-right font-mono tabular-nums text-slate-700 ${isUltraCompact ? 'text-[11px] py-1' : 'text-xs py-2'}`}>
                              {formatSAR(item.unitPrice)}
                            </td>
                            <td className={`px-3 text-right font-mono tabular-nums font-bold text-slate-900 ${isUltraCompact ? 'text-[11px] py-1' : 'text-xs py-2'}`}>
                              {formatSAR(item.lineTotal)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Financial Calculations & Notes Block */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-start gap-4 pt-2 avoid-break">
                {/* Notes Column */}
                <div className="text-xs text-slate-600 max-w-sm">
                  {invoice.notes ? (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 uppercase text-[10px] block">
                        Remarks & Special Instructions:
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {invoice.notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      No additional notes. Computer generated verified transaction.
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">
                    Currency: Saudi Riyal (SAR). All inventory movements are automatically calculated and recorded.
                  </p>
                </div>

                {/* Totals Table */}
                <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                    <span>Total Quantity:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {formatNumber(invoice.totalQuantity)} units
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {formatSAR(subtotal)}
                    </span>
                  </div>

                  {parsedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono tabular-nums">
                        - {formatSAR(parsedDiscount)}
                      </span>
                    </div>
                  )}

                  {includeVat && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT (15%):</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatSAR(vatAmount)}
                      </span>
                    </div>
                  )}

                  {invoice.type === 'STOCK_ENTRY' && (
                    <div className="flex justify-between text-blue-700 text-[11px]">
                      <span>Total Retail Valuation:</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatSAR(invoice.totalSaleAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm py-2 px-3 bg-blue-600 text-white rounded font-bold mt-1">
                    <span>GRAND TOTAL:</span>
                    <span className="font-mono tabular-nums">
                      {formatSAR(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Signatures & Footer Area */}
            <div className="mt-8 pt-4 border-t border-slate-200 avoid-break">
              <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
                <div>
                  <div className="border-b border-slate-400 w-32 mx-auto mb-1 h-8"></div>
                  <span className="font-bold text-[11px] block">Prepared by (Manager)</span>
                  <span className="text-[10px] text-slate-400">Inventory Operations</span>
                </div>

                <div>
                  <div className="border-b border-slate-400 w-32 mx-auto mb-1 h-8"></div>
                  <span className="font-bold text-[11px] block">Received by (Salesman)</span>
                  <span className="text-[10px] text-slate-400">Custody Acknowledgement</span>
                </div>

                <div>
                  <div className="w-16 h-12 border-2 border-dashed border-slate-300 rounded mx-auto mb-1 flex items-center justify-center text-[9px] text-slate-400 uppercase">
                    Official Stamp
                  </div>
                  <span className="font-bold text-[11px] block">Company Seal</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 mt-4 pt-2 border-t border-slate-100">
                Company Stock Manager · Page 1 of 1 · Generated on {new Date().toLocaleDateString('en-US')}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between no-print">
          <span className="text-xs text-slate-500">
            A4 Print Optimized · Saudi Riyal (SAR)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleShare}
              disabled={isExporting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>Share Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors ml-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
