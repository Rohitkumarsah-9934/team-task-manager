const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

// @GET /api/projects — all projects for current user
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const taskCount = await Task.countDocuments({ project: p._id });
      const completedCount = await Task.countDocuments({ project: p._id, status: 'Done' });
      return {
        ...p.toObject(),
        taskCount,
        completedCount
      };
    }));

    res.json({ projects: projectsWithCounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects — create new project
router.post('/', protect, [
  body('name').trim().isLength({ min: 1 }).withMessage('Project name is required'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, dueDate, color } = req.body;
    const project = await Project.create({
      name,
      description,
      dueDate,
      color: color || '#6366f1',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }]
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/projects/:id
router.get('/:id', protect, requireProjectMember, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/projects/:id — update project (Admin only)
router.put('/:id', protect, requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('status').optional().isIn(['Active', 'Completed', 'On Hold', 'Archived'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, status, dueDate, color } = req.body;
    const project = await Project.findById(req.params.id);

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (color) project.color = color;

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id — delete project (owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can delete it' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects/:id/members — add member (Admin only)
router.post('/:id/members', protect, requireProjectAdmin, [
  body('userId').notEmpty(),
  body('role').optional().isIn(['Admin', 'Member'])
], async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = req.project;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const alreadyMember = project.members.some(m => m.user.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: userId, role: role || 'Member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/projects/:id/members/:userId — update member role (Admin only)
router.put('/:id/members/:userId', protect, requireProjectAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const project = req.project;
    const member = project.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    // Can't demote the owner
    if (project.owner.toString() === req.params.userId && role === 'Member') {
      return res.status(400).json({ message: 'Cannot change owner role to Member' });
    }

    member.role = role;
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id/members/:userId — remove member (Admin only)
router.delete('/:id/members/:userId', protect, requireProjectAdmin, async (req, res) => {
  try {
    const project = req.project;

    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
