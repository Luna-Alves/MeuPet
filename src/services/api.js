import axios from "axios";

const api = axios.create({
  baseURL: "/api", // CRA proxy → 5500
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // salva no login/cadastro
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
