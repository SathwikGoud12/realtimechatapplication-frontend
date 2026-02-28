import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const API = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // sends the refreshToken cookie automatically
});

// ── Request Interceptor: attach access token from localStorage ────────────────
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 → try refresh → retry ───────────────────
let isRefreshing = false;
let failedQueue = []; // queue requests that came in while refreshing

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
}

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 and if we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            // If a refresh is already in flight, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                        return API(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call the refresh endpoint — refreshToken cookie is sent automatically
                const res = await axios.post(
                    `${BASE_URL}/api/v1/user/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.accessToken;
                localStorage.setItem("token", newAccessToken);

                // Update the default header for future requests
                API.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

                // Unblock the queue
                processQueue(null, newAccessToken);

                // Retry the original failed request
                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                return API(originalRequest);
            } catch (refreshError) {
                // Refresh failed — token is dead, log the user out
                processQueue(refreshError, null);

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                // Redirect to login/home
                window.location.href = "/";

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ── API Functions ─────────────────────────────────────────────────────────────

// Auth
export const registerAPI = (data) => API.post("/api/v1/user/register", data);
export const loginAPI = (data) => API.post("/api/v1/user/login", data);
export const logoutAPI = () => API.post("/api/v1/user/logout");
export const getUsersAPI = () => API.get("/api/v1/user/list");

// Messages
export const getMessagesAPI = (senderId, receiverId) =>
    API.get(`/api/messages/${senderId}/${receiverId}`);

export default API;