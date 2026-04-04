import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TIER_LEVELS = { starter: 1, pro: 2, enterprise: 3 };

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken'),
  isLoading: false,
  viewAsTier: null,

  isAuthenticated: () => !!get().user,
  isAdmin: () => get().user?.role === 'admin',
  tier: () => {
    const vat = get().viewAsTier;
    if (vat) return vat;
    return get().user?.subscription_tier || 'starter';
  },
  hasTier: (required) => {
    const vat = get().viewAsTier;
    if (!vat && get().user?.role === 'admin') return true;
    const current = vat || get().user?.subscription_tier || 'starter';
    return (TIER_LEVELS[current] || 0) >= (TIER_LEVELS[required] || 0);
  },
  setViewAsTier: (tier) => set({ viewAsTier: tier }),

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, accessToken: data.accessToken });
    return data.user;
  },

  register: async (fields) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, accessToken: data.accessToken });
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, accessToken: null, viewAsTier: null });
  },

  // Refresh user data from server (e.g. after tier change)
  refreshUser: async () => {
    const token = get().accessToken;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      }
    } catch { /* ignore */ }
  },

  getAccessToken: () => get().accessToken,
}));

export default useAuthStore;
