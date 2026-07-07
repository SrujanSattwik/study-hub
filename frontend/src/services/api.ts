import axios, { InternalAxiosRequestConfig } from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Required for httpOnly refresh-token cookie
});

// Request Interceptor: Attach access token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("studyhub_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Attempt silent token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    const status = error.response?.status;
    const isRetry = originalRequest?._retry ?? false;
    const isRefreshUrl =
      originalRequest?.url?.includes("/auth/refresh") ?? false;
    const isLoginUrl = originalRequest?.url?.includes("/auth/login") ?? false;

    if (
      status === 401 &&
      !isRetry &&
      !isRefreshUrl &&
      !isLoginUrl &&
      originalRequest
    ) {
      originalRequest._retry = true;

      try {
        // httpOnly cookie is sent automatically via withCredentials
        const refreshRes = await api.post<{ access_token: string }>(
          "/auth/refresh",
        );
        const newToken = refreshRes.data.access_token;
        localStorage.setItem("studyhub_token", newToken);

        // Retry the original request with the new token
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh token expired or invalid — clear session and redirect
        localStorage.removeItem("studyhub_token");
        localStorage.removeItem("studyhub_user");

        if (
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register") &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
