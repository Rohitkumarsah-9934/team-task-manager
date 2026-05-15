const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect, requireProjectMember } = require('../middleware/auth');

// Helper: check if user is project member
const getProjectMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, role: null };
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return { project, role: member ? member.role : null };
};

// @GET /api/tasks?project=id&status=&priority=&assignedTo=
router.get('/', protect, async (req, res) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    if (!project) return res.status(400).json({ message: 'Project ID required' });

    const { project: proj, role } = await getProjectMembership(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Not a project member' });

    const filter = { project };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tasks/my — tasks assigned to current user
router.get('/my', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name color')
      .populate('createdBy', 'name email avatar')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tasks
router.post('/', protect, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Review', 'Done']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { project } = req.body;
    const { role } = await getProjectMembership(project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Not a project member' });

    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color members')
      .populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { role } = await getProjectMembership(task.project._id, req.user._id);
    if (!role) return res.status(403).json({ message: 'Not a project member' });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { project, role } = await getProjectMembership(task.project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Not a project member' });

    // Members can only update status/comments on tasks assigned to them
    // Admins can update anything
    const isAdmin = role === 'Admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const allowedFields = isAdmin || isCreator
      ? ['title', 'description', 'assignedTo', 'status', 'priority', 'dueDate', 'tags']
      : ['status']; // Assignees can only update status

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { role } = await getProjectMembership(task.project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Not a project member' });

    const isAdmin = role === 'Admin';
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Only Admin or task creator can delete' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tasks/:id/comments
router.post('/:id/comments', protect, [
  body('text').trim().isLength({ min: 1 }).withMessage('Comment text is required')
], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { role } = await getProjectMembership(task.project, req.user._id);
    if (!role) return res.status(403).json({ message: 'Not a project member' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');
    res.status(201).json({ comments: task.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/tasks/:id/comments/:commentId
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      const { role } = await getProjectMembership(task.project, req.user._id);
      if (role !== 'Admin') return res.status(403).json({ message: 'Not authorized' });
    }

    comment.deleteOne();
    await task.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tasks/dashboard/stats — dashboard stats for current user
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const myTasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name color');

    const total = myTasks.length;
    const done = myTasks.filter(t => t.status === 'Done').length;
    const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
    const overdue = myTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
    ).length;

    const projects = await Project.find({ 'members.user': req.user._id })
      .select('name color status');

    res.json({
      stats: { total, done, inProgress, overdue },
      myTasks: myTasks.slice(0, 5),
      projects
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
