import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const usePortalStore = create((set, get) => ({
  token: null,
  data: null,
  loading: true,
  error: null,

  loadPortal: async (token) => {
    set({ token, loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/portal/${token}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invalid portal link');
      }
      const data = await res.json();
      set({ data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Fetch helper for portal API calls
  portalFetch: async (path, options = {}) => {
    const { token } = get();
    const url = `${API_BASE}/portal/${token}${path}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  portalFetchBlob: async (path) => {
    const { token } = get();
    const url = `${API_BASE}/portal/${token}${path}`;
    return fetch(url);
  },
}));

export default usePortalStore;
