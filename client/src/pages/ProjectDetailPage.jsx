import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus, Users, Settings, Trash2, X, Search,
  ChevronLeft, Loader2, Calendar, Flag, MessageSquare,
  UserPlus, Crown, Shield
} from 'lucide-react';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const statusColors = {
  'Todo': '#64748b',
  'In Progress': '#3b82f6',
  'Review': '#f59e0b',
  'Done': '#10b981'
};

const priorityColors = {
  Low: '#64748b', Medium: '#3b82f6', High: '#f97316', Critical: '#ef4444'
};

// ---- TaskCard ----
function TaskCard({ task, onEdit, onDelete, isAdmin, currentUserId }) {
  const canEdit = isAdmin || task.createdBy?._id === currentUserId || task.assignedTo?._id === currentUserId;
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-3 hover:border-brand-500/30 transition-all group cursor-pointer" onClick={() => onEdit(task)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-white font-medium leading-snug flex-1">{task.title}</p>
        {canEdit && (
          <button
            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            onClick={e => { e.stopPropagation(); onDelete(task._id); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="badge text-xs"
          style={{ backgroundColor: `${priorityColors[task.priority]}20`, color: priorityColors[task.priority] }}
        >
          <Flag className="w-2.5 h-2.5" /> {task.priority}
        </span>

        {task.dueDate && (
          <span className="badge bg-surface-hover text-slate-400">
            <Calendar className="w-2.5 h-2.5" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}

        {task.comments?.length > 0 && (
          <span className="badge bg-surface-hover text-slate-400">
            <MessageSquare className="w-2.5 h-2.5" /> {task.comments.length}
          </span>
        )}
      </div>

      {task.assignedTo && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold">
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-xs text-slate-500 truncate">{task.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
}

// ---- TaskModal ----
function TaskModal({ task, project, onClose, onSaved, onDeleted, members, isAdmin, currentUserId }) {
  const isNew = !task;
  const canFullEdit = isNew || isAdmin || task?.createdBy?._id === currentUserId;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Todo',
    priority: task?.priority || 'Medium',
    assignedTo: task?.assignedTo?._id || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tags: task?.tags?.join(', ') || ''
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState(task?.comments || []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        project: project._id,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignedTo: form.assignedTo || null
      };
      let data;
      if (isNew) {
        ({ data } = await api.post('/tasks', payload));
        toast.success('Task created!');
      } else {
        ({ data } = await api.put(`/tasks/${task._id}`, payload));
        toast.success('Task updated!');
      }
      onSaved(data.task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { text: comment });
      setComments(data.comments);
      setComment('');
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-border sticky top-0 bg-surface-card z-10">
          <h2 className="font-semibold text-white">{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              className="input-field"
              placeholder="Task title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              disabled={!canFullEdit && !isNew}
              autoFocus={isNew}
            />
          </div>

          {canFullEdit && (
            <div>
              <label className="label">Description</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Describe the task..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input-field"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                disabled={!canFullEdit}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {canFullEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Assign To</label>
                  <select
                    className="input-field"
                    value={form.assignedTo}
                    onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Tags (comma-separated)</label>
                <input
                  className="input-field"
                  placeholder="bug, feature, urgent"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isNew ? 'Create Task' : 'Save Changes')}
            </button>
          </div>
        </form>

        {/* Comments section for existing tasks */}
        {!isNew && task && (
          <div className="border-t border-surface-border p-5">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
            </h3>

            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {comments.map(c => (
                <div key={c._id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/20 flex-shrink-0 flex items-center justify-center text-xs text-brand-400 font-bold">
                    {c.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">{c.user?.name}</span>
                      <span className="text-xs text-slate-500">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs text-slate-500">No comments yet</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                className="input-field flex-1 text-xs py-2"
                placeholder="Add a comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              />
              <button className="btn-primary px-3 py-2" onClick={handleAddComment}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Add Member Modal ----
function AddMemberModal({ project, onClose, onAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);

  const searchUsers = async (q) => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${q}`);
      const existing = project.members.map(m => m.user._id);
      setResults(data.users.filter(u => !existing.includes(u._id)));
    } catch { } finally { setSearching(false); }
  };

  const addMember = async (userId) => {
    setAdding(userId);
    try {
      const { data } = await api.post(`/projects/${project._id}/members`, { userId, role: 'Member' });
      toast.success('Member added!');
      onAdded(data.project);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally { setAdding(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Add Member</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input-field pl-9"
            placeholder="Search by name or email..."
            value={query}
            onChange={e => { setQuery(e.target.value); searchUsers(e.target.value); }}
            autoFocus
          />
        </div>

        <div className="space-y-2 min-h-[80px]">
          {searching && <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-400" /></div>}
          {!searching && results.length === 0 && query.length >= 2 && (
            <p className="text-xs text-slate-500 text-center py-4">No users found</p>
          )}
          {results.map(user => (
            <div key={user._id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-hover">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                className="btn-primary px-3 py-1.5 text-xs"
                onClick={() => addMember(user._id)}
                disabled={adding === user._id}
              >
                {adding === user._id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`)
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentUserRole = project?.members?.find(m => m.user._id === user?._id)?.role;
  const isAdmin = currentUserRole === 'Admin';

  const handleTaskSaved = (savedTask) => {
    setTasks(prev => {
      const exists = prev.find(t => t._id === savedTask._id);
      if (exists) return prev.map(t => t._id === savedTask._id ? savedTask : t);
      return [savedTask, ...prev];
    });
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const { data } = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(data.project);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'Member' : 'Admin';
    try {
      const { data } = await api.put(`/projects/${id}/members/${userId}`, { role: newRole });
      setProject(data.project);
      toast.success(`Role changed to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-surface-border bg-surface-card">
        <button onClick={() => navigate('/projects')} className="text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
          <h1 className="font-bold text-white truncate">{project.name}</h1>
          <span className={`badge hidden sm:inline-flex ${
            project.status === 'Active' ? 'status-inprogress' :
            project.status === 'Completed' ? 'status-done' : 'status-todo'
          }`}>{project.status}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary flex items-center gap-2 text-sm"
            onClick={() => setShowMembers(!showMembers)}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{project.members?.length}</span>
          </button>
          {isAdmin && (
            <button
              className="btn-primary flex items-center gap-2 text-sm"
              onClick={() => setTaskModal('new')}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div className="bg-surface-card border-b border-surface-border px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Team Members</h3>
            {isAdmin && (
              <button
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                onClick={() => setShowAddMember(true)}
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Member
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {project.members?.map(m => (
              <div key={m.user._id} className="flex items-center gap-2 bg-surface-hover rounded-lg px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
                  {m.user.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-white font-medium">{m.user.name}</p>
                  <div className="flex items-center gap-1">
                    {m.role === 'Admin' ? (
                      <Crown className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Shield className="w-3 h-3 text-slate-500" />
                    )}
                    <span className="text-xs text-slate-500">{m.role}</span>
                  </div>
                </div>
                {isAdmin && m.user._id !== project.owner._id && m.user._id !== user._id && (
                  <div className="flex gap-1 ml-1">
                    <button
                      className="text-slate-500 hover:text-amber-400 transition-colors"
                      onClick={() => handleToggleRole(m.user._id, m.role)}
                      title={`Make ${m.role === 'Admin' ? 'Member' : 'Admin'}`}
                    >
                      <Crown className="w-3 h-3" />
                    </button>
                    <button
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      onClick={() => handleRemoveMember(m.user._id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-surface-border bg-surface-card">
        {['board', 'list'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{tasks.length} tasks total</span>
      </div>

      {/* Board View */}
      {activeTab === 'board' && (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {STATUSES.map(status => (
              <div key={status} className="w-72 flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                  <span className="text-sm font-medium text-white">{status}</span>
                  <span className="ml-auto text-xs text-slate-500 bg-surface-hover px-2 py-0.5 rounded-full">
                    {tasksByStatus[status].length}
                  </span>
                </div>

                {/* Add task button for this column */}
                {isAdmin && (
                  <button
                    className="flex items-center gap-2 w-full p-2 rounded-lg text-slate-500 hover:text-white hover:bg-surface-hover transition-all text-xs mb-2 border border-dashed border-surface-border"
                    onClick={() => setTaskModal({ status })}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add task
                  </button>
                )}

                {/* Task cards */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {tasksByStatus[status].map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={setTaskModal}
                      onDelete={handleDeleteTask}
                      isAdmin={isAdmin}
                      currentUserId={user._id}
                    />
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div className="text-center py-6 text-slate-600 text-xs">No tasks here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Task</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden md:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Assigned</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide hidden lg:table-cell">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr
                    key={task._id}
                    className="border-b border-surface-border last:border-0 hover:bg-surface-hover cursor-pointer transition-colors"
                    onClick={() => setTaskModal(task)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 truncate max-w-xs">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`badge ${
                        task.status === 'Todo' ? 'status-todo' :
                        task.status === 'In Progress' ? 'status-inprogress' :
                        task.status === 'Review' ? 'status-review' : 'status-done'
                      }`}>{task.status}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${
                        task.priority === 'Low' ? 'priority-low' :
                        task.priority === 'Medium' ? 'priority-medium' :
                        task.priority === 'High' ? 'priority-high' : 'priority-critical'
                      }`}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
                            {task.assignedTo.name[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-300">{task.assignedTo.name}</span>
                        </div>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {task.dueDate ? (
                        <span className="text-xs text-slate-400">{format(new Date(task.dueDate), 'MMM d')}</span>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No tasks yet. {isAdmin && 'Click "New Task" to create one.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskModal !== null && (
        <TaskModal
          task={taskModal === 'new' || (taskModal && taskModal.status && !taskModal._id) ? null : taskModal}
          project={project}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
          onDeleted={handleDeleteTask}
          members={project.members}
          isAdmin={isAdmin}
          currentUserId={user._id}
        />
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          project={project}
          onClose={() => setShowAddMember(false)}
          onAdded={(updatedProject) => { setProject(updatedProject); setShowAddMember(false); }}
        />
      )}
    </div>
  );
}
