import api from "../lib/api";

export const authService = {
	login: async (credentials: any) => {
		const response = await api.post("/api/login", credentials); // Nota el /api si lo cambiaste en backend
		return response.data;
	},
	// aquí pondrías register, logout, etc.
};
