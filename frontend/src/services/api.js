import axios from "axios";

// Determine the base URL based on environment
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// Internal base URL for API calls (adds /api)
const API_BASE_URL_INTERNAL = `${API_BASE_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL_INTERNAL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getProfile: () => api.get("/auth/profile"),
};

// Voice API
export const voiceAPI = {
  createVoice: (formData) => {
    return api.post("/voices", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getMyVoice: () => api.get("/voices/mine"),
  getVoiceStatus: () => api.get("/voices/status"),
  deleteVoice: () => api.delete("/voices/mine"),
};

// Audio API
export const audioAPI = {
  generateAudio: (data) => api.post("/audio", data),
  getHistory: (limit = 50, offset = 0) =>
    api.get(`/audio/history?limit=${limit}&offset=${offset}`),
  getAudio: (id) => api.get(`/audio/${id}`),
  deleteAudio: (id) => api.delete(`/audio/${id}`),
};

export default api;
