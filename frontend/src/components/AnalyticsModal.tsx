import { useQuery } from "@tanstack/react-query";
import api from "../lib/api"; // <--- Importar api
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { X } from "lucide-react";

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

const PRIORITY_COLORS: any = {
	low: "#10ac84",
	medium: "#ff9f43",
	high: "#ee5253",
};

export const AnalyticsModal = ({ isOpen, onClose }: Props) => {
	const { data: stats, isLoading } = useQuery({
		queryKey: ["admin-stats"],
		queryFn: async () => (await api.get("/admin/stats")).data, // Ruta limpia
		enabled: isOpen,
	});

	if (!isOpen) return null;

	const priorityData =
		stats?.tasksByPriority.map((item: any) => ({
			name:
				item.priority === "low"
					? "Baja"
					: item.priority === "medium"
						? "Media"
						: "Alta",
			value: item._count.priority,
			color: PRIORITY_COLORS[item.priority] || "#ccc",
		})) || [];

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div
				className='modal-content'
				onClick={(e) => e.stopPropagation()}
				style={{
					width: "900px",
					maxWidth: "95vw",
					height: "90vh",
					background: "#f8f9fa",
				}}
			>
				<div className='modal-header'>
					<h2>📊 Panel de Analíticas</h2>
					<button onClick={onClose}>
						<X />
					</button>
				</div>

				<div className='modal-body' style={{ padding: 20, overflowY: "auto" }}>
					{isLoading ? (
						<p>Calculando datos...</p>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
							<div
								style={{ display: "flex", gap: 20, justifyContent: "center" }}
							>
								<div style={cardStyle}>
									<h3>👥 Usuarios Totales</h3>
									<p style={numberStyle}>{stats.totalUsers}</p>
								</div>
								<div style={cardStyle}>
									<h3>📝 Tareas Totales</h3>
									<p style={numberStyle}>
										{stats.tasksByUser.reduce(
											(acc: number, curr: any) => acc + curr.tasks,
											0,
										)}
									</p>
								</div>
							</div>

							<div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
								<div style={{ ...chartCardStyle, flex: 2, minWidth: 300 }}>
									<h4>Carga de Trabajo por Usuario</h4>
									<div style={{ width: "100%", height: 300 }}>
										<ResponsiveContainer>
											<BarChart data={stats.tasksByUser}>
												<CartesianGrid strokeDasharray='3 3' />
												<XAxis dataKey='name' />
												<YAxis />
												<Tooltip />
												<Legend />
												<Bar
													dataKey='tasks'
													name='Tareas Activas'
													fill='#4a90e2'
													radius={[4, 4, 0, 0]}
												/>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</div>

								<div style={{ ...chartCardStyle, flex: 1, minWidth: 300 }}>
									<h4>Distribución de Prioridades</h4>
									<div style={{ width: "100%", height: 300 }}>
										<ResponsiveContainer>
											<PieChart>
												<Pie
													data={priorityData}
													cx='50%'
													cy='50%'
													labelLine={false}
													label={({ name, percent }) =>
														`${name} ${((percent || 0) * 100).toFixed(0)}%`
													}
													outerRadius={80}
													fill='#8884d8'
													dataKey='value'
												>
													{priorityData.map((entry: any, index: number) => (
														<Cell key={`cell-${index}`} fill={entry.color} />
													))}
												</Pie>
												<Tooltip />
											</PieChart>
										</ResponsiveContainer>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

const cardStyle: React.CSSProperties = {
	background: "white",
	padding: 20,
	borderRadius: 10,
	boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
	flex: 1,
	textAlign: "center",
};
const chartCardStyle: React.CSSProperties = {
	background: "white",
	padding: 20,
	borderRadius: 10,
	boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
};
const numberStyle: React.CSSProperties = {
	fontSize: "2rem",
	fontWeight: "bold",
	color: "#333",
	margin: "10px 0 0 0",
};
