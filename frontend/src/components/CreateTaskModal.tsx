import { useState } from "react";
import { X, Calendar, Flag } from "lucide-react";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	columnId: number | null;
	onSubmit: (data: {
		content: string;
		priority: string;
		dueDate: string;
	}) => void;
}

export const CreateTaskModal = ({
	isOpen,
	onClose,
	columnId,
	onSubmit,
}: Props) => {
	const [content, setContent] = useState("");
	const [priority, setPriority] = useState("low");
	const [dueDate, setDueDate] = useState("");

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		onSubmit({ content, priority, dueDate });

		// Resetear formulario
		setContent("");
		setPriority("low");
		setDueDate("");
		onClose();
	};

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div
				className='modal-content'
				onClick={(e) => e.stopPropagation()}
				style={{ width: "500px", height: "auto", padding: 0 }} // Override de tamaño
			>
				<div className='modal-header'>
					<h3>Nueva Tarea</h3>
					<button onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					style={{
						padding: "20px",
						display: "flex",
						flexDirection: "column",
						gap: "15px",
					}}
				>
					{/* 1. CONTENIDO */}
					<div>
						<label
							style={{
								fontSize: "0.85rem",
								color: "var(--text-secondary)",
								marginBottom: 5,
								display: "block",
							}}
						>
							Descripción
						</label>
						<textarea
							autoFocus
							className='edit-textarea'
							placeholder='¿Qué hay que hacer?'
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={3}
							style={{ minHeight: "80px" }}
						/>
					</div>

					<div style={{ display: "flex", gap: "15px" }}>
						{/* 2. PRIORIDAD */}
						<div style={{ flex: 1 }}>
							<label
								style={{
									fontSize: "0.85rem",
									color: "var(--text-secondary)",
									marginBottom: 5,
									display: "flex",
									alignItems: "center",
									gap: 5,
								}}
							>
								<Flag size={14} /> Prioridad
							</label>
							<select
								className='edit-select'
								value={priority}
								onChange={(e) => setPriority(e.target.value)}
								style={{ width: "100%", padding: "8px" }}
							>
								<option value='low'>🟢 Baja</option>
								<option value='medium'>🟠 Media</option>
								<option value='high'>🔴 Alta</option>
							</select>
						</div>

						{/* 3. FECHA */}
						<div style={{ flex: 1 }}>
							<label
								style={{
									fontSize: "0.85rem",
									color: "var(--text-secondary)",
									marginBottom: 5,
									display: "flex",
									alignItems: "center",
									gap: 5,
								}}
							>
								<Calendar size={14} /> Vencimiento
							</label>
							<input
								type='date'
								className='edit-select'
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								style={{ width: "100%", padding: "8px" }}
							/>
						</div>
					</div>

					{/* BOTONES */}
					<div
						style={{
							display: "flex",
							justifyContent: "flex-end",
							gap: "10px",
							marginTop: "10px",
						}}
					>
						<button
							type='button'
							onClick={onClose}
							style={{
								padding: "8px 16px",
								background: "transparent",
								border: "1px solid var(--border-color)",
								color: "var(--text-secondary)",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							Cancelar
						</button>
						<button
							type='submit'
							disabled={!content.trim()}
							style={{
								padding: "8px 20px",
								background: "#4a90e2",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
								fontWeight: "bold",
							}}
						>
							Crear Tarea
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
