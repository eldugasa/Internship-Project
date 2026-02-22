import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";   
import teamRoutes from "./routes/team.routes.js"; 
import taskRoutes from "./routes/task.routes.js";
import projectRoutes from "./routes/project.routes.js";
import notificationRoutes from './routes/notification.routes.js';
const app = express();

app.use(cors()); // 👈 IMPORTANT
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Task Management API running 🚀" });
});

export default app;


//  const userRoutes = require("./routes/user.routes");