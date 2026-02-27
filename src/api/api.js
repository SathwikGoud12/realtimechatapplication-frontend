import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL, // ✅ FIXED
    withCredentials: false,
});

// Attach Authorization header
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const registerAPI = (data) => API.post("/api/v1/user/register", data);
export const loginAPI = (data) => API.post("/api/v1/user/login", data);
export const logoutAPI = () => API.post("/api/v1/user/logout");
export const getUsersAPI = () => API.get("/api/v1/user/list");

// Messages
export const getMessagesAPI = (senderId, receiverId) =>
    API.get(`/api/messages/${senderId}/${receiverId}`);

export default API;