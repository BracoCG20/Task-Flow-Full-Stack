import express from "express";
import cors from "cors";
import path from "path";

// Middlewares
import { authenticateToken, requireAdmin } from "./middlewares/auth.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import boardRoutes from "./routes/board.routes";
import taskRoutes from "./routes/task.routes";
import columnRoutes from "./routes/column.routes";

// Controllers for loose routes
import * as taskController from "./controllers/task.controller";
import * as userController from "./controllers/user.controller";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		credentials: true,
	}),
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- MOUNT ROUTES ---

app.use("/api", authRoutes);
app.use("/users", userRoutes);
app.use("/boards", boardRoutes);
app.use("/columns", columnRoutes);
app.use("/tasks", taskRoutes);

// --- LOOSE ROUTES (To fix specific 404s) ---

// Subtasks (Delete/Update by ID)
app.delete("/subtasks/:id", authenticateToken, taskController.deleteSubtask);
app.patch("/subtasks/:id", authenticateToken, taskController.updateSubtask);

// Attachments (Delete by ID)
app.delete(
	"/attachments/:id",
	authenticateToken,
	taskController.deleteAttachment,
);

// Admin Stats
app.get(
	"/admin/stats",
	authenticateToken,
	requireAdmin,
	userController.getStats,
);

// Profile
app.put("/profile", authenticateToken, userController.updateProfile);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
