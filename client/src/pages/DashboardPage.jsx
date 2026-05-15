import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { format, isAfter, parseISO } from 'date-fns';
import {
  CheckSquare, Clock, AlertTriangle, FolderKanban,
  ArrowRight, TrendingUp, Circle
} from 'lucide-react';

const statusConfig = {
  Todo: { label: 'Todo', cls: 'status-todo' },
  'In Progress': { label: 'In Progress', cls: 'status-inprogress' },
  Review: { label: 'Review', cls: 'status-review' },
  Done: { label: 'Done', cls: 'status-done' },
};

const priorityConfig = {
  Low: { cls: 'priority-low' },
  Medium: { cls: 'priority-medium' },
  High: { cls: 'priority-high' },
  Critical: { cls: 'priority-critical' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/tasks/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats?.stats.total || 0,
      icon: CheckSquare,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
      border: 'border-brand-500/20'
    },
    {
      label: 'In Progress',
      value: stats?.stats.inProgress || 0,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      label: 'Overdue',
      value: stats?.stats.overdue || 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20'
    },
    {
      label: 'Completed',
      value: stats?.stats.done || 0,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening with your tasks today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`card p-5 border ${card.border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">{card.label}</p>
                  <p className="text-3xl font-bold text-white">{card.value}</p>
                </div>
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion bar */}
      {stats?.stats.total > 0 && (
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-white">Overall Progress</span>
            <span className="text-sm text-slate-400">
              {stats.stats.done} / {stats.stats.total} tasks done
            </span>
          </div>
          <div className="w-full bg-surface-hover rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((stats.stats.done / stats.stats.total) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {Math.round((stats.stats.done / stats.stats.total) * 100)}% complete
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">My Recent Tasks</h2>
            <Link to="/my-tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats?.myTasks?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.myTasks?.map(task => (
                <div key={task._id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                  <Circle className="w-4 h-4 mt-0.5 text-slate-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`badge ${statusConfig[task.status]?.cls}`}>{task.status}</span>
                      <span className={`badge ${priorityConfig[task.priority]?.cls}`}>{task.priority}</span>
                      {task.project && (
                        <span className="text-xs text-slate-500">{task.project.name}</span>
                      )}
                    </div>
                  </div>
                  {task.dueDate && (
                    <span className={`text-xs flex-shrink-0 ${
                      isAfter(new Date(), parseISO(task.dueDate)) && task.status !== 'Done'
                        ? 'text-red-400'
                        : 'text-slate-500'
                    }`}>
                      {format(parseISO(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects overview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">My Projects</h2>
            <Link to="/projects" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats?.projects?.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.projects?.slice(0, 5).map(project => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors group"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  />
                  <span className="text-sm text-white flex-1 truncate group-hover:text-brand-300 transition-colors">
                    {project.name}
                  </span>
                  <span className={`badge ${
                    project.status === 'Active' ? 'status-inprogress' :
                    project.status === 'Completed' ? 'status-done' : 'status-todo'
                  }`}>
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
