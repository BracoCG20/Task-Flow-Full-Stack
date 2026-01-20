import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api"; // <--- Importar api
import { Paperclip, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface Attachment {
	id: number;
	filename: string;
	path: string;
}

interface Props {
	taskId: number;
	attachments: Attachment[];
}

export const AttachmentManager = ({ taskId, attachments }: Props) => {
	const queryClient = useQueryClient();
	const [isUploading, setIsUploading] = useState(false);

	// URL Base para los enlaces de descarga
	const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

	const uploadMutation = useMutation({
		mutationFn: (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			// api.post maneja automáticamente el Content-Type para FormData en la mayoría de casos,
			// pero forzarlo no hace daño.
			return api.post(`/tasks/${taskId}/attachments`, formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
		},
		onSuccess: () => {
			toast.success("Archivo subido");
			queryClient.invalidateQueries({ queryKey: ["boards"] });
			setIsUploading(false);
		},
		onError: () => {
			toast.error("Error al subir");
			setIsUploading(false);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => api.delete(`/attachments/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["boards"] });
			toast.success("Archivo eliminado");
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setIsUploading(true);
			uploadMutation.mutate(e.target.files[0]);
		}
	};

	const getFileIcon = (filename: string) => {
		if (filename.match(/\.(jpg|jpeg|png|gif)$/i))
			return <ImageIcon size={16} color='#3498db' />;
		return <FileText size={16} color='#666' />;
	};

	return (
		<div style={{ marginTop: 20 }}>
			<h4
				style={{
					margin: "0 0 10px 0",
					color: "#888",
					fontSize: "0.9rem",
					display: "flex",
					alignItems: "center",
					gap: 5,
				}}
			>
				<Paperclip size={14} /> Adjuntos
			</h4>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 8,
					marginBottom: 10,
				}}
			>
				{attachments.map((file) => (
					<div
						key={file.id}
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							padding: "8px",
							background: "#f8f9fa",
							borderRadius: 6,
							border: "1px solid #eee",
						}}
					>
						<a
							href={`${BASE_URL}/${file.path}`} // <--- Usamos la variable de entorno para el link
							target='_blank'
							rel='noopener noreferrer'
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
								textDecoration: "none",
								color: "#333",
								fontSize: 13,
							}}
						>
							{getFileIcon(file.filename)}
							<span
								style={{
									maxWidth: 300,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{file.filename}
							</span>
						</a>

						<button
							onClick={() => deleteMutation.mutate(file.id)}
							style={{
								border: "none",
								background: "none",
								cursor: "pointer",
								color: "#ff7675",
							}}
						>
							<Trash2 size={14} />
						</button>
					</div>
				))}
				{attachments.length === 0 && (
					<p style={{ fontSize: 12, color: "#ccc", fontStyle: "italic" }}>
						No hay archivos adjuntos
					</p>
				)}
			</div>

			<label
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: 5,
					padding: "6px 12px",
					background: "#ecf0f1",
					borderRadius: 4,
					fontSize: 12,
					cursor: isUploading ? "not-allowed" : "pointer",
					color: "#2c3e50",
					fontWeight: 600,
				}}
			>
				<Paperclip size={14} />
				{isUploading ? "Subiendo..." : "Adjuntar Archivo"}
				<input
					type='file'
					onChange={handleFileChange}
					style={{ display: "none" }}
					disabled={isUploading}
				/>
			</label>
		</div>
	);
};
