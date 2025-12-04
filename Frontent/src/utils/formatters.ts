// Format price from paise to rupees
export const formatPrice = (priceInPaise: number): string => {
  const rupees = priceInPaise / 100;
  return `₹${rupees.toFixed(2)}`;
};

// Format date to readable string
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format phone number
export const formatPhone = (phone: string): string => {
  if (phone.startsWith('+91')) return phone;
  return `+91-${phone}`;
};
