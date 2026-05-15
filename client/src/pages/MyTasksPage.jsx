import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { format, isPast, parseISO } from 'date-fns';
import { CheckSquare, AlertCircle, Clock, Filter } from 'lucide-react';

const STATUSES = ['All', 'Todo', 'In Progress', 'Review', 'Done'];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/tasks/my');
        setTasks(data.tasks);
      } catch {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const overdueTasks = tasks.filter(t =>
    t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'Done'
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">{tasks.length} tasks assigned to you</p>
        </div>
      </div>

      {/* Overdue warning */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">
              {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
            </p>
            <p className="text-red-400/70 text-xs mt-0.5">
              {overdueTasks.map(t => t.title).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === s
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-surface-hover border border-transparent'
            }`}
            onClick={() => setFilter(s)}
          >
            {s}
            <span className="ml-1.5 text-xs opacity-60">
              {s === 'All' ? tasks.length : tasks.filter(t => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-white font-medium">No tasks here</p>
          <p className="text-slate-500 text-sm mt-1">
            {filter === 'All' ? 'No tasks assigned to you yet' : `No ${filter} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'Done';
            return (
              <div
                key={task._id}
                className={`card p-4 flex items-start gap-4 transition-all hover:border-surface-border ${
                  isOverdue ? 'border-red-500/20' : ''
                }`}
              >
                {/* Status toggle */}
                <div className="flex flex-col gap-1 flex-shrink-0 pt-0.5">
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    task.status === 'Done' ? 'bg-emerald-500 border-emerald-500' : 'border-surface-border'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </p>
                    {isOverdue && (
                      <span className="flex-shrink-0 badge bg-red-500/20 text-red-400">
                        <Clock className="w-2.5 h-2.5" /> Overdue
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-500 mb-2 truncate">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {task.project && (
                      <Link
                        to={`/projects/${task.project._id}`}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                        style={{ color: task.project.color || undefined }}
                      >
                        {task.project.name}
                      </Link>
                    )}
                    {task.dueDate && (
                      <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                        Due {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status select */}
                <select
                  value={task.status}
                  onChange={e => updateStatus(task._id, e.target.value)}
                  className="text-xs bg-surface-hover border border-surface-border rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 flex-shrink-0"
                >
                  <option>Todo</option>
                  <option>In Progress</option>
                  <option>Review</option>
                  <option>Done</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
