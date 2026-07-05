import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiCalendar, FiFlag, FiFilter } from 'react-icons/fi';

export default function MyTasks() {
  const { authFetch } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    const res = await authFetch('/api/tasks/my-tasks');
    if (res.success) setTasks(res.data);
    setLoading(false);
  };

  const handleToggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await authFetch(`/api/tasks/${task._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    loadTasks();
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDueDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statusBadge = (status) => {
    const map = { 'todo': 'badge-todo', 'in-progress': 'badge-in-progress', 'review': 'badge-review', 'done': 'badge-done' };
    const labels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
    return <span className={`badge ${map[status] || 'badge-todo'}`}>{labels[status] || status}</span>;
  };

  const priorityBadge = (priority) => <span className={`badge badge-${priority}`}>{priority}</span>;

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner"></div></div>;
  }

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p>{doneTasks} of {totalTasks} completed ({progressPercent}%)</p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <FiCheckSquare style={{ color: 'var(--success)', fontSize: '18px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{
              height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', width: `${progressPercent}%`, background: 'var(--success)',
                borderRadius: '4px', transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)', flexShrink: 0 }}>{progressPercent}%</span>
        </div>
      </div>

      {/* 过滤 */}
      <div className="filter-bar">
        <FiFilter style={{ color: 'var(--text-muted)', width: '16px' }} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* 任务列表 */}
      {filteredTasks.length > 0 ? (
        <div className="task-list">
          {filteredTasks.map(task => (
            <div
              key={task._id}
              className="task-list-item"
              style={{ opacity: task.status === 'done' ? 0.6 : 1 }}
            >
              <div
                className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                onClick={() => handleToggleDone(task)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="task-info">
                <h4 style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                  {task.title}
                </h4>
                <div className="task-project-name">
                  <Link to={`/projects/${task.project?._id}/board`} style={{ color: 'var(--text-muted)' }}>
                    {task.project?.name || 'Unknown Project'}
                  </Link>
                  {task.dueDate && (
                    <span style={{ marginLeft: '12px', color: isOverdue(task) ? 'var(--danger)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiCalendar style={{ width: '11px', height: '11px' }} />
                      {formatDueDate(task.dueDate)}
                      {isOverdue(task) && ' (Overdue)'}
                    </span>
                  )}
                </div>
              </div>
              <div className="task-badges">
                {priorityBadge(task.priority)}
                {statusBadge(task.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FiCheckSquare style={{ width: 64, height: 64 }} />
          <h3>{filterStatus !== 'all' || filterPriority !== 'all' ? 'No matching tasks' : 'No tasks assigned'}</h3>
          <p>{filterStatus !== 'all' || filterPriority !== 'all' ? 'Try changing the filters' : 'Tasks assigned to you will appear here'}</p>
        </div>
      )}
    </div>
  );
}