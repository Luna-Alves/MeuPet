// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api", // funciona via proxy do CRA para http://localhost:5500
});

// Anexa o token em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Opcional: tratar 401 globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
