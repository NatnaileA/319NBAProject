import axios from "axios";

// Central Axios client. withCredentials lets the browser send the session cookie.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
});

export default api;
