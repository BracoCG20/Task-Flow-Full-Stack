import { useState } from "react";
import { MoreHorizontal, Trash2, Edit2 } from "lucide-react";

interface Props {
	id: number;
	title: string;
	taskCount: number;
	onUpdateTitle: (id: number, newTitle: string) => void;
	onDelete: (id: number) => void;
}

export const ColumnHeader = ({
	id,
	title,
	taskCount,
	onUpdateTitle,
	onDelete,
}: Props) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(title);
	const [showMenu, setShowMenu] = useState(false);

	const handleSave = () => {
		if (editTitle.trim()) {
			onUpdateTitle(id, editTitle);
		}
		setIsEditing(false);
		setShowMenu(false);
	};

	return (
		<div style={{ marginBottom: 15, position: "relative" }}>
			{isEditing ? (
				<input
					autoFocus
					value={editTitle}
					onChange={(e) => setEditTitle(e.target.value)}
					onBlur={handleSave}
					onKeyDown={(e) => e.key === "Enter" && handleSave()}
					style={{
						width: "100%",
						padding: "5px",
						borderRadius: 4,
						border: "1px solid #3498db",
						fontSize: "1rem",
						fontWeight: "bold",
					}}
				/>
			) : (
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<h3
						onDoubleClick={() => setIsEditing(true)}
						style={{
							margin: 0,
							fontSize: "1rem",
							color: "#2c3e50",
							cursor: "text",
						}}
					>
						{title}{" "}
						<span
							style={{
								color: "#999",
								fontSize: "0.8rem",
								fontWeight: "normal",
							}}
						>
							({taskCount})
						</span>
					</h3>

					<div
						style={{
							cursor: "pointer",
							padding: 4,
							borderRadius: 4,
							position: "relative",
						}}
						onClick={() => setShowMenu(!showMenu)}
					>
						<MoreHorizontal size={18} color='#7f8c8d' />

						{/* Menú desplegable */}
						{showMenu && (
							<div
								style={{
									position: "absolute",
									top: "100%",
									right: 0,
									background: "white",
									border: "1px solid #eee",
									borderRadius: 6,
									boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
									zIndex: 10,
									minWidth: 120,
									overflow: "hidden",
								}}
							>
								<div
									onClick={(e) => {
										e.stopPropagation();
										setIsEditing(true);
										setShowMenu(false);
									}}
									style={{
										padding: "8px 12px",
										fontSize: 13,
										cursor: "pointer",
										display: "flex",
										gap: 8,
										alignItems: "center",
										color: "#333",
									}}
									onMouseEnter={(e) =>
										(e.currentTarget.style.background = "#f8f9fa")
									}
									onMouseLeave={(e) =>
										(e.currentTarget.style.background = "white")
									}
								>
									<Edit2 size={12} /> Editar
								</div>
								<div
									onClick={(e) => {
										e.stopPropagation();
										if (confirm("¿Borrar columna y todas sus tareas?"))
											onDelete(id);
									}}
									style={{
										padding: "8px 12px",
										fontSize: 13,
										cursor: "pointer",
										display: "flex",
										gap: 8,
										alignItems: "center",
										color: "#e74c3c",
									}}
									onMouseEnter={(e) =>
										(e.currentTarget.style.background = "#fff5f5")
									}
									onMouseLeave={(e) =>
										(e.currentTarget.style.background = "white")
									}
								>
									<Trash2 size={12} /> Borrar
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
