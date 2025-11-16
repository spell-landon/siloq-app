export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

export const validatePositiveNumber = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

export const validateNonNegativeNumber = (
  value: number | string
): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= 0;
};

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation - at least 10 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10;
};

export const sanitizeNumberInput = (value: string): string => {
  // Remove non-numeric characters except decimal point and minus
  let sanitized = value.replace(/[^0-9.-]/g, '');

  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Ensure minus only at the beginning
  const minusCount = (sanitized.match(/-/g) || []).length;
  if (minusCount > 0) {
    sanitized = (sanitized[0] === '-' ? '-' : '') + sanitized.replace(/-/g, '');
  }

  return sanitized;
};

export const enforcePositiveNumber = (value: string): string => {
  // Remove negative sign
  return value.replace(/-/g, '');
};

export const validateZipCode = (zip: string): boolean => {
  // Basic US ZIP code validation (5 digits or 5+4 format)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

export const validateTaxRate = (rate: number | string): boolean => {
  const num = typeof rate === 'string' ? parseFloat(rate) : rate;
  return !isNaN(num) && num >= 0 && num <= 100;
};

export const validateTaxId = (taxId: string): boolean => {
  // Basic EIN validation (XX-XXXXXXX format)
  // Also accepts just numbers
  const taxIdRegex = /^\d{2}-?\d{7}$/;
  const digitsOnly = taxId.replace(/\D/g, '');
  return taxIdRegex.test(taxId) || digitsOnly.length === 9;
};
