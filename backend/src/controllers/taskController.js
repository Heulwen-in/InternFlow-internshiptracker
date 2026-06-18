const prisma = require("../config/prisma");
const { toDate } = require("../utils/date");

const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
      include: {
        application: {
          include: { company: true },
        },
      },
    });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, dueDate, applicationId } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Task title is required" });
    }
    if (title.length > 500) {
      return res.status(400).json({ message: "Task title must be 500 characters or fewer" });
    }

    let nextApplicationId = null;

    if (applicationId) {
      const application = await prisma.application.findFirst({
        where: {
          id: Number(applicationId),
          userId: req.user.id,
        },
      });

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      nextApplicationId = application.id;
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        applicationId: nextApplicationId,
        title,
        dueDate: toDate(dueDate),
      },
      include: {
        application: {
          include: { company: true },
        },
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Failed to create task" });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { title, dueDate, completed, applicationId } = req.body;

    let nextApplicationId = undefined;

    if (applicationId !== undefined) {
      if (!applicationId) {
        nextApplicationId = null;
      } else {
        const application = await prisma.application.findFirst({
          where: {
            id: Number(applicationId),
            userId: req.user.id,
          },
        });

        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }

        nextApplicationId = application.id;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        title,
        dueDate: toDate(dueDate),
        completed,
        applicationId: nextApplicationId,
      },
      include: {
        application: {
          include: { company: true },
        },
      },
    });

    res.json({ task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Failed to update task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({
      where: { id: task.id },
    });

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
