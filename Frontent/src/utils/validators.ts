// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (10-digit number)
export const isValidPhone = (phone: string): boolean => {
  // Remove spaces, hyphens, plus signs
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  // Remove country code if present (91 for India)
  const phoneWithoutCountryCode = cleanPhone.replace(/^91/, '');
  // Check if it's exactly 10 digits
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phoneWithoutCountryCode);
};

// Password validation (min 8 characters)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

// Required field validation
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};
