import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiPlus, FiArrowLeft, FiCalendar, FiMessageSquare,
  FiClock, FiFlag, FiTrash2, FiEdit2, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#999999' },
  { id: 'in-progress', label: 'In Progress', color: '#06B6D4' },
  { id: 'review', label: 'Review', color: '#A855F7' },
  { id: 'done', label: 'Done', color: '#10B981' }
];

const PRIORITY_COLORS = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

export default function ProjectBoard() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: 'todo',
    dueDate: '', tags: '', assignee: ''
  });
  const [commentText, setCommentText] = useState('');

  useEffect(() => { loadBoard(); }, [id]);

  const loadBoard = async () => {
    const [projectRes, tasksRes] = await Promise.all([
      authFetch(`/api/projects/${id}`),
      authFetch(`/api/tasks/project/${id}`)
    ]);
    if (projectRes.success) setProject(projectRes.data);
    if (tasksRes.success) setTasks(tasksRes.data);
    setLoading(false);
  };

  const openCreateTask = (status = 'todo') => {
    setForm({ title: '', description: '', priority: 'medium', status, dueDate: '', tags: '', assignee: '' });
    setShowTaskModal(true);
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setCommentText('');
    setShowDetailModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const res = await authFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        project: id,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      })
    });

    if (res.success) {
      toast.success('Task created');
      setShowTaskModal(false);
      loadBoard();
    } else {
      toast.error(res.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (updates) => {
    const res = await authFetch(`/api/tasks/${selectedTask._id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    if (res.success) {
      setSelectedTask(res.data);
      loadBoard();
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Delete this task?')) return;
    const res = await authFetch(`/api/tasks/${selectedTask._id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Task deleted');
      setShowDetailModal(false);
      loadBoard();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const res = await authFetch(`/api/tasks/${selectedTask._id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text: commentText })
    });
    if (res.success) {
      setCommentText('');
      // 重新加载任务详情
      const taskRes = await authFetch(`/api/tasks/${selectedTask._id}`);
      if (taskRes.success) setSelectedTask(taskRes.data);
    }
  };

  const handleStatusChange = async (newStatus) => {
    await handleUpdateTask({ status: newStatus });
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const formatDueDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner"></div></div>;
  }

  if (!project) {
    return <div className="empty-state"><h3>Project not found</h3><Link to="/projects">Back to Projects</Link></div>;
  }

  return (
    <div>
      {/* 头部 */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/projects" className="btn btn-ghost btn-sm"><FiArrowLeft /></Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: project.color }}></div>
              <h1>{project.name}</h1>
              <span className={`badge badge-${project.priority}`}>{project.priority}</span>
            </div>
            {project.description && <p style={{ marginTop: '4px' }}>{project.description}</p>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => openCreateTask()}>
          <FiPlus /> Add Task
        </button>
      </div>

      {/* 看板 */}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <div className="col-title">
                  <div className="col-dot" style={{ background: col.color }}></div>
                  {col.label}
                </div>
                <span className="col-count">{colTasks.length}</span>
              </div>
              <div className="kanban-column-body">
                {colTasks.map(task => (
                  <div
                    key={task._id}
                    className="task-card"
                    onClick={() => openTaskDetail(task)}
                    style={{ position: 'relative', paddingLeft: '18px' }}
                  >
                    <div className="task-card-priority" style={{ background: PRIORITY_COLORS[task.priority] }}></div>
                    {task.tags?.length > 0 && (
                      <div className="task-card-tags">
                        {task.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="task-card-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    <h4>{task.title}</h4>
                    <div className="task-card-footer">
                      <div className="task-card-assignee" style={{ background: task.assignee ? undefined : 'var(--bg-elevated)', color: task.assignee ? undefined : 'var(--text-muted)' }}>
                        {task.assignee ? getInitials(task.assignee.name) : <FiClock style={{ width: '12px', height: '12px' }} />}
                      </div>
                      {task.dueDate && (
                        <div className={`task-card-due ${isOverdue(task) ? 'overdue' : ''}`}>
                          <FiCalendar style={{ width: '11px', height: '11px' }} />
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                      {task.comments?.length > 0 && (
                        <div className="task-card-due">
                          <FiMessageSquare style={{ width: '11px', height: '11px' }} />
                          {task.comments.length}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', opacity: 0.5, fontSize: '13px' }}
                  onClick={() => openCreateTask(col.id)}
                >
                  <FiPlus /> Add task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 创建任务Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Task</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    placeholder="What needs to be done?"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Add details..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    placeholder="e.g., frontend, bug, urgent"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 任务详情Modal */}
      {showDetailModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '20px', borderRadius: '2px', background: PRIORITY_COLORS[selectedTask.priority] }}></div>
                <h2>{selectedTask.title}</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDetailModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              {/* 状态和优先级快捷切换 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  style={{ width: 'auto', minWidth: '140px', fontSize: '13px', padding: '6px 30px 6px 10px' }}
                >
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => handleUpdateTask({ priority: e.target.value })}
                  style={{ width: 'auto', minWidth: '120px', fontSize: '13px', padding: '6px 30px 6px 10px' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* 描述 */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Description</label>
                <p style={{ marginTop: '6px', fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              {/* 元信息 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignee</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedTask.assignee ? (
                      <>
                        <div className="avatar-lg" style={{ width: '24px', height: '24px', fontSize: '9px' }}>{getInitials(selectedTask.assignee.name)}</div>
                        {selectedTask.assignee.name}
                      </>
                    ) : 'Unassigned'}
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</div>
                  <div style={{ color: isOverdue(selectedTask) ? 'var(--danger)' : 'inherit' }}>
                    {selectedTask.dueDate ? formatDueDate(selectedTask.dueDate) : 'Not set'}
                    {isOverdue(selectedTask) && ' (Overdue)'}
                  </div>
                </div>
              </div>

              {/* 标签 */}
              {selectedTask.tags?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Tags</label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {selectedTask.tags.map((tag, i) => (
                      <span key={i} className="task-card-tag" style={{ fontSize: '12px', padding: '4px 10px' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 评论区 */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '10px', display: 'block' }}>
                  Comments ({selectedTask.comments?.length || 0})
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddComment())}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleAddComment} style={{ flexShrink: 0 }}>Send</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedTask.comments?.map((comment, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <div className="avatar-lg" style={{ width: '28px', height: '28px', fontSize: '10px', flexShrink: 0 }}>
                        {comment.user ? getInitials(comment.user.name) : '??'}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>
                          {comment.user?.name || 'Unknown'}
                          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px', fontSize: '11px' }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{comment.text}</div>
                      </div>
                    </div>
                  ))}
                  {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>No comments yet</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm" onClick={handleDeleteTask}><FiTrash2 /> Delete</button>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}