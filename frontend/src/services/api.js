/**
 * API Service
 * Handles all backend communication
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
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