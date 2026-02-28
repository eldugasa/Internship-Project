import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";   
import teamRoutes from "./routes/team.routes.js"; 
import taskRoutes from "./routes/task.routes.js";
import projectRoutes from "./routes/project.routes.js";
import notificationRoutes from './routes/notification.routes.js';
import notificationPrefsRoutes from './routes/notificationPrefs.routes.js';
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
app.use('/api/notification-prefs', notificationPrefsRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Task Management API running 🚀" });
});

// Quick test endpoint to verify email sending
import { sendPasswordResetEmail } from './utils/email.js';

app.get('/_test-email', async (req, res) => {
  try {
    const to = req.query.to || process.env.SMTP_USER;
    const token = 'test-token';
    await sendPasswordResetEmail(to, token, 'Test User');
    res.json({ success: true, message: 'Test email sent (check server logs and Ethereal preview if in dev)'});
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default app;


//  const userRoutes = require("./routes/user.routes");