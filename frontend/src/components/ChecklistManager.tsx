import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api"; // <--- Importar api
import { Trash2, Plus, CheckSquare } from "lucide-react";

interface Subtask {
	id: number;
	content: string;
	isCompleted: boolean;
}

interface Props {
	taskId: number;
	subtasks: Subtask[];
}

export const ChecklistManager = ({ taskId, subtasks }: Props) => {
	const [newItemText, setNewItemText] = useState("");
	const queryClient = useQueryClient();

	const completedCount = subtasks.filter((s) => s.isCompleted).length;
	const totalCount = subtasks.length;
	const progressPercent =
		totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

	const addSubtask = useMutation({
		mutationFn: (content: string) =>
			api.post(`/tasks/${taskId}/subtasks`, { content }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["boards"] });
			setNewItemText("");
		},
	});

	const toggleSubtask = useMutation({
		mutationFn: (data: { id: number; isCompleted: boolean }) =>
			api.patch(`/subtasks/${data.id}`, { isCompleted: data.isCompleted }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards"] }),
	});

	const deleteSubtask = useMutation({
		mutationFn: (id: number) => api.delete(`/subtasks/${id}`),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boards"] }),
	});

	const handleAdd = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newItemText.trim()) return;
		addSubtask.mutate(newItemText);
	};

	return (
		<div className='checklist-section'>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 5,
				}}
			>
				<h4>
					<CheckSquare size={12} style={{ marginRight: 5 }} /> Checklist
				</h4>
				<span style={{ fontSize: 11, color: "#666" }}>{progressPercent}%</span>
			</div>

			<div className='progress-bar-container'>
				<div
					className='progress-fill'
					style={{ width: `${progressPercent}%` }}
				></div>
			</div>

			<div className='checklist-items'>
				{subtasks.map((item) => (
					<div key={item.id} className='checklist-item'>
						<input
							type='checkbox'
							checked={item.isCompleted}
							onChange={(e) =>
								toggleSubtask.mutate({
									id: item.id,
									isCompleted: e.target.checked,
								})
							}
						/>
						<span
							className={`item-text ${item.isCompleted ? "completed" : ""}`}
						>
							{item.content}
						</span>
						<span
							className='delete-item-btn'
							onClick={() => deleteSubtask.mutate(item.id)}
						>
							<Trash2 size={14} />
						</span>
					</div>
				))}
			</div>

			<form className='add-item-form' onSubmit={handleAdd}>
				<input
					placeholder='Añadir un elemento...'
					value={newItemText}
					onChange={(e) => setNewItemText(e.target.value)}
				/>
				<button type='submit' disabled={!newItemText.trim()}>
					<Plus size={16} />
				</button>
			</form>
		</div>
	);
};
