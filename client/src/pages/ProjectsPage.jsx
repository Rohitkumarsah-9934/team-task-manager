import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus, FolderKanban, Users, CheckSquare,
  Calendar, Loader2, MoreVertical, Trash2, Edit2
} from 'lucide-react';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#f97316'
];

const statusOptions = ['Active', 'Completed', 'On Hold', 'Archived'];

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', description: '', dueDate: '', color: '#6366f1', status: 'Active'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      toast.success('Project created!');
      onCreated(data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-5">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              className="input-field"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required autoFocus
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="What's this project about?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input-field"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-card scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm({ ...form, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (projectId, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p._id !== projectId));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-white font-medium mb-2">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-5">Create your first project to start organizing tasks</p>
          <button className="btn-primary inline-flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const progress = project.taskCount > 0
              ? Math.round((project.completedCount / project.taskCount) * 100)
              : 0;
            return (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="card p-5 hover:border-surface-border hover:bg-surface-hover transition-all group block"
              >
                {/* Color bar */}
                <div
                  className="w-full h-1 rounded-full mb-4 opacity-70"
                  style={{ backgroundColor: project.color }}
                />

                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <button
                    className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 -m-1 ml-2 flex-shrink-0"
                    onClick={(e) => handleDelete(project._id, e)}
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {project.description && (
                  <p className="text-slate-400 text-xs mb-4 line-clamp-2">{project.description}</p>
                )}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>{project.completedCount}/{project.taskCount} tasks</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-surface-border rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: project.color }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.members?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    {project.taskCount || 0}
                  </span>
                  {project.dueDate && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.dueDate), 'MMM d')}
                    </span>
                  )}
                  <span className={`badge ml-auto ${
                    project.status === 'Active' ? 'status-inprogress' :
                    project.status === 'Completed' ? 'status-done' :
                    project.status === 'On Hold' ? 'status-review' : 'status-todo'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => setProjects(prev => [p, ...prev])}
        />
      )}
    </div>
  );
}
