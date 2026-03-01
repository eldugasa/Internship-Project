// src/controllers/project.controller.js
import { prisma } from "../config/db.js";
import { createNotification, createBulkNotifications, NOTIFICATION_TYPES } from '../utils/notificationHelper.js';

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

    // Notify admins about new project creation
    try {
      const admins = await prisma.user.findMany({ 
        where: { role: 'ADMIN' } 
      });
      
      if (admins.length > 0) {
        await createBulkNotifications(
          admins.map(admin => ({
            userId: admin.id,
            type: NOTIFICATION_TYPES.PROJECT_CREATED,
            title: 'New Project Created',
            message: `Project "${project.name}" has been created`,
            data: { projectId: project.id },
            link: `/admin/projects/${project.id}`
          }))
        );
      }
    } catch (notifErr) {
      console.error('Error creating project notifications:', notifErr);
    }

    res.status(201).json({ message: "Project created", project });
  } catch (err) {
    console.error("Error creating project:", err);
    res.status(500).json({ message: err.message });
  }
};

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

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (status !== undefined) updateData.status = status;
    if (teamId !== undefined) updateData.teamId = parseInt(teamId);
    
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

    // Check if project status changed to COMPLETED
    if (status === 'COMPLETED' && existingProject.status !== 'COMPLETED') {
      try {
        // Notify admins
        const admins = await prisma.user.findMany({ 
          where: { role: 'ADMIN' } 
        });
        
        if (admins.length > 0) {
          await createBulkNotifications(
            admins.map(admin => ({
              userId: admin.id,
              type: NOTIFICATION_TYPES.PROJECT_COMPLETED,
              title: 'Project Completed',
              message: `Project "${updatedProject.name}" has been completed`,
              data: { projectId: updatedProject.id },
              link: `/admin/projects/${updatedProject.id}`
            }))
          );
        }

        // Notify project manager
        if (updatedProject.managerId) {
          await createNotification({
            userId: updatedProject.managerId,
            type: NOTIFICATION_TYPES.PROJECT_COMPLETED,
            title: 'Project Completed',
            message: `Your project "${updatedProject.name}" has been marked as completed`,
            data: { projectId: updatedProject.id },
            link: `/manager/projects/${updatedProject.id}`
          });
        }

        // Notify team members
        if (updatedProject.teamId) {
          const teamMembers = await prisma.user.findMany({
            where: {
              teamId: updatedProject.teamId,
              role: 'TEAM_MEMBER'
            }
          });

          if (teamMembers.length > 0) {
            await createBulkNotifications(
              teamMembers.map(member => ({
                userId: member.id,
                type: NOTIFICATION_TYPES.PROJECT_COMPLETED,
                title: 'Project Completed',
                message: `Project "${updatedProject.name}" has been completed`,
                data: { projectId: updatedProject.id },
                link: `/team-member/projects/${updatedProject.id}`
              }))
            );
          }
        }
      } catch (notifErr) {
        console.error('Error creating project completion notifications:', notifErr);
      }
    }

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
      updatedAt: updatedProject.updatedAt
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

    // Format projects for frontend
    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress || 0,
      startDate: project.startDate,
      endDate: project.endDate,
      dueDate: project.endDate, // For UI compatibility
      teamId: project.team?.id || null,
      teamName: project.team?.name || 'Unassigned', // ✅ Add teamName field
      team: project.team, // ✅ Keep the original team object
      managerId: project.managerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      tasks: {
        total: project.tasks.length,
        completed: project.tasks.filter((t) => t.status === "COMPLETED").length,
        pending: project.tasks.filter((t) => t.status === "PENDING").length,
        inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS").length,
      }
    }));

    res.json(formattedProjects);
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
      include: { 
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } }
          }
        }, 
        team: {
          include: {
            users: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        manager: { select: { id: true, name: true, email: true } }
      },
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

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const role = normalizeRole(req.user.role);

    if (role !== "ADMIN" && role !== "PROJECT_MANAGER") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete related tasks first (due to foreign key constraints)
    await prisma.task.deleteMany({
      where: { projectId: parseInt(id) }
    });

    // Delete the project
    await prisma.project.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: err.message });
  }
};