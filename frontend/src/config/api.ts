/**
 * API Configuration
 * Centralized API URL configuration for all API calls
 */

// Get the API URL from environment variable
// In development: Use relative paths for Vite proxy
// In production: Use full Railway backend URL
const isDevelopment = import.meta.env.DEV;
export const API_URL = isDevelopment ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3002');

/**
 * Helper function to make API calls with proper URL
 * In development: Returns relative path (e.g., /api/upload) for Vite proxy
 * In production: Returns full URL (e.g., https://backend.railway.app/api/upload)
 */
export const apiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (isDevelopment) {
    // In development, use relative paths for Vite proxy
    return cleanEndpoint;
  } else {
    // In production, use full URL
    return `${API_URL}${cleanEndpoint}`;
  }
};

// Export individual endpoints for convenience
export const API_ENDPOINTS = {
  UPLOAD: apiUrl('/api/upload'),
  DOCUMENTS: apiUrl('/api/documents'),
  DOCUMENT_BY_ID: (id: string) => apiUrl(`/api/documents/${id}`),
  DOCUMENT_PDF: (id: string) => apiUrl(`/api/documents/${id}/pdf`),
  ASK: apiUrl('/api/ask'),
  HEALTH: apiUrl('/api/health'),
};

export default API_URL;
