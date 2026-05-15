const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Member'],
    default: 'Member'
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold', 'Archived'],
    default: 'Active'
  },
  dueDate: {
    type: Date
  },
  color: {
    type: String,
    default: '#6366f1'
  }
}, { timestamps: true });

// Ensure owner is always a member with Admin role
projectSchema.pre('save', function (next) {
  const ownerExists = this.members.some(
    m => m.user.toString() === this.owner.toString()
  );
  if (!ownerExists) {
    this.members.push({ user: this.owner, role: 'Admin' });
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
