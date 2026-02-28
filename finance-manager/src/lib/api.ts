import axios from "axios"

export const api = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL || "https://fastapi-0tu0.onrender.com",
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
})
