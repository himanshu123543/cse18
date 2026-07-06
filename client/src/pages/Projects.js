import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiPlus,
  FiSearch,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiFolder,
  FiCheckSquare
} from "react-icons/fi";
import toast from 'react-hot-toast';

const PROJECT_COLORS = ['#E8A838', '#10B981', '#06B6D4', '#A855F7', '#EF4444', '#F97316', '#EC4899', '#14B8A6'];

export default function Projects() {
  const { authFetch } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium', color: '#E8A838', endDate: '' });
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    const res = await authFetch('/api/projects');
    if (res.success) setProjects(res.data);
    setLoading(false);
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', priority: 'medium', color: '#E8A838', endDate: '' });
    setShowModal(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || '',
      priority: project.priority,
      color: project.color,
      endDate: project.endDate ? project.endDate.split('T')[0] : ''
    });
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This will delete all tasks in this project.')) return;
    const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Project deleted');
      loadProjects();
    } else {
      toast.error(res.message || 'Failed to delete');
    }
    setOpenMenu(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const url = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects';
    const method = editingProject ? 'PUT' : 'POST';

    const res = await authFetch(url, {
      method,
      body: JSON.stringify({
        ...form,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null
      })
    });

    if (res.success) {
      toast.success(editingProject ? 'Project updated' : 'Project created');
      setShowModal(false);
      loadProjects();
    } else {
      toast.error(res.message || 'Operation failed');
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="page-header-actions">
          <div className="search-box">
            <FiSearch />
            <input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> New Project
          </button>
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-card-color" style={{ background: project.color }}></div>
              <div className="project-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3>
                    <span className={`badge badge-${project.priority}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {project.priority}
                    </span>
                    <Link to={`/projects/${project._id}/board`} style={{ color: 'inherit' }}>
                      {project.name}
                    </Link>
                  </h3>
                  <div style={{ position: 'relative' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setOpenMenu(openMenu === project._id ? null : project._id)}
                      style={{ padding: '4px' }}
                    >
                      <FiMoreVertical />
                    </button>
                    {openMenu === project._id && (
                      <div className="dropdown-menu" style={{ right: 0, top: '100%' }}>
                        <button onClick={() => openEdit(project)}><FiEdit2 /> Edit</button>
                        <button className="danger" onClick={() => handleDelete(project._id)}><FiTrash2 /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="project-desc">{project.description || 'No description'}</p>
                <div className="project-card-meta">
                  <div className="project-card-members">
                    {[project.owner, ...project.members].slice(0, 4).map((member, i) => (
                      <div key={member?._id || i} className="avatar" style={{ background: PROJECT_COLORS[i % PROJECT_COLORS.length] }}>
                        {member?.name ? getInitials(member.name) : '?'}
                      </div>
                    ))}
                  </div>
                  <div className="project-card-stats">
                    <span>
                      <FiCheckSquare style={{ width: '12px' }} />
                      {project.taskStats?.done || 0}/{project.taskStats?.total || 0}
                    </span>
                    {project.endDate && (
                      <span>{new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FiFolder style={{ width: 64, height: 64 }} />
          <h3>{search ? 'No matching projects' : 'No projects yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Create your first project to get started'}</p>
          {!search && <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openCreate}>
            <FiPlus /> Create Project
          </button>}
        </div>
      )}

      {/* 创建/编辑Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    placeholder="e.g., Website Redesign"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe the project goals..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker">
                    {PROJECT_COLORS.map(c => (
                      <div
                        key={c}
                        className={`color-option ${form.color === c ? 'selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setForm({ ...form, color: c })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Update' : 'Create'} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
        .dropdown-menu {
          position: absolute;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 4px;
          min-width: 140px;
          z-index: 50;
          box-shadow: var(--shadow-lg);
          animation: fadeIn 0.15s ease;
        }
        .dropdown-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: var(--transition);
          font-family: var(--font-body);
        }
        .dropdown-menu button:hover { background: var(--bg-card); }
        .dropdown-menu button.danger { color: var(--danger); }
        .dropdown-menu button.danger:hover { background: var(--danger-bg); }
        .dropdown-menu button svg { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
}