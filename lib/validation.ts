// Comprehensive validation utilities for all form inputs

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation with proper regex
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email.trim()) {
    return { isValid: false, error: "Email is required" };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  
  return { isValid: true };
}

// Organization name validation
export function validateOrganizationName(name: string): ValidationResult {
  if (!name.trim()) {
    return { isValid: false, error: "Organization name is required" };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: "Organization name must be at least 2 characters" };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: "Organization name must be less than 100 characters" };
  }
  
  return { isValid: true };
}

// URL validation
export function validateUrl(url: string, required: boolean = false): ValidationResult {
  if (!url.trim()) {
    return required 
      ? { isValid: false, error: "URL is required" }
      : { isValid: true };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Please enter a valid URL (e.g., https://example.com)" };
  }
}

// Widget slug validation
export function validateSlug(slug: string): ValidationResult {
  if (!slug.trim()) {
    return { isValid: false, error: "Widget slug is required" };
  }
  
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { isValid: false, error: "Slug can only contain lowercase letters, numbers, and hyphens" };
  }
  
  if (slug.length < 3) {
    return { isValid: false, error: "Slug must be at least 3 characters" };
  }
  
  if (slug.length > 50) {
    return { isValid: false, error: "Slug must be less than 50 characters" };
  }
  
  return { isValid: true };
}

// Donation amount validation
export function validateDonationAmount(amount: string): ValidationResult {
  if (!amount.trim()) {
    return { isValid: false, error: "Amount is required" };
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: "Please enter a valid number" };
  }
  
  if (numAmount < 1) {
    return { isValid: false, error: "Minimum donation amount is $1.00" };
  }
  
  if (numAmount > 10000) {
    return { isValid: false, error: "Maximum donation amount is $10,000.00" };
  }
  
  return { isValid: true };
}

// Phone number validation
export function validatePhone(phone: string, required: boolean = false): ValidationResult {
  if (!phone.trim()) {
    return required 
      ? { isValid: false, error: "Phone number is required" }
      : { isValid: true };
  }
  
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: "Please enter a valid phone number" };
  }
  
  return { isValid: true };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" };
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" };
  }
  
  return { isValid: true };
}

// Generic text field validation
export function validateTextField(
  value: string, 
  fieldName: string, 
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  } = {}
): ValidationResult {
  const { required = false, minLength = 0, maxLength = 1000 } = options;
  
  if (!value.trim() && required) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (value.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (value.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  return { isValid: true };
}

// Form validation helper
export function validateForm(fields: Record<string, ValidationResult>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  let isValid = true;
  
  Object.entries(fields).forEach(([fieldName, result]) => {
    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });
  
  return { isValid, errors };
}