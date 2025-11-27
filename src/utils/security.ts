import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input sanitization utilities
export const sanitize = {
  // Sanitize HTML content
  html: (input: string): string => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['class'],
    });
  },

  // Sanitize plain text (remove HTML tags)
  text: (input: string): string => {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  },

  // Sanitize URLs
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  // Sanitize file names
  fileName: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  },

  // Remove SQL injection patterns
  sql: (input: string): string => {
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/gi,
      /(exec(\s|\+)+(s|x)p\w+)/gi,
      /union[\s\w]*select/gi,
      /select[\s\w]*from/gi,
      /insert[\s\w]*into/gi,
      /delete[\s\w]*from/gi,
      /update[\s\w]*set/gi,
      /drop[\s\w]*table/gi,
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  },
};

// Validation schemas using Zod
export const validationSchemas = {
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  
  teamName: z
    .string()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Team name contains invalid characters'),
  
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  
  url: z
    .string()
    .url('Invalid URL format')
    .refine(url => ['http:', 'https:'].includes(new URL(url).protocol), 
      'Only HTTP and HTTPS URLs are allowed'),
  
  fileUpload: z
    .object({
      name: z.string().max(255, 'File name too long'),
      size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
      type: z.string().refine(
        type => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
        'Invalid file type'
      ),
    }),
  
  searchQuery: z
    .string()
    .max(200, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-_.,!?]+$/, 'Search query contains invalid characters'),
};

// CSRF token management
export const csrfToken = {
  generate: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },
  
  store: (token: string): void => {
    sessionStorage.setItem('csrf_token', token);
    // Also set as meta tag for forms
    let metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      document.head.appendChild(metaTag);
    }
    metaTag.content = token;
  },
  
  get: (): string | null => {
    return sessionStorage.getItem('csrf_token');
  },
  
  validate: (token: string): boolean => {
    const storedToken = csrfToken.get();
    return storedToken !== null && storedToken === token;
  },
  
  clear: (): void => {
    sessionStorage.removeItem('csrf_token');
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.remove();
    }
  },
};

// Rate limiting for client-side
export const rateLimiter = {
  create: (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, number[]>();
    
    return {
      isAllowed: (identifier: string): boolean => {
        const now = Date.now();
        const userRequests = requests.get(identifier) || [];
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(time => now - time < windowMs);
        
        if (validRequests.length >= maxRequests) {
          return false;
        }
        
        validRequests.push(now);
        requests.set(identifier, validRequests);
        return true;
      },
      
      getRemainingRequests: (identifier: string): number => {
        const now = Date.now();
        const userRequests = requests.get(identifier) || [];
        const validRequests = userRequests.filter(time => now - time < windowMs);
        return Math.max(0, maxRequests - validRequests.length);
      },
      
      getResetTime: (identifier: string): number => {
        const userRequests = requests.get(identifier) || [];
        if (userRequests.length === 0) return 0;
        
        const oldestRequest = Math.min(...userRequests);
        return oldestRequest + windowMs;
      },
    };
  },
};

// Content Security Policy helpers
export const csp = {
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },
  
  setNonce: (nonce: string): void => {
    // Store nonce for inline scripts/styles
    (window as any).__CSP_NONCE__ = nonce;
  },
  
  getNonce: (): string | undefined => {
    return (window as any).__CSP_NONCE__;
  },
};

// Secure storage utilities
export const secureStorage = {
  // Encrypt data before storing (simple XOR encryption for demo)
  encrypt: (data: string, key: string): string => {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result);
  },
  
  // Decrypt data after retrieving
  decrypt: (encryptedData: string, key: string): string => {
    try {
      const data = atob(encryptedData);
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      return '';
    }
  },
  
  // Secure localStorage wrapper
  setItem: (key: string, value: string, encryptionKey?: string): void => {
    const dataToStore = encryptionKey 
      ? secureStorage.encrypt(value, encryptionKey)
      : value;
    localStorage.setItem(key, dataToStore);
  },
  
  getItem: (key: string, encryptionKey?: string): string | null => {
    const storedData = localStorage.getItem(key);
    if (!storedData) return null;
    
    return encryptionKey 
      ? secureStorage.decrypt(storedData, encryptionKey)
      : storedData;
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
};

// Input validation middleware
export const validateInput = <T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message),
      };
    }
    return {
      success: false,
      errors: ['Validation failed'],
    };
  }
};

// Security headers checker
export const checkSecurityHeaders = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy',
    ];
    
    fetch(window.location.href, { method: 'HEAD' })
      .then(response => {
        const missingHeaders = requiredHeaders.filter(
          header => !response.headers.has(header)
        );
        
        if (missingHeaders.length > 0) {
          console.warn('Missing security headers:', missingHeaders);
        }
      })
      .catch(console.error);
  }
};

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');
  
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Include special characters');
  
  if (password.length >= 12) score += 1;
  
  return { score, feedback };
};