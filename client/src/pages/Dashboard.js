import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiFolder, FiCheckSquare, FiClock, FiAlertCircle,
  FiTrendingUp, FiArrowRight, FiPlus
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#E8A838', '#06B6D4', '#A855F7', '#10B981'];

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, projectsRes, tasksRes] = await Promise.all([
        authFetch('/api/tasks/stats/dashboard'),
        authFetch('/api/projects'),
        authFetch('/api/tasks/my-tasks')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (projectsRes.success) setProjects(projectsRes.data.slice(0, 4));
      if (tasksRes.success) setRecentTasks(tasksRes.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner"></div></div>;
  }

  const chartData = stats ? [
    { name: 'To Do', value: stats.todo },
    { name: 'In Progress', value: stats['in-progress'] },
    { name: 'Review', value: stats.review },
    { name: 'Done', value: stats.done }
  ] : [];

  const barData = projects.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '...' : p.name,
    total: p.taskStats?.total || 0,
    done: p.taskStats?.done || 0
  }));

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDueDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statusBadge = (status) => {
    const map = { 'todo': 'badge-todo', 'in-progress': 'badge-in-progress', 'review': 'badge-review', 'done': 'badge-done' };
    const labels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
    return <span className={`badge ${map[status] || 'badge-todo'}`}>{labels[status] || status}</span>;
  };

  return (
    <div>
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h1>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}</h1>
          <p>Here's what's happening with your projects</p>
        </div>
        <div className="page-header-actions">
          <Link to="/projects" className="btn btn-primary">
            <FiPlus /> New Project
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--stat-color': 'var(--accent)' }}>
          <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
            <FiFolder />
          </div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Active Projects</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--info)' }}>
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <FiClock />
          </div>
          <div className="stat-value">{stats?.['in-progress'] || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--success)' }}>
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <FiCheckSquare />
          </div>
          <div className="stat-value">{stats?.done || 0}</div>
          <div className="stat-label">Completed</div>
        </div>

        <div className="stat-card" style={{ '--stat-color': 'var(--danger)' }}>
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <FiAlertCircle />
          </div>
          <div className="stat-value">{stats?.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {/* 图表区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '28px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiTrendingUp /> Project Progress
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={4}>
                <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#999', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#F0F0F0' }}
                />
                <Bar dataKey="total" fill="#2A2A2A" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="done" fill="#10B981" radius={[4, 4, 0, 0]} name="Done" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>No project data yet</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Task Distribution</h3>
          {chartData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>No tasks yet</p>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
            {chartData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }}></div>
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 项目 + 最近任务 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 最近项目 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>Recent Projects</h3>
            <Link to="/projects" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <FiArrowRight style={{ width: '14px' }} />
            </Link>
          </div>
          {projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map(project => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}/board`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', transition: 'var(--transition)',
                    color: 'inherit', textDecoration: 'none'
                  }}
                >
                  <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: project.color }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {project.taskStats?.done || 0}/{project.taskStats?.total || 0} tasks
                    </div>
                  </div>
                  <span className={`badge badge-${project.priority}`}>{project.priority}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px' }}>
              <p>No projects yet. Create your first project!</p>
            </div>
          )}
        </div>

        {/* 最近任务 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px' }}>My Recent Tasks</h3>
            <Link to="/my-tasks" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <FiArrowRight style={{ width: '14px' }} />
            </Link>
          </div>
          {recentTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentTasks.map(task => (
                <div
                  key={task._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {task.project?.name}
                      {task.dueDate && (
                        <span style={{ marginLeft: '8px', color: isOverdue(task) ? 'var(--danger)' : 'inherit' }}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  {statusBadge(task.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px' }}>
              <p>No tasks assigned to you yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}