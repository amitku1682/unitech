/**
 * Validation utilities for Unitech Storefront & B2B Forms
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates an Indian mobile phone number:
 * Accepts 10 digits, optional +91, 91, or 0 prefix.
 * Starts with 6, 7, 8, or 9.
 */
export function validateIndianPhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Mobile / WhatsApp number is required." };
  }
  const clean = phone.replace(/[\s\-\(\)\.]/g, "");
  const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  if (!phoneRegex.test(clean)) {
    return { isValid: false, error: "Enter a valid 10-digit Indian mobile number (e.g. 9818141759)." };
  }
  return { isValid: true };
}

/**
 * Validates RFC-compliant email address
 */
export function validateEmail(email: string, required: boolean = true): { isValid: boolean; error?: string } {
  const trimmed = (email || "").trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: "Email address is required." };
    }
    return { isValid: true };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Enter a valid email address (e.g. billing@company.com)." };
  }
  return { isValid: true };
}

/**
 * Validates standard 6-digit Indian PIN code (100000 - 999999)
 */
export function validatePincode(pincode: string): { isValid: boolean; error?: string } {
  const trimmed = (pincode || "").trim();
  if (!trimmed) {
    return { isValid: false, error: "Pincode is required." };
  }
  if (!/^[1-9][0-9]{5}$/.test(trimmed)) {
    return { isValid: false, error: "Enter a valid 6-digit Indian PIN code (e.g. 201007)." };
  }
  return { isValid: true };
}

/**
 * Validates Indian 15-character GSTIN format:
 * 2 state digits + 5 PAN chars + 4 PAN digits + 1 PAN char + 1 entity num + 'Z' + 1 checksum
 * Example: 09AAGPU2841M1ZG
 */
export function validateGSTIN(gstin: string, required: boolean = false): { isValid: boolean; error?: string } {
  const trimmed = (gstin || "").trim().toUpperCase();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: "GSTIN is required for tax invoice credit." };
    }
    return { isValid: true };
  }
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(trimmed)) {
    return { isValid: false, error: "Enter a valid 15-character GSTIN (e.g. 09AAGPU2841M1ZG)." };
  }
  return { isValid: true };
}

/**
 * Validates text length (names, addresses, city)
 */
export function validateText(
  value: string,
  fieldName: string,
  minLength: number = 3
): { isValid: boolean; error?: string } {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters.` };
  }
  return { isValid: true };
}
