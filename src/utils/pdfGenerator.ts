import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFResult {
  blob: Blob;
  file: File;
}

/**
 * Captures the HTML invoice element and generates a single-page A4 PDF.
 */
export async function generateInvoicePDF(element: HTMLElement, filename: string): Promise<PDFResult> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/png');

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8; // mm

  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  let renderWidth = availableWidth;
  let renderHeight = (canvas.height * availableWidth) / canvas.width;

  // Scale down to guarantee fitting exactly on 1 page if needed
  if (renderHeight > availableHeight) {
    const scale = availableHeight / renderHeight;
    renderWidth = availableWidth * scale;
    renderHeight = availableHeight;
  }

  const posX = (pageWidth - renderWidth) / 2;
  const posY = margin;

  pdf.addImage(imgData, 'PNG', posX, posY, renderWidth, renderHeight, undefined, 'FAST');

  const blob = pdf.output('blob');
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const file = new File([blob], safeFilename, { type: 'application/pdf' });

  return { blob, file };
}

/**
 * Triggers a browser download of the PDF blob.
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Native mobile sharing using Web Share API with PDF file or graceful download fallback.
 */
export async function shareInvoicePDF(
  invoiceNumber: string,
  element: HTMLElement
): Promise<{ success: boolean; method?: 'file' | 'text' | 'download'; message?: string }> {
  const filename = `Invoice_${invoiceNumber}.pdf`;

  try {
    const { blob, file } = await generateInvoicePDF(element, filename);

    // 1. Check if navigator can share files (e.g. modern Android Chrome, iOS Safari)
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `Invoice ${invoiceNumber}`,
        text: `Official Company Invoice #${invoiceNumber}`,
      });
      return { success: true, method: 'file' };
    }

    // 2. Check if navigator.share works for text/title
    if (typeof navigator !== 'undefined' && navigator.share) {
      // Trigger download as well so user has the file
      downloadPDF(blob, filename);
      await navigator.share({
        title: `Invoice ${invoiceNumber}`,
        text: `Official Company Invoice #${invoiceNumber} (Saudi Riyal - SAR)`,
      });
      return { success: true, method: 'text' };
    }

    // 3. Fallback: direct PDF download
    downloadPDF(blob, filename);
    return { success: true, method: 'download' };
  } catch (err: any) {
    if (err && err.name === 'AbortError') {
      return { success: false, message: 'Share was cancelled by user.' };
    }
    console.error('PDF sharing error:', err);
    return { success: false, message: err?.message || 'Sharing failed.' };
  }
}
