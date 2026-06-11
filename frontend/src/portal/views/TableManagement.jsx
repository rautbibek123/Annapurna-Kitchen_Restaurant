import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { CalendarCheck, CheckCircle, XCircle, Clock, Users, AlertCircle, Layout, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';

const STATUS_OPTIONS = ['confirmed', 'cancelled', 'pending'];

const statusStyle = {
  pending:   { color: '#f39c12', bg: 'rgba(243,156,18,0.1)',   label: 'Pending',   icon: AlertCircle  },
  confirmed: { color: '#2ecc71', bg: 'rgba(46,204,113,0.1)',   label: 'Confirmed', icon: CheckCircle  },
  cancelled: { color: '#e74c3c', bg: 'rgba(231,76,60,0.1)',    label: 'Cancelled', icon: XCircle      },
};

export default function TableManagement() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('reservations'); // reservations, floorplan
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      const [resvRes, tablesRes] = await Promise.all([
        apiFetch('/api/reservations', { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch('/api/tables', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const resvData = await resvRes.json();
      if (resvData.success) setReservations(resvData.data);

      try {
        const tablesData = await tablesRes.json();
        if (tablesData.success) setTables(tablesData.data);
      } catch {
        // Fallback mock tables
        setTables([
          { number: 'T1', capacity: 2, status: 'available', section: 'window' },
          { number: 'T2', capacity: 4, status: 'occupied', section: 'indoor' },
          { number: 'T3', capacity: 4, status: 'available', section: 'indoor' },
          { number: 'T4', capacity: 6, status: 'reserved', section: 'booth' },
          { number: 'T5', capacity: 2, status: 'available', section: 'outdoor' },
          { number: 'T6', capacity: 4, status: 'available', section: 'window' },
          { number: 'T7', capacity: 4, status: 'cleaning', section: 'indoor' },
          { number: 'T8', capacity: 8, status: 'available', section: 'booth' },
        ]);
      }
    } catch (err) {
      toast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch(`/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast(`Reservation ${newStatus}!`, 'success');
        setReservations(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
      } else {
        toast(data.message || 'Update failed', 'error');
      }
    } catch {
      toast('Network error', 'error');
    }
  };

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  return (
    <div className="mgmt-container">
      {/* Header */}
      <div className="mgmt-header">
        <div className="mgmt-title-row">
          <h1 className="mgmt-title">Table Management</h1>
          <div className="view-toggle-pills">
            <button className={view === 'reservations' ? 'active' : ''} onClick={() => setView('reservations')}>
              <CalendarCheck size={16} /> Bookings
            </button>
            <button className={view === 'floorplan' ? 'active' : ''} onClick={() => setView('floorplan')}>
              <MapIcon size={16} /> Floor Plan
            </button>
          </div>
        </div>
        
        {view === 'reservations' && (
          <div className="mgmt-stats">
            {['all', 'pending', 'confirmed', 'cancelled'].map(s => {
              const count = s === 'all' ? reservations.length : reservations.filter(r => r.status === s).length;
              return (
                <button 
                  key={s} 
                  onClick={() => setFilter(s)}
                  className={`mgmt-stat-btn ${filter === s ? 'active' : ''}`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'reservations' ? (
          <motion.div 
            key="reservations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {loading ? (
              <div className="dashboard-empty">Loading reservations...</div>
            ) : filtered.length === 0 ? (
              <div className="glass-card dashboard-empty">
                <CalendarCheck className="dashboard-empty-icon" />
                <p>No reservations found{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
              </div>
            ) : (
              <div className="mgmt-list">
                {filtered.map(r => {
                  const st = statusStyle[r.status] || statusStyle.pending;
                  const StatusIcon = st.icon;
                  return (
                    <div key={r._id} className="glass-card mgmt-card">
                      <div className="mgmt-card-info">
                        <div className="mgmt-card-title">
                          <span className="mgmt-card-name">{r.name}</span>
                          <span className="mgmt-card-sub">{r.email}</span>
                          {r.phone && <span className="mgmt-card-sub">| 📞 {r.phone}</span>}
                        </div>
                        <div className="mgmt-card-meta">
                          <span>📅 {r.date}</span>
                          <span><Clock size={14} /> {r.time}</span>
                          <span><Users size={14} /> {r.guests} guests</span>
                          {r.tableNumber && (
                            <span className="mgmt-table-badge">Table {r.tableNumber}</span>
                          )}
                        </div>
                        {r.message && <p className="mgmt-card-msg">"{r.message}"</p>}
                        <p className="mgmt-card-sub" style={{ marginTop: '10px' }}>
                          Booked {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="mgmt-card-actions">
                        <span className={`status-badge status-badge--${r.status || 'pending'}`}>
                          <StatusIcon size={14} /> {st.label}
                        </span>
                        <div className="mgmt-action-group">
                          {r.status !== 'confirmed' && (
                            <button onClick={() => handleStatusUpdate(r._id, 'confirmed')} className="mgmt-btn mgmt-btn--confirm">Confirm</button>
                          )}
                          {r.status !== 'cancelled' && (
                            <button onClick={() => handleStatusUpdate(r._id, 'cancelled')} className="mgmt-btn mgmt-btn--decline">Decline</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="floorplan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="floorplan-view"
          >
            <div className="floorplan-legend">
              <div className="legend-item"><span className="dot available" /> Available</div>
              <div className="legend-item"><span className="dot occupied" /> Occupied</div>
              <div className="legend-item"><span className="dot reserved" /> Reserved</div>
              <div className="legend-item"><span className="dot cleaning" /> Cleaning</div>
            </div>

            <div className="restaurant-map">
              <div className="map-section window">
                <h4>WINDOW SEATING</h4>
                <div className="tables-grid">
                  {tables.filter(t => t.section === 'window').map(t => (
                    <div key={t.number} className={`table-box ${t.status}`}>
                      <span className="t-num">{t.number}</span>
                      <span className="t-cap"><Users size={10} /> {t.capacity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="map-main">
                <div className="map-section indoor">
                  <h4>MAIN DINING</h4>
                  <div className="tables-grid">
                    {tables.filter(t => t.section === 'indoor').map(t => (
                      <div key={t.number} className={`table-box ${t.status}`}>
                        <span className="t-num">{t.number}</span>
                        <span className="t-cap"><Users size={10} /> {t.capacity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="map-section booth">
                  <h4>BOOTHS</h4>
                  <div className="tables-grid">
                    {tables.filter(t => t.section === 'booth').map(t => (
                      <div key={t.number} className={`table-box ${t.status}`}>
                        <span className="t-num">{t.number}</span>
                        <span className="t-cap"><Users size={10} /> {t.capacity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="map-section outdoor">
                <h4>OUTDOOR PATIO</h4>
                <div className="tables-grid">
                  {tables.filter(t => t.section === 'outdoor').map(t => (
                    <div key={t.number} className={`table-box ${t.status}`}>
                      <span className="t-num">{t.number}</span>
                      <span className="t-cap"><Users size={10} /> {t.capacity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
