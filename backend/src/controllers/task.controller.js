// Add this to your existing task.controller.js
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== "ADMIN" && 
        req.user.role !== "PROJECT_MANAGER" && 
        task.assignedTo !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this task" });
    }

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assigneeId: task.assigneeId,
      assignee: task.assignee.name,
      assigneeEmail: task.assignee.email,
      projectId: task.projectId,
      project: task.project.name,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
};

// Don't forget to add it to your exports
export { 
  createTask, 
  getTasksByProject, 
  updateTaskStatus, 
  getAllTasks,
  getTaskById 
};