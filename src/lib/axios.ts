// utils/axiosInstance.ts

import axios from "axios";
import { getBasePath } from "@/lib/base-path";

const getClientBaseURL = () =>
  typeof window !== "undefined"
    ? `${window.location.origin}${getBasePath()}/api/v1`
    : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api/v1";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || getClientBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in requests, useful for session-based auth
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      config.baseURL = `${window.location.origin}${getBasePath()}/api/v1`;
    }
    const token = localStorage.getItem("token"); // Example for JWT
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      // window.location.href = '/login'; // Example redirect
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
