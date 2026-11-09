/**
 * services/api.js — Clean API client for Ahmedabad Real Estate CRM.
 * Calls backend endpoints via Vite reverse-proxy or direct relative paths.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `API request failed: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // ── Projects ──
  getProjects: async () => {
    return request('/projects/');
  },

  getProjectById: async (id) => {
    return request(`/projects/${id}`);
  },

  // ── AI Chat ──
  sendChatMessage: async ({ message, language = 'en', projectId = null, leadId = null }) => {
    return request('/chat/', {
      method: 'POST',
      body: JSON.stringify({
        message,
        language,
        project_id: projectId,
        lead_id: leadId,
      }),
    });
  },

  // ── Site Visit Scheduling ──
  getAvailableSlots: async (projectId, dateStr) => {
    return request(`/visits/slots?project_id=${projectId}&date=${dateStr}`);
  },

  bookPublicVisit: async ({ name, phone, projectId, slotDatetime, executiveId = null }) => {
    return request('/visits/book-public', {
      method: 'POST',
      body: JSON.stringify({
        name,
        phone,
        project_id: projectId,
        slot_datetime: slotDatetime,
        executive_id: executiveId,
      }),
    });
  },

  // ── Auth & Staff ──
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async (token) => {
    return request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getExecutives: async (token) => {
    return request('/auth/executives', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── Leads Management ──
  getLeads: async (token, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.source) params.append('source', filters.source);
    if (filters.projectId) params.append('project_id', filters.projectId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/leads/${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getLeadById: async (id, token) => {
    return request(`/leads/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  updateLead: async (id, data, token) => {
    return request(`/leads/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // ── Site Visits Management ──
  getVisits: async (token, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.projectId) params.append('project_id', filters.projectId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/visits/${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  updateVisit: async (id, data, token) => {
    return request(`/visits/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // ── Fact Sheets Knowledge Base (Admin) ──
  getFactSheets: async (token, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.projectId) params.append('project_id', filters.projectId);
    if (filters.category) params.append('category', filters.category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/fact-sheets/${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  createFactSheet: async (data, token) => {
    return request('/fact-sheets/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  updateFactSheet: async (id, data, token) => {
    return request(`/fact-sheets/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  deleteFactSheet: async (id, token) => {
    return request(`/fact-sheets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── Analytics ──
  getAnalyticsOverview: async (token) => {
    return request('/analytics/overview', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getLeadSourcesAnalytics: async (token) => {
    return request('/analytics/lead-sources', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getVisitStatusAnalytics: async (token) => {
    return request('/analytics/visit-status', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getConversionFunnel: async (token) => {
    return request('/analytics/conversion-funnel', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

