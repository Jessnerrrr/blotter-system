// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Generic fetch function with error handling
const apiFetch = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      const errorObj = new Error(error.message || 'API request failed');
      errorObj.response = { data: error };  // Attach response data for detailed error info
      throw errorObj;
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== CASES API ====================
export const casesAPI = {
  // Get all cases
  getAll: () => apiFetch('/cases'),

  // Get single case by ID
  getById: (id) => apiFetch(`/cases/${id}`),

  // Create new case
  create: (caseData) => 
    apiFetch('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    }),

  // Update case
  update: (id, caseData) =>
    apiFetch(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    }),

  // Delete case
  delete: (id) =>
    apiFetch(`/cases/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== SUMMONS API ====================
export const summonsAPI = {
  // Get all summons
  getAll: () => apiFetch('/summons'),

  // Get single summons by ID
  getById: (id) => apiFetch(`/summons/${id}`),

  // Create new summons
  create: (summonsData) =>
    apiFetch('/summons', {
      method: 'POST',
      body: JSON.stringify(summonsData),
    }),

  // Update summons
  update: (id, summonsData) =>
    apiFetch(`/summons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(summonsData),
    }),

  // Delete summons
  delete: (id) =>
    apiFetch(`/summons/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== CURFEWS API ====================
export const curfewsAPI = {
  // Get all curfew violations
  getAll: () => apiFetch('/curfews'),

  // Get single curfew violation by ID
  getById: (id) => apiFetch(`/curfews/${id}`),

  // Create new curfew violation
  create: (curfewData) =>
    apiFetch('/curfews', {
      method: 'POST',
      body: JSON.stringify(curfewData),
    }),

  // Update curfew violation
  update: (id, curfewData) =>
    apiFetch(`/curfews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(curfewData),
    }),

  // Delete curfew violation
  delete: (id) =>
    apiFetch(`/curfews/${id}`, {
      method: 'DELETE',
    }),
};

// ==================== BLACKLIST API ====================
export const blacklistAPI = {
  // Get all blacklist entries
  getAll: () => apiFetch('/blacklist'),

  // Get single blacklist entry by ID
  getById: (id) => apiFetch(`/blacklist/${id}`),

  // Create new blacklist entry
  create: (blacklistData) =>
    apiFetch('/blacklist', {
      method: 'POST',
      body: JSON.stringify(blacklistData),
    }),

  // Update blacklist entry
  update: (id, blacklistData) =>
    apiFetch(`/blacklist/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blacklistData),
    }),

  // Delete blacklist entry
  delete: (id) =>
    apiFetch(`/blacklist/${id}`, {
      method: 'DELETE',
    }),
};

export const residentsAPI = {
  search: (query) => apiFetch(`/residents/search?q=${encodeURIComponent(query)}`),
  getById: (id) => apiFetch(`/residents/${id}`),
  getAgeByName: (name) => apiFetch(`/residents/get-age-by-name?name=${encodeURIComponent(name)}`),
};

export const personAPI = {
  getPersonByName: (name) => apiFetch(`/person/get-person-by-name?name=${encodeURIComponent(name)}`),
};

export default {
  cases: casesAPI,
  summons: summonsAPI,
  curfews: curfewsAPI,
  blacklist: blacklistAPI,
  residents: residentsAPI,
  person: personAPI,
};
