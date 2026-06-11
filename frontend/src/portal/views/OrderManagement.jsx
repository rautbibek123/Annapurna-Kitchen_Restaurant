import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Clock, CheckCircle2, Play, CheckCircle, Table, User, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, completed
  const { user } = useAuth();
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Faster polling for KDS
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'completed') {
      return orders.filter(o => o.status === 'completed' || o.status === 'served');
    }
    return orders.filter(o => o.status !== 'completed' && o.status !== 'served' && o.status !== 'cancelled');
  }, [orders, activeTab]);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast(`Order updated to ${status}`, 'success');
        fetchOrders();
      }
    } catch (err) {
      toast('Failed to update status', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'preparing': return '#3498db';
      case 'ready': return '#2ecc71';
      case 'served': return '#9b59b6';
      default: return 'var(--color-muted)';
    }
  };

  const getTimeElapsed = (createdAt) => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return elapsed;
  };

  if (loading) return <div className="pos-loading">Syncing with Kitchen...</div>;

  return (
    <div className="kds-container">
      <header className="kds-header">
        <div className="kds-title-area">
          <h2 className="mgmt-title">Kitchen Display System</h2>
          <div className="kds-tabs">
            <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active Tickets</button>
            <button className={activeTab === 'completed' ? 'active' : ''} onClick={() => setActiveTab('completed')}>History</button>
          </div>
        </div>
        <div className="kds-stats-strip">
          <div className="stat"><span>PENDING</span> <strong>{orders.filter(o => o.status === 'pending').length}</strong></div>
          <div className="stat"><span>COOKING</span> <strong>{orders.filter(o => o.status === 'preparing').length}</strong></div>
          <div className="stat"><span>READY</span> <strong>{orders.filter(o => o.status === 'ready').length}</strong></div>
        </div>
      </header>

      <div className="kds-board">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <div className="kds-empty-state">
              <div className="empty-icon">🍳</div>
              <h3>Kitchen is Clear</h3>
              <p>New orders will appear here automatically</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const elapsed = getTimeElapsed(order.createdAt);
              const isUrgent = elapsed > 15;

              return (
                <motion.div 
                  key={order._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`kds-ticket ${isUrgent ? 'urgent' : ''}`}
                >
                  <div className="ticket-top" style={{ borderColor: getStatusColor(order.status) }}>
                    <div className="order-meta">
                      <span className="order-num">#{order.orderNumber.split('-').pop()}</span>
                      <span className="order-type">{order.orderType?.toUpperCase()}</span>
                    </div>
                    <div className="order-time">
                      <Clock size={14} /> {elapsed}m
                    </div>
                  </div>

                  <div className="ticket-sub-header">
                    <div className="info-badge">
                      <Table size={12} /> {order.tableNumber || 'WALK-IN'}
                    </div>
                    <div className="info-badge">
                      <User size={12} /> {order.staffId?.name?.split(' ')[0] || 'Admin'}
                    </div>
                  </div>

                  <div className="ticket-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="ticket-item">
                        <div className="item-row">
                          <span className="qty">{item.quantity}x</span>
                          <span className="name">{item.name}</span>
                        </div>
                        {item.modifiers?.length > 0 && (
                          <div className="modifiers">
                            {item.modifiers.map((m, i) => <span key={i}>• {m}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="ticket-actions">
                    {order.status === 'pending' && (
                      <button className="kds-btn start" onClick={() => updateStatus(order._id, 'preparing')}>
                        <Play size={16} /> START COOKING
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button className="kds-btn ready" onClick={() => updateStatus(order._id, 'ready')}>
                        <CheckCircle2 size={16} /> MARK READY
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button className="kds-btn serve" onClick={() => updateStatus(order._id, 'served')}>
                        <Banknote size={16} /> MARK SERVED
                      </button>
                    )}
                    {order.status === 'served' && (
                      <div className="completed-label">
                        <CheckCircle size={16} /> SERVED
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
