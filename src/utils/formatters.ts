/**
 * Utility functions for currency, numbers, and dates
 */

export const formatSAR = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'SAR 0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '0%';
  }
  return `${Math.round(num * 10) / 10}%`;
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
};

export const formatDateTimeDisplay = (isoString: string): string => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return isoString;
  } catch {
    return isoString;
  }
};
