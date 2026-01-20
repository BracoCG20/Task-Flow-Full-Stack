import { useState } from "react";
import toast from "react-hot-toast";
import api from "../lib/api"; // Asegúrate de importar tu api

interface Props {
	onLogin: () => void;
}

export const LoginPage = ({ onLogin }: Props) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const loadingToast = toast.loading("Autenticando...");
		try {
			const res = await api.post("/api/login", {
				email,
				password,
			});
			localStorage.setItem("token", res.data.token);
			localStorage.setItem("user_name", res.data.name);
			localStorage.setItem("user_role", res.data.role);
			localStorage.setItem("user_id", String(res.data.userId));

			toast.success(`Bienvenido ${res.data.name}`, { id: loadingToast });
			onLogin();
		} catch (error) {
			toast.error("Credenciales inválidas", { id: loadingToast });
		}
	};

	return (
		<div className='auth-container'>
			<div className='auth-box'>
				<h2>Iniciar Sesión</h2>
				<p style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>
					Acceso restringido a empleados
				</p>
				<form onSubmit={handleSubmit}>
					<input
						type='email'
						placeholder='Email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<input
						type='password'
						placeholder='Contraseña'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<button type='submit'>Entrar</button>
				</form>
			</div>
		</div>
	);
};
