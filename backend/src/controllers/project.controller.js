// src/controllers/project.controller.js
console.log("boobaajdkfjdk jkjkjBOBOBOBOBOB")


import { prisma } from "../config/db.js"; // make sure prisma is exported from db.js

// Helper to normalize role
const normalizeRole = (role) => (role || "").toUpperCase().replace("-", "_");

// Create a project (PROJECT_MANAGER only)
export const createProject = async (req, res) => {
  console.log("REQ.USER:", req.user);
  try {
    const { name, description, teamId, startDate, endDate } = req.body;
    const managerId = req.user.id;
    const role = normalizeRole(req.user.role);

    if (role !== "PROJECT_MANAGER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: "PLANNED",
        teamId: Number(teamId),
        managerId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    res.status(201).json({ message: "Project created", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all projects (ADMIN sees all, PROJECT_MANAGER sees own)
export const getAllProjects = async (req, res) => {
  try {
    const role = normalizeRole(req.user.role);

    let projects;
    if (role === "ADMIN") {
      projects = await prisma.project.findMany({
        include: {
          tasks: true,
          team: { select: { id: true, name: true } },
        },
      });
    } else if (role === "PROJECT_MANAGER") {
      projects = await prisma.project.findMany({
        where: { managerId: req.user.id },
        include: {
          tasks: true,
          team: { select: { id: true, name: true } },
        },
      });
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Format tasks & team for frontend
    projects = projects.map((project) => ({
      ...project,
      tasks: {
        total: project.tasks.length,
        completed: project.tasks.filter((t) => t.status === "COMPLETED").length,
      },
      team: project.team?.name || "No team",
    }));

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single project by ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = normalizeRole(req.user.role);

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: { tasks: true, team: true },
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (role === "PROJECT_MANAGER" && project.managerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
