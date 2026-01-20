import axios from "axios";

const api = axios.create({
	// Si VITE_API_URL no existe, usa localhost:3000 por defecto
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export default api;
