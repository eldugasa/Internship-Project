// src/controllers/project.controller.js
import { prisma } from "../config/db.js";

// Helper to normalize role
const normalizeRole = (role) => (role || "").toUpperCase().replace("-", "_");

// Create a project
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
    console.error("Error creating project:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update project
// Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, status, teamId } = req.body;

    console.log('=== UPDATE PROJECT CONTROLLER ===');
    console.log('Project ID:', id);
    console.log('Request body:', req.body);

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Build update data - ❌ REMOVE updatedAt
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (status !== undefined) updateData.status = status;
    if (teamId !== undefined) updateData.teamId = parseInt(teamId);
    
    // ❌ REMOVE THIS LINE - updatedAt is managed by Prisma
    // updateData.updatedAt = new Date();

    console.log('Update data:', updateData);

    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        team: {
          select: { id: true, name: true, lead: true }
        }
      }
    });

    console.log('Project updated successfully');

    res.json({
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      status: updatedProject.status,
      startDate: updatedProject.startDate,
      endDate: updatedProject.endDate,
      dueDate: updatedProject.endDate,
      teamId: updatedProject.teamId,
      teamName: updatedProject.team?.name || null,
      teamLead: updatedProject.team?.lead || null,
      updatedAt: updatedProject.updatedAt // This will be automatically set by Prisma
    });

  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ 
      message: "Failed to update project",
      error: err.message 
    });
  }
};

// Get all projects
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
    console.error("Error fetching projects:", err);
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
    console.error("Error fetching project:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get project members
export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      include: {
        team: {
          include: {
            users: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const members = project.team?.users || [];
    res.json(members);
  } catch (err) {
    console.error("Error fetching project members:", err);
    res.status(500).json({ message: err.message });
  }
};