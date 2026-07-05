const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

// Auth middleware
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// GET tasks by project
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { status, priority, assignee, sort } = req.query;

    let filter = { project: req.params.projectId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    let sortOption = { createdAt: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'priority') sortOption = { priority: -1 };
    if (sort === 'status') sortOption = { status: 1 };

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .sort(sortOption);

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all tasks assigned to user
router.get('/my-tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.userId })
      .populate('project', 'name color')
      .populate('assignee', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single task
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE task
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, project, assignee, priority, dueDate, tags } = req.body;

    // Verify project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignee,
      createdBy: req.userId,
      priority,
      dueDate,
      tags: tags || []
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name');

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, status, priority, assignee, dueDate, tags, timeSpent } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority, assignee, dueDate, tags, timeSpent },
      { new: true, runValidators: true }
    )
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('comments.user', 'name email avatar')
    .populate('project', 'name');

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADD comment to task
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text,
            user: req.userId,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    )
    .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: task.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET dashboard stats
router.get('/stats/dashboard', authenticate, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({
      $or: [
        { assignee: req.userId },
        { createdBy: req.userId }
      ]
    });

    const statusStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { assignee: req.userId },
            { createdBy: req.userId }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const overdueTasks = await Task.countDocuments({
      assignee: req.userId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' }
    });

    const stats = {
      total: totalTasks,
      todo: 0,
      'in-progress': 0,
      review: 0,
      done: 0,
      overdue: overdueTasks
    };

    statusStats.forEach(stat => {
      if (stats.hasOwnProperty(stat._id)) {
        stats[stat._id] = stat.count;
      }
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;