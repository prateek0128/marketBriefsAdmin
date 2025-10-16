import axios from "axios";
//const baseURL = "http://127.0.0.1:8080";
const baseURL = "https://marketbriefs.co.in";
const apiUrl = `${baseURL}/api/v1`;
export const API = axios.create({
    baseURL: apiUrl,
});
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
