import { useState } from "react";
import { Trash2, UserPlus, Key, BarChart2 } from "lucide-react"; // <--- AGREGAMOS 'Key'

interface User {
	id: number;
	name: string;
	email: string;
	role: string;
}

interface Props {
	users: User[];
	selectedUserId: number | null;
	onSelectUser: (id: number) => void;
	onCreateUser: (data: any) => void;
	onDeleteUser: (id: number) => void;
	// NUEVA PROP PARA CAMBIAR PASSWORD
	onResetPassword: (id: number, newPass: string) => void;
	onOpenAnalytics: () => void;
	currentUserRole: string;
}

export const AdminSidebar = ({
	users,
	selectedUserId,
	onSelectUser,
	onCreateUser,
	onDeleteUser,
	onResetPassword, // <--- No olvides recibirla aquí
	onOpenAnalytics,
}: Props) => {
	const [newUser, setNewUser] = useState({
		name: "",
		email: "",
		password: "",
		role: "USER",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newUser.name || !newUser.email || !newUser.password) return;
		onCreateUser(newUser);
		setNewUser({ name: "", email: "", password: "", role: "USER" });
	};

	// Función para manejar el clic en la llave
	const handlePasswordClick = (userId: number, userName: string) => {
		const newPass = prompt(`Ingresa la nueva contraseña para ${userName}:`);
		if (newPass) {
			onResetPassword(userId, newPass);
		}
	};

	return (
		<div className='admin-sidebar'>
			<div className='sidebar-header'>
				<h2>🛠️ Panel Admin</h2>
				<p style={{ fontSize: 12, opacity: 0.7 }}>Gestionar Empleados</p>

				{/* BOTÓN DE ANALÍTICAS NUEVO */}
				<button
					onClick={onOpenAnalytics}
					style={{
						marginTop: 15,
						width: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: 8,
						background: "#8e44ad",
						border: "none",
						padding: "8px",
						borderRadius: 4,
						color: "white",
						cursor: "pointer",
						fontSize: 13,
					}}
				>
					<BarChart2 size={16} /> Ver Reportes
				</button>
			</div>

			<div className='user-list'>
				{users.map((u) => (
					<div
						key={u.id}
						className={`user-item ${selectedUserId === u.id ? "active" : ""}`}
						onClick={() => onSelectUser(u.id)}
					>
						<div className='user-info'>
							<strong>{u.name}</strong>
							<span className='role'>{u.role}</span>
						</div>

						<div style={{ display: "flex", gap: 10 }}>
							{/* BOTÓN CAMBIAR PASSWORD */}
							<div
								className='delete-user-btn' // Reusamos la clase para el efecto hover
								style={{ color: "#f1c40f" }} // Color amarillo para la llave
								title='Cambiar contraseña'
								onClick={(e) => {
									e.stopPropagation();
									handlePasswordClick(u.id, u.name);
								}}
							>
								<Key size={16} />
							</div>

							{/* BOTÓN BORRAR */}
							<div
								className='delete-user-btn'
								title='Eliminar usuario'
								onClick={(e) => {
									e.stopPropagation();
									if (confirm(`¿Borrar a ${u.name}?`)) onDeleteUser(u.id);
								}}
							>
								<Trash2 size={16} />
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Formulario de Creación */}
			<div className='create-user-form'>
				<h4>
					<UserPlus size={14} style={{ verticalAlign: "middle" }} /> Nuevo
					Empleado
				</h4>
				<form className='formAdmin' onSubmit={handleSubmit}>
					<input
						placeholder='Nombre'
						value={newUser.name}
						onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
					/>
					<input
						placeholder='Email'
						value={newUser.email}
						onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
					/>
					<input
						type='password'
						placeholder='Contraseña'
						value={newUser.password}
						onChange={(e) =>
							setNewUser({ ...newUser, password: e.target.value })
						}
					/>
					<select
						value={newUser.role}
						onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
					>
						<option value='USER'>Empleado (User)</option>
						<option value='ADMIN'>Administrador</option>
					</select>
					<button type='submit'>Crear</button>
				</form>
			</div>
		</div>
	);
};
