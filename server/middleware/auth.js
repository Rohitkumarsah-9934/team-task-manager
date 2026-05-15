const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Check if user is Admin in a project
const requireProjectAdmin = async (req, res, next) => {
  const Project = require('../models/Project');
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if user is a member of project
const requireProjectMember = async (req, res, next) => {
  const Project = require('../models/Project');
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. Not a project member.' });
    }

    req.project = project;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { protect, requireProjectAdmin, requireProjectMember };
