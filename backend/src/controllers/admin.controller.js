import { prisma } from "../config/db.js";

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalTeams = await prisma.team.count();
    const totalProjects = await prisma.project.count();
    const totalTasks = await prisma.task.count();

    const completedTasks = await prisma.task.count({
      where: { status: "completed" }
    });

    const inProgressTasks = await prisma.task.count({
      where: { status: "in-progress" }
    });

    res.json({
      totalUsers,
      totalTeams,
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { getAdminDashboard };
