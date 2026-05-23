import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import teamRoutes from "./routes/team.routes.js";
import taskRoutes from "./routes/task.routes.js";
import projectRoutes from "./routes/project.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import notificationPrefsRoutes from "./routes/notificationPrefs.routes.js";
import { sendPasswordResetEmail } from "./utils/email.js";
import { env } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notification-prefs", notificationPrefsRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Task Management API running" });
});

app.get("/_test-email", async (req, res) => {
  if (env.nodeEnv === "production") {
    return res.status(404).json({ message: "Not found" });
  }

  try {
    const to = req.query.to || process.env.SMTP_USER;
    await sendPasswordResetEmail(to, "test-token", "Test User");
    return res.json({ success: true, message: "Test email sent" });
  } catch (err) {
    console.error("Test email error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default app;
