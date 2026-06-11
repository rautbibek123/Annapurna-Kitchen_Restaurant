import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { UserPlus, Trash2, Shield, User, UserCheck } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      toast("Failed to load staff list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast("Staff member created successfully!", "success");
        setShowForm(false);
        setFormData({ name: '', email: '', password: '', role: 'staff' });
        fetchUsers();
      } else {
        toast(data.message || "Failed to create user", "error");
      }
    } catch (err) {
      toast("Network error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}? They will no longer be able to log in.`)) return;
    
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast("User deactivated", "success");
        fetchUsers();
      } else {
        toast(data.message || "Failed to deactivate", "error");
      }
    } catch (err) {
      toast("Network error", "error");
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield size={16} style={{marginRight: '8px', color: '#E74C3C'}} />;
    if (role === 'manager') return <UserCheck size={16} style={{marginRight: '8px', color: 'var(--color-gold)'}} />;
    return <User size={16} style={{marginRight: '8px', color: 'var(--color-primary)'}} />;
  };

  return (
    <div className="mgmt-container">
      <div className="mgmt-header">
        <h1 className="mgmt-title">Staff Management</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : <><UserPlus size={18} /> Add New Staff</>}
        </button>
      </div>

      {showForm && (
        <div className="glass-card mgmt-form-card">
          <h3 className="mgmt-form-title">Create New Account</h3>
          <form onSubmit={handleCreateUser} className="mgmt-grid-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Temporary Password</label>
              <input type="password" className="form-input" required minLength="6" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="staff">Staff (POS & Reservations Only)</option>
                <option value="manager">Manager (POS, Reservations, Staff)</option>
                {currentUser?.role === 'admin' && <option value="admin">Admin (Full Access)</option>}
              </select>
            </div>
            <div style={{gridColumn: '1 / -1', marginTop: '10px'}}>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{width: '100%'}}>
                {isSubmitting ? <span className="spinner" /> : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card mgmt-table-container">
        {loading ? (
          <div className="dashboard-empty">Loading staff data...</div>
        ) : (
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="mgmt-table-user">
                      <div className="mgmt-table-avatar">{u.name.charAt(0)}</div>
                      <span>{u.name} {currentUser?.email === u.email && '(You)'}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`mgmt-role-badge mgmt-role-${u.role}`}>
                      {getRoleIcon(u.role)} {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${u.active ? 'confirmed' : 'cancelled'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {u.active && u.email !== currentUser?.email && currentUser?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeactivate(u._id, u.name)}
                        className="portal-logout-btn"
                        style={{ color: '#e74c3c' }}
                        title="Deactivate User"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="dashboard-empty">No staff members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
