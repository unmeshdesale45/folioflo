import { create } from 'zustand';
import apiClient from '../lib/axios';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (token) => set({ token, isAuthenticated: !!token }),
  setUser: (user) => set({ user }),
  updateUsername: (newUsername) => set((state) => ({ user: { ...state.user, username: newUsername } })),
  
  login: async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const { access_token } = response.data;
      set({ token: access_token, isAuthenticated: true });
      await get().fetchMe();
      return true;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  },

  register: async (email, username, password) => {
    try {
      await apiClient.post('/auth/register', { email, username, password });
      return await get().login(email, password);
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  },

  fetchMe: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      set({ user: response.data, isLoading: false });
    } catch (error) {
      console.error('Fetch me failed', error);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }
}));
