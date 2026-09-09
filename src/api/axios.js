import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const ACCESS_KEY = "lms_access_token";
const REFRESH_KEY = "lms_refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Attach the current access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  //console.log(token)
  if (token) {
    console.log("token ", token);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request fails with 401 (expired/invalid access token), try exactly
// once to refresh using the refresh token, then replay the original request.
// Concurrent 401s while a refresh is already in flight all wait on the same
// refresh promise instead of firing N parallel refresh calls.
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  // Plain axios call (not the `api` instance) so this request never
  // recurses back into this same interceptor.
  const response = await axios.post(`${BASE_URL}/auth/refresh`, {
    refreshToken,
  });
  const { accessToken, refreshToken: newRefreshToken } = response.data;
  tokenStore.set(accessToken, newRefreshToken);
  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise || performRefresh();
        const newAccessToken = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        tokenStore.clear();
        window.location.assign("/login");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
