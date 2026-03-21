/**
 * API Service
 * Handles all backend communication
 * Auth tokens are automatically attached via interceptor
 */

import axios from 'axios';
import supabase from './supabaseClient.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.warn('Failed to get auth session for API request:', err);
    }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, session may have expired — redirect to login
    if (error.response?.status === 401) {
      console.warn('Unauthorized — session may have expired');
      window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== User API =====

export const getUser = async () => {
  const response = await api.get('/user');
  return response.data;
};

export const resetProgress = async () => {
  const response = await api.post('/user/reset');
  return response.data;
};

export const getAchievements = async () => {
  const response = await api.get('/user/achievements');
  return response.data;
};

// ===== Quest API =====

export const getQuests = async (params = {}) => {
  const response = await api.get('/quests', { params });
  return response.data;
};

export const getDailyQuests = async () => {
  const response = await api.get('/quests/daily');
  return response.data;
};

export const getArchivedQuests = async () => {
  const response = await api.get('/quests/archive');
  return response.data;
};

export const getQuest = async (id) => {
  const response = await api.get(`/quests/${id}`);
  return response.data;
};

export const createQuest = async (questData) => {
  const response = await api.post('/quests', questData);
  return response.data;
};

export const updateQuest = async (id, questData) => {
  const response = await api.put(`/quests/${id}`, questData);
  return response.data;
};

export const deleteQuest = async (id) => {
  const response = await api.delete(`/quests/${id}`);
  return response.data;
};

export const completeQuest = async (id) => {
  const response = await api.post(`/quests/${id}/complete`);
  return response.data;
};

export const failQuest = async (id) => {
  const response = await api.post(`/quests/${id}/fail`);
  return response.data;
};

// ===== Item API =====

export const getItems = async (params = {}) => {
  const response = await api.get('/items', { params });
  return response.data;
};

export const getItem = async (id) => {
  const response = await api.get(`/items/${id}`);
  return response.data;
};

export const deleteItem = async (id) => {
  const response = await api.delete(`/items/${id}`);
  return response.data;
};

export const chooseItem = async (choiceId, itemData) => {
  const response = await api.post('/items/choose', { choiceId, itemData });
  return response.data;
};

export const getItemStats = async () => {
  const response = await api.get('/items/stats/summary');
  return response.data;
};

export default api;