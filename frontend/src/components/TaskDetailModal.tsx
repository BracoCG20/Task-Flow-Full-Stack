import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api"; // <--- USAMOS NUESTRA INSTANCIA API
import { X, MessageSquare, Send } from "lucide-react";
import toast from "react-hot-toast";

// Importamos los sub-componentes (Asegúrate de que existan en la carpeta components)
import { ChecklistManager } from "./ChecklistManager";
import { AttachmentManager } from "./AttachmentManager";
import { ActivityList } from "./ActivityList";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	task: any;
}

export const TaskDetailModal = ({ isOpen, onClose, task }: Props) => {
	const [newComment, setNewComment] = useState("");
	const queryClient = useQueryClient();
	const myName = localStorage.getItem("user_name");

	// 1. QUERY: Cargar Comentarios
	const { data: comments, isLoading: loadingComments } = useQuery({
		queryKey: ["comments", task?.id],
		queryFn: async () => {
			// Usamos ruta relativa /tasks/...
			const res = await api.get(`/tasks/${task.id}/comments`);
			return res.data;
		},
		enabled: !!task && isOpen,
		retry: false, // <--- EVITA EL BUCLE INFINITO SI FALLA
	});

	// 2. MUTATION: Enviar Comentario
	const postComment = useMutation({
		mutationFn: (content: string) =>
			api.post(`/tasks/${task.id}/comments`, { content }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["comments", task.id] });
			setNewComment("");
		},
		onError: () => toast.error("No se pudo enviar el mensaje"),
	});

	const handleSubmitComment = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newComment.trim()) return;
		postComment.mutate(newComment);
	};

	if (!isOpen || !task) return null;

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div
				className='modal-content'
				onClick={(e) => e.stopPropagation()}
				style={{
					width: "700px",
					maxHeight: "90vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{/* HEADER DEL MODAL */}
				<div className='modal-header'>
					<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
						{/* Renderizamos las etiquetas si existen */}
						<div style={{ display: "flex", gap: 5 }}>
							{task.tags?.map((tag: any) => (
								<span
									key={tag.id}
									className='tag-pill'
									style={{ backgroundColor: tag.color }}
								>
									{tag.name}
								</span>
							))}
						</div>
						<h2 style={{ margin: 0, fontSize: "1.2rem" }}>{task.content}</h2>
						<span style={{ fontSize: 12, color: "#999" }}>
							En lista: {task.column?.title || "Tablero"}
						</span>
					</div>
					<button onClick={onClose}>
						<X />
					</button>
				</div>

				{/* CUERPO DEL MODAL (Scrollable) */}
				<div
					className='modal-body'
					style={{ flex: 1, overflowY: "auto", padding: "20px" }}
				>
					{/* --- SECCIÓN 1: CHECKLIST --- */}
					<ChecklistManager taskId={task.id} subtasks={task.subtasks || []} />

					{/* --- SECCIÓN 2: ADJUNTOS --- */}
					{/* Asegúrate de que tu backend incluya 'attachments' en la respuesta de la tarea */}
					<AttachmentManager
						taskId={task.id}
						attachments={task.attachments || []}
					/>

					{/* --- SECCIÓN 3: COMENTARIOS --- */}
					<div className='comments-section'>
						<h4>
							<MessageSquare size={14} /> Comentarios
						</h4>

						<div className='comment-list'>
							{loadingComments ? (
								<p style={{ fontSize: 12, color: "#999" }}>
									Cargando charla...
								</p>
							) : (
								comments?.map((c: any) => (
									<div key={c.id} className='comment-item'>
										<div className='comment-avatar'>
											{c.user.name.charAt(0).toUpperCase()}
										</div>
										<div className='comment-bubble'>
											<div className='comment-header'>
												<strong>{c.user.name}</strong>
												<span>{new Date(c.createdAt).toLocaleString()}</span>
											</div>
											<p>{c.content}</p>
										</div>
									</div>
								))
							)}
							{comments?.length === 0 && (
								<p style={{ fontSize: 13, color: "#ccc", fontStyle: "italic" }}>
									Sé el primero en comentar.
								</p>
							)}
						</div>

						<form className='comment-form' onSubmit={handleSubmitComment}>
							<textarea
								placeholder='Escribe un comentario...'
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSubmitComment(e);
									}
								}}
							/>
							<button
								type='submit'
								disabled={!newComment.trim() || postComment.isPending}
							>
								<Send size={16} />
							</button>
						</form>
					</div>

					{/* --- SECCIÓN 4: HISTORIAL --- */}
					<ActivityList taskId={task.id} />
				</div>
			</div>
		</div>
	);
};
