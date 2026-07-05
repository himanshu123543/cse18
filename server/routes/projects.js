const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

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

// GET all projects for user
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ]
    })
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ createdAt: -1 });

    // Get task counts for each project
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const taskStats = await Task.aggregate([
        { $match: { project: project._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        total: 0,
        todo: 0,
        'in-progress': 0,
        review: 0,
        done: 0
      };

      taskStats.forEach(stat => {
        stats.total += stat.count;
        if (stats.hasOwnProperty(stat._id)) {
          stats[stat._id] = stat.count;
        }
      });

      return { ...project.toObject(), taskStats: stats };
    }));

    res.json({ success: true, data: projectsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single project
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE project
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, priority, color, endDate, members } = req.body;

    const project = await Project.create({
      name,
      description,
      priority,
      color,
      endDate,
      owner: req.userId,
      members: members || []
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json({ success: true, data: populatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE project
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, status, priority, color, endDate, members } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, priority, color, endDate, members },
      { new: true, runValidators: true }
    )
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE project
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.owner.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ project: req.params.id });
    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADD member to project
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.members.includes(user._id)) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    project.members.push(user._id);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;