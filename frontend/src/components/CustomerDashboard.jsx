import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarCheck, Clock, Users, CheckCircle, XCircle, 
  AlertCircle, LogIn, User, Settings, LayoutGrid, 
  Send, Plus, MapPin, Phone, Mail, Award, 
  History, Bell, ShieldCheck, ChevronRight, Star,
  UtensilsCrossed, CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import AuthModal from './AuthModal';
import { apiFetch } from '../lib/api';

const statusConfig = {
  pending:   { label: 'Pending',   color: '#f39c12', bg: 'rgba(243,156,18,0.1)',   icon: AlertCircle  },
  confirmed: { label: 'Confirmed', color: '#2ecc71', bg: 'rgba(46,204,113,0.1)',   icon: CheckCircle  },
  cancelled: { label: 'Cancelled', color: '#e74c3c', bg: 'rgba(231,76,60,0.1)',    icon: XCircle      },
};

const TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Table ${i + 1}`,
  image: `/images/tables/table${(i % 5) + 1}.png`,
  capacity: (i % 3 === 0) ? 2 : (i % 3 === 1) ? 4 : 6,
  description: (i % 3 === 0) ? 'Romantic window seat with mountain view' : 
               (i % 3 === 1) ? 'Comfortable booth for small groups' : 
               'Spacious table for family dining'
}));

export default function CustomerDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'reservations', 'book', 'profile'
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Booking Form State
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: '', time: '', guests: '2', message: '', phone: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const startEditing = (res) => {
    setEditingReservation(res);
    setBookingForm({
      date: res.date,
      time: res.time,
      guests: res.guests,
      message: res.message || '',
      phone: res.phone || ''
    });
    const table = TABLES.find(t => t.id === res.tableNumber);
    setSelectedTable(table || null);
    setActiveTab('book');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email });
      fetchMyReservations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyReservations = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/reservations/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setReservations(data.data);
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/auth/updateme', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        toast('Profile updated successfully!', 'success');
        updateUser(data.user);
      } else {
        toast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      toast('Network error', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTable) {
      toast('Please select a table first', 'error');
      return;
    }
    setBookingLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const url = editingReservation ? `/api/reservations/${editingReservation._id}` : '/api/reservations';
      const method = editingReservation ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...bookingForm,
          tableNumber: selectedTable.id,
          name: user.name,
          email: user.email
        })
      });
      const data = await res.json();
      if (data.success) {
        toast(editingReservation ? 'Reservation updated!' : 'Table booked successfully!', 'success');
        setActiveTab('reservations');
        fetchMyReservations();
        setSelectedTable(null);
        setEditingReservation(null);
        setBookingForm({ date: '', time: '', guests: '2', message: '', phone: '' });
      } else {
        toast(data.message || 'Action failed', 'error');
      }
    } catch (err) {
      toast('Network error', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-login-prompt">
        <div className="glass-card dashboard-login-card">
          <div className="dashboard-empty-icon">🏔️</div>
          <h2 className="dashboard-title">My Account</h2>
          <p className="dashboard-email">
            Sign in to manage your profile and track all your table reservations at Annapurna Kitchen.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setAuthOpen(true)}>
            <LogIn size={18} /> Sign In to Access Dashboard
          </button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </div>
    );
  }

  const upcomingReservations = reservations.filter(r => r.status !== 'cancelled');
  const pastReservations = reservations.filter(r => r.status === 'cancelled'); // Simplified for demo

  return (
    <div className="dashboard-container dashboard--enhanced">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🏔️</div>
          <div className="sidebar-title">Portal</div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutGrid size={20} /> Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            <CalendarDays size={20} /> My Bookings
          </button>
          <button 
            className={`nav-item ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => setActiveTab('book')}
          >
            <UtensilsCrossed size={20} /> Book Table
          </button>
          <div className="nav-separator">ACCOUNT</div>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} /> Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} /> Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogIn size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main-content">
        <header className="content-header">
          <div className="header-user">
            <div className="header-avatar">{user.name?.charAt(0)}</div>
            <div>
              <h2 className="header-name">Namaste, {user.name}</h2>
              <p className="header-sub">Welcome back to your kitchen dashboard.</p>
            </div>
          </div>
          <div className="header-meta">
            <div className="meta-badge">
              <Award size={16} /> Gold Member
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="tab-content"
            >
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="glass-card stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(241,196,15,0.1)', color: 'var(--color-gold)' }}>
                    <CalendarCheck size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Bookings</span>
                    <span className="stat-value">{reservations.length}</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(46,204,113,0.1)', color: '#2ecc71' }}>
                    <Star size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Loyalty Points</span>
                    <span className="stat-value">1,250</span>
                  </div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-icon" style={{ background: 'rgba(52,152,219,0.1)', color: '#3498db' }}>
                    <Award size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Next Reward</span>
                    <span className="stat-value">500 pts</span>
                  </div>
                </div>
              </div>

              {/* Loyalty Banner */}
              <div className="glass-card loyalty-banner">
                <div className="loyalty-content">
                  <h3>Mountain Gold Rewards</h3>
                  <p>You're only 250 points away from a complimentary appetizer! Keep dining to unlock more rewards.</p>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: '75%' }}></div>
                    <span className="progress-label">750 / 1000 Pts</span>
                  </div>
                </div>
                <div className="loyalty-visual">🏔️</div>
              </div>

              <div className="dashboard-flex-grid">
                {/* Recent Bookings */}
                <div className="recent-bookings-list">
                  <div className="section-title-row">
                    <h3>Recent Bookings</h3>
                    <button onClick={() => setActiveTab('reservations')} className="text-link">View All</button>
                  </div>
                  {reservations.length === 0 ? (
                    <div className="empty-state">No recent bookings</div>
                  ) : (
                    <div className="mini-cards">
                      {reservations.slice(0, 3).map(r => (
                        <div key={r._id} className="mini-card glass-card">
                          <div className="mini-card-icon">🍴</div>
                          <div className="mini-card-info">
                            <span className="mini-card-title">{r.date}</span>
                            <span className="mini-card-sub">{r.time} • {r.guests} guests</span>
                          </div>
                          <div className={`mini-card-status ${r.status || 'pending'}`}>
                            {r.status || 'pending'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-list">
                   <div className="section-title-row">
                     <h3>Quick Actions</h3>
                   </div>
                   <div className="action-grid-premium">
                     <motion.button 
                       whileHover={{ scale: 1.05, y: -5 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => setActiveTab('book')} 
                       className="premium-action-btn"
                       style={{ '--accent': 'var(--color-gold)' }}
                     >
                        <div className="action-icon-wrapper">
                          <Plus size={24} />
                        </div>
                        <span>Book Table</span>
                     </motion.button>
                     
                     <motion.button 
                       whileHover={{ scale: 1.05, y: -5 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => setActiveTab('profile')} 
                       className="premium-action-btn"
                       style={{ '--accent': '#3498db' }}
                     >
                        <div className="action-icon-wrapper">
                          <User size={24} />
                        </div>
                        <span>My Profile</span>
                     </motion.button>

                     <motion.button 
                       whileHover={{ scale: 1.05, y: -5 }}
                       whileTap={{ scale: 0.95 }}
                       className="premium-action-btn"
                       style={{ '--accent': '#2ecc71' }}
                     >
                        <div className="action-icon-wrapper">
                          <Bell size={24} />
                        </div>
                        <span>Notices</span>
                     </motion.button>

                     <motion.button 
                       whileHover={{ scale: 1.05, y: -5 }}
                       whileTap={{ scale: 0.95 }}
                       className="premium-action-btn"
                       style={{ '--accent': '#9b59b6' }}
                     >
                        <div className="action-icon-wrapper">
                          <ShieldCheck size={24} />
                        </div>
                        <span>Privacy</span>
                     </motion.button>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reservations' && (
            <motion.div 
              key="reservations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="tab-content"
            >
              <div className="section-header">
                <h2 className="section-title">My Bookings</h2>
                <button onClick={() => setActiveTab('book')} className="btn btn-primary btn-sm">
                  <Plus size={16} /> New Booking
                </button>
              </div>

              <div className="booking-filters">
                <button className="filter-btn active">Upcoming</button>
                <button className="filter-btn">Past</button>
                <button className="filter-btn">Cancelled</button>
              </div>

              {reservations.length === 0 ? (
                <div className="glass-card empty-dashboard-state">
                   <CalendarCheck size={48} />
                   <h3>No Bookings Found</h3>
                   <p>Start your culinary journey by booking a table today.</p>
                   <button onClick={() => setActiveTab('book')} className="btn btn-primary">Book Now</button>
                </div>
              ) : (
                <div className="reservations-list-enhanced">
                   {reservations.map(r => (
                     <div key={r._id} className="enhanced-booking-card glass-card">
                        <div className="card-main">
                           <div className="card-date-box">
                              <span className="month">{new Date(r.date).toLocaleString('default', { month: 'short' })}</span>
                              <span className="day">{new Date(r.date).getDate()}</span>
                           </div>
                           <div className="card-details">
                              <h4>Annapurna Kitchen Reservation</h4>
                              <div className="card-meta">
                                 <span><Clock size={14} /> {r.time}</span>
                                 <span><Users size={14} /> {r.guests} People</span>
                                 {r.tableNumber && <span><LayoutGrid size={14} /> Table #{r.tableNumber}</span>}
                              </div>
                              <div className={`card-status-badge ${r.status || 'pending'}`}>
                                 {r.status || 'pending'}
                              </div>
                           </div>
                        </div>
                        <div className="card-actions">
                           {r.status !== 'confirmed' && (
                             <button onClick={() => startEditing(r)} className="card-btn secondary">Edit</button>
                           )}
                           <button className="card-btn decline">Cancel</button>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'book' && (
            <motion.div 
              key="book"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="tab-content"
            >
              <div className="section-header">
                <h2 className="section-title">{editingReservation ? 'Modify Reservation' : 'Reserve a Table'}</h2>
                <p className="section-sub">
                  {editingReservation 
                    ? `Updating your booking for Table #${editingReservation.tableNumber}` 
                    : 'Select your preferred table and dining details.'}
                </p>
                {editingReservation && (
                  <button onClick={() => {
                    setEditingReservation(null);
                    setBookingForm({ date: '', time: '', guests: '2', message: '', phone: '' });
                    setSelectedTable(null);
                  }} className="btn btn-outline btn-sm" style={{ marginTop: '10px' }}>
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="table-map-container">
                 <div className="table-grid-enhanced">
                    {TABLES.map(table => (
                      <div 
                        key={table.id}
                        className={`enhanced-table-card glass-card ${selectedTable?.id === table.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTable(table)}
                      >
                         <div className="table-img-wrapper">
                            <img src={table.image} alt={table.name} />
                            <div className="table-tag">#{table.id}</div>
                         </div>
                         <div className="table-body">
                            <h5>{table.name}</h5>
                            <div className="table-capacity">
                               <Users size={12} /> {table.capacity} Guests
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {selectedTable && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card selection-form-card"
                >
                   <div className="form-header">
                      <div className="selection-preview">
                         <img src={selectedTable.image} alt="" />
                         <div>
                            <h4>Table #{selectedTable.id}</h4>
                            <p>{selectedTable.description}</p>
                         </div>
                      </div>
                   </div>
                   
                   <form onSubmit={handleBookingSubmit} className="booking-grid-form">
                      <div className="form-group">
                         <label>Date</label>
                         <input type="date" required value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                      </div>
                      <div className="form-group">
                         <label>Time</label>
                         <input type="time" required value={bookingForm.time} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} />
                      </div>
                      <div className="form-group">
                         <label>Guests</label>
                         <select value={bookingForm.guests} onChange={e => setBookingForm({...bookingForm, guests: e.target.value})}>
                            {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n} Guests</option>)}
                         </select>
                      </div>
                      <div className="form-group">
                         <label>Phone</label>
                         <input type="tel" required placeholder="+977..." value={bookingForm.phone} onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} />
                      </div>
                      <div className="form-group full">
                         <label>Notes</label>
                         <textarea placeholder="Special requests..." value={bookingForm.message} onChange={e => setBookingForm({...bookingForm, message: e.target.value})} />
                      </div>
                      <button type="submit" className="btn btn-primary full" disabled={bookingLoading}>
                        {bookingLoading ? 'Processing...' : editingReservation ? 'Update Reservation' : 'Complete Reservation'}
                      </button>
                   </form>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="tab-content"
            >
              <div className="section-header">
                <h2 className="section-title">Personal Information</h2>
                <p className="section-sub">Update your account details and preferences.</p>
              </div>

              <div className="glass-card profile-card-enhanced">
                 <div className="profile-banner"></div>
                 <div className="profile-content">
                    <div className="profile-avatar-large">
                       {user.name?.charAt(0)}
                       <button className="edit-avatar-btn"><Plus size={16} /></button>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="profile-form-enhanced">
                       <div className="form-row">
                          <div className="form-group">
                             <label>Full Name</label>
                             <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                          </div>
                          <div className="form-group">
                             <label>Email Address</label>
                             <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                          </div>
                       </div>
                       <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                          {updatingProfile ? 'Saving...' : 'Save Changes'}
                       </button>
                    </form>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
