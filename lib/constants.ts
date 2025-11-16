/**
 * App-wide constants
 */

export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export const ESTIMATE_STATUSES = {
  OPEN: 'open',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
} as const;

export const PAYMENT_TERMS = [
  { label: 'Due on receipt', value: 'due_on_receipt' },
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 60', value: 'net_60' },
  { label: 'Net 90', value: 'net_90' },
  { label: 'Custom', value: 'custom' },
] as const;

export const EXPENSE_CATEGORIES = [
  'Advertising',
  'Auto & Travel',
  'Bank Fees',
  'Communication',
  'Consulting',
  'Depreciation',
  'Insurance',
  'Legal & Professional',
  'Meals & Entertainment',
  'Office Supplies',
  'Rent',
  'Repairs & Maintenance',
  'Software & Subscriptions',
  'Taxes & Licenses',
  'Utilities',
  'Other',
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'PayPal',
  'Stripe',
  'Venmo',
  'Other',
] as const;

export const DEFAULT_CURRENCY = 'USD';

export const DEFAULT_TAX_RATE = 0; // 0% by default

export const IRS_MILEAGE_RATE = 0.67; // 2024 IRS standard mileage rate (update annually)

export const APP_NAME = 'Siloq';

export const SUPPORT_EMAIL = 'support@siloq.app';
