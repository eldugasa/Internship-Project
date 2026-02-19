import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/*
========================================
CREATE PROJECT
========================================
*/
router.post(
  "/",
  authenticate,
  authorize("project_manager"), // lowercase
  async (req, res) => {
    const user = req.user;
    const { name, description, startDate, endDate, status, teamId } = req.body;

    if (!name || !startDate || !endDate || !teamId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const team = await prisma.team.findUnique({
        where: { id: parseInt(teamId) }
      });

      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const project = await prisma.project.create({
        data: {
          name,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: status || "PLANNED",
          teamId: parseInt(teamId),
          managerId: user.id
        }
      });

      return res.status(201).json(project);

    } catch (err) {
      console.error("Error creating project:", err);
      return res.status(500).json({
        message: "Server error while creating project"
      });
    }
  }
);

/*
========================================
GET ALL PROJECTS
========================================
*/
router.get(
  "/",
  authenticate,
  authorize("admin", "project_manager"), // lowercase
  async (req, res) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          team: true,
          tasks: true
        }
      });

      const formattedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        teamId: p.teamId,
        team: { name: p.team.name },
        progress:
          p.tasks.length > 0
            ? Math.floor(
                (p.tasks.filter(t => t.status === "DONE").length /
                  p.tasks.length) *
                  100
              )
            : 0,
        tasks: { total: p.tasks.length }
      }));

      return res.json(formattedProjects);

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch projects"
      });
    }
  }
);

/*
========================================
GET SINGLE PROJECT
========================================
*/
router.get(
  "/:id",
  authenticate,
  authorize("admin", "project_manager"), // lowercase
  async (req, res) => {
    const { id } = req.params;

    try {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(id) },
        include: {
          team: true,
          tasks: true
        }
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      return res.json({
        ...project,
        progress:
          project.tasks.length > 0
            ? Math.floor(
                (project.tasks.filter(t => t.status === "DONE").length /
                  project.tasks.length) *
                  100
              )
            : 0,
        tasks: { total: project.tasks.length }
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch project"
      });
    }
  }
);


// GET /api/projects/:projectId/members
// GET /api/projects/:projectId/members
router.get(
  '/:projectId/members', 
  authenticate,  // ✅ Add this
  authorize("admin", "project_manager"), // ✅ Add role check
  async (req, res) => {
    const { projectId } = req.params;

    try {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
        include: {
          team: {
            include: {
              users: {
                select: { id: true, name: true, email: true }
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
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch project members' });
    }
  }
);



export default router;
