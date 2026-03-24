import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY   = "jd_token";
const REFRESH_KEY = "jd_refresh";
const USER_KEY    = "jd_user";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ── Request interceptor — attach JWT ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — auto refresh on 401 ──
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;

    // If 401 and we haven't already retried
    if (err.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem(REFRESH_KEY);

      if (!refreshToken) {
        _forceLogout();
        return Promise.reject(new Error("Session expired. Please login again."));
      }

      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }).catch(e => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post("/api/auth/refresh", {
          refresh_token: refreshToken,
        });
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(REFRESH_KEY, data.refresh_token);
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        _forceLogout();
        return Promise.reject(new Error("Session expired. Please login again."));
      } finally {
        isRefreshing = false;
      }
    }

    const msg = err.response?.data?.detail || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);

function _forceLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("jd:unauthorized"));

  // 👉 ADD THIS LINE
  window.location.href = "/login";
}
// ── Auth ──
export const loginUser = (username, password) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  return axios
    .post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((r) => r.data);
};

export const getMe = () => api.get("/auth/me").then((r) => r.data);

// ── Jobs ──
export const classifyJob  = (p)        => api.post("/jobs/classify", p).then(r => r.data);
export const getHistory   = (limit=20) => api.get("/jobs/history", { params:{limit} }).then(r => r.data);

// ── Analysis ──
export const getStats       = ()    => api.get("/analysis/stats").then(r => r.data);
export const getTrends      = (d=30) => api.get("/analysis/trends", { params:{days:d} }).then(r => r.data);
export const getTopKeywords = (cat)  => api.get("/analysis/top-keywords", { params: cat?{category:cat}:{} }).then(r => r.data);

// ── Health ──
export const getHealth = () => api.get("/health").then(r => r.data);

export default api;
