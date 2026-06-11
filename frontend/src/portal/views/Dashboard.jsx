import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock, 
  DollarSign, 
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 125430,
    totalOrders: 0,
    activeTables: 8,
    pendingReservations: 5,
    topItems: [
      { name: 'Momo (Chicken)', sales: 124 },
      { name: 'Thakali Set', sales: 98 },
      { name: 'Butter Chicken', sales: 76 }
    ],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('portal_token');
        const [statsRes, logsRes] = await Promise.all([
          apiFetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` }}),
          apiFetch('/api/activity-logs', { headers: { 'Authorization': `Bearer ${token}` }})
        ]);
        
        const ordersData = await statsRes.json();
        const logsData = await logsRes.json();

        if (ordersData.success) {
          setStats(prev => ({
            ...prev,
            totalOrders: ordersData.count,
            recentOrders: ordersData.data.slice(0, 5).map(o => ({
              id: o._id,
              number: o.orderNumber,
              table: o.tableNumber || 'Takeaway',
              total: o.totalAmount,
              status: o.status,
              time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
          }));
        }

        if (logsData.success) {
          setActivities(logsData.data.slice(0, 8));
        }
      } catch (err) {
        console.error('Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = [
    { label: "Today's Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#F1C40F', trend: '+12.5%' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#E67E22', trend: '+8%' },
    { label: 'Active Tables', value: `${stats.activeTables}/15`, icon: Users, color: '#2ECC71', trend: 'High occupancy' },
    { label: 'Reservations', value: stats.pendingReservations, icon: Clock, color: '#3498DB', trend: 'Next 2 hours' },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h2 className="mgmt-title">Operational Overview</h2>
          <p className="mgmt-card-sub">Real-time metrics for Annapurna Kitchen</p>
        </div>
        <div className="dashboard-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      <div className="kpi-grid">
        {kpis.map((kpi, idx) => (
          <motion.div 
            key={kpi.label} 
            className="kpi-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="kpi-icon-wrapper" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
              <kpi.icon size={24} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">{kpi.label}</span>
              <h3 className="kpi-value">{kpi.value}</h3>
              <span className="kpi-trend" style={{ color: kpi.trend.includes('+') ? '#2ECC71' : '#F1C40F' }}>
                {kpi.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-section activity-feed">
          <div className="section-header">
            <h3><TrendingUp size={20} /> Live Order Feed</h3>
            <button className="view-all">View All Orders</button>
          </div>
          <div className="order-feed-list">
            {stats.recentOrders.length === 0 ? (
              <div className="no-logs">No active orders right now.</div>
            ) : (
              stats.recentOrders.map(order => (
                <div key={order.id} className="feed-item">
                  <div className={`status-indicator ${order.status}`} />
                  <div className="feed-info">
                    <strong>Order {order.number.split('-').pop()}</strong>
                    <span>{order.table} • {order.time}</span>
                  </div>
                  <div className="feed-amount">Rs. {order.total}</div>
                  <div className={`status-pill ${order.status}`}>{order.status}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section activity-logs">
          <div className="section-header">
            <h3><Clock size={20} /> Staff Activity Log</h3>
          </div>
          <div className="log-list">
            {activities.length === 0 ? (
              <div className="no-logs">No activity recorded yet today.</div>
            ) : (
              activities.map(log => (
                <div key={log._id} className="log-item">
                  <div className="log-icon">
                    {log.action === 'PAYMENT_RECEIVED' ? '💰' : log.action === 'ORDER_CREATED' ? '📝' : '⚡'}
                  </div>
                  <div className="log-details">
                    <p><strong>{log.staffId?.name || 'Staff'}</strong> {log.details}</p>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
