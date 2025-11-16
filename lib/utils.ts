import { clsx, type ClassValue } from 'clsx';

/**
 * Merge className strings with clsx
 * Useful for conditional classes in NativeWind
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'USD'
): string {
  if (amount === null || amount === undefined) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'long' | 'medium' = 'medium'
): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { month: 'numeric', day: 'numeric', year: '2-digit' }
      : format === 'long'
      ? { month: 'long', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Generate a unique invoice number
 */
export function generateInvoiceNumber(prefix: string = 'INV', count: number): string {
  const paddedNumber = String(count + 1).padStart(4, '0');
  return `${prefix}${paddedNumber}`;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(
  lineItems: Array<{ quantity: number; rate: number }>,
  discount: number = 0,
  taxRate: number = 0
) {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.rate;
  }, 0);

  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  return {
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    total,
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
