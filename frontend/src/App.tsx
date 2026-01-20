import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import api from "./lib/api";

// Imports Modulares
import { LoginPage } from "./pages/LoginPage";
import { BoardPage } from "./pages/BoardPage";
import { AdminSidebar } from "./components/AdminSidebar";
import { AnalyticsModal } from "./components/AnalyticsModal";

function App() {
	const [token, setToken] = useState<string | null>(
		localStorage.getItem("token"),
	);
	const role = localStorage.getItem("user_role");
	const myId = Number(localStorage.getItem("user_id"));

	const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
	const [showAnalytics, setShowAnalytics] = useState(false);

	useEffect(() => {
		setSelectedUserId(myId);
	}, [myId]);

	// --- LOGICA DE ADMIN (Sidebar) ---
	const { data: users, refetch: refetchUsers } = useQuery({
		queryKey: ["users"],
		queryFn: async () => (await api.get("/users")).data,
		enabled: role === "ADMIN" && !!token,
	});

	const createUser = useMutation({
		mutationFn: (data: any) => api.post("/users", data),
		onSuccess: () => {
			toast.success("Usuario creado");
			refetchUsers();
		},
		onError: () => toast.error("Error al crear usuario"),
	});

	const deleteUser = useMutation({
		mutationFn: (id: number) => api.delete(`/users/${id}`),
		onSuccess: () => {
			toast.success("Usuario eliminado");
			refetchUsers();
			if (selectedUserId === null) setSelectedUserId(myId);
		},
		onError: (err: any) => toast.error(err.response?.data?.error || "Error"),
	});

	const resetPassword = useMutation({
		mutationFn: (data: { id: number; newPassword: string }) =>
			api.put(`/users/${data.id}/password`, { newPassword: data.newPassword }),
		onSuccess: () => toast.success("Contraseña actualizada"),
		onError: () => toast.error("Error al actualizar"),
	});

	// --- HANDLERS DE AUTH ---
	const handleLogin = () => {
		setToken(localStorage.getItem("token"));
		window.location.reload();
	};

	const handleLogout = () => {
		localStorage.clear();
		setToken(null);
		toast("¡Nos vemos!", { icon: "👋" });
		window.location.reload();
	};

	// --- RENDERIZADO CONDICIONAL SIMPLE ---
	if (!token) {
		return (
			<>
				<Toaster position='bottom-right' />
				<LoginPage onLogin={handleLogin} />
			</>
		);
	}

	return (
		<>
			<Toaster position='bottom-right' />

			<div className='admin-layout'>
				{role === "ADMIN" && (
					<AdminSidebar
						users={users || []}
						currentUserRole={role}
						selectedUserId={selectedUserId}
						onSelectUser={(id) => setSelectedUserId(id)}
						onCreateUser={(data) => createUser.mutate(data)}
						onDeleteUser={(id) => deleteUser.mutate(id)}
						onResetPassword={(id, newPass) =>
							resetPassword.mutate({ id, newPassword: newPass })
						}
						onOpenAnalytics={() => setShowAnalytics(true)}
					/>
				)}

				<div className='main-content'>
					<BoardPage
						onLogout={handleLogout}
						targetUserId={role === "ADMIN" ? selectedUserId : null}
					/>
				</div>
			</div>

			{role === "ADMIN" && (
				<AnalyticsModal
					isOpen={showAnalytics}
					onClose={() => setShowAnalytics(false)}
				/>
			)}
		</>
	);
}

export default App;
