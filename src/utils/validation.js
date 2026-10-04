// Form validation and spam protection utilities

// Anti-spam throttling rate limiter
const lastActionTimes = new Map();

export const checkRateLimit = (actionKey, cooldownMs = 1500) => {
  const now = Date.now();
  const lastTime = lastActionTimes.get(actionKey) || 0;
  if (now - lastTime < cooldownMs) {
    return false; // Throttled
  }
  lastActionTimes.set(actionKey, now);
  return true;
};

// Validate name
export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return 'Please enter a valid first name (at least 2 letters).';
  }
  if (/[<>{}]/.test(name)) {
    return 'Invalid characters detected.';
  }
  return null;
};

// Validate birthdate (User must be 18+)
export const validateAge = (birthdate) => {
  if (!birthdate) return 'Please enter your birth date.';
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (isNaN(age) || age < 18) {
    return 'You must be at least 18 years old to join Cufy.';
  }
  if (age > 110) {
    return 'Please enter a valid birth year.';
  }
  return null;
};

// Validate email address
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Please enter your email address.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  const disposableDomains = ['mailinator.com', '10minutemail.com', 'tempmail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return 'Temporary email addresses are not permitted.';
  }
  return null;
};

// Validate photo selection
export const validatePhotos = (photos) => {
  if (!photos || photos.length === 0) {
    return 'Please upload or select at least 1 photo to continue.';
  }
  return null;
};
