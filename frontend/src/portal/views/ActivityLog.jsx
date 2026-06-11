import { useState, useEffect } from 'react';
import { Clock, Search, Filter, RefreshCcw } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { apiFetch } from '../../lib/api';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/activity-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      toast('Failed to fetch activity logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.staffId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="activity-page">
      <div className="mgmt-header">
        <div>
          <h2 className="mgmt-title">System Activity Log</h2>
          <p className="mgmt-card-sub">Audit trail for all restaurant operations</p>
        </div>
        <button className="btn btn-outline" onClick={fetchLogs}>
          <RefreshCcw size={18} /> Refresh
        </button>
      </div>

      <div className="mgmt-controls">
        <div className="search-group">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by staff, action, or details..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mgmt-card">
        <div className="activity-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Staff</th>
                <th>Action</th>
                <th>Details</th>
                <th>Order Ref</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center">Loading logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="5" className="text-center">No logs found</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id}>
                    <td>
                      <div className="time-cell">
                        <Clock size={14} />
                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td><strong>{log.staffId?.name || 'System'}</strong></td>
                    <td>
                      <span className={`status-badge ${log.action.toLowerCase()}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{log.details}</td>
                    <td>
                      {log.orderId ? (
                        <span className="order-ref">#{log.orderId.toString().slice(-6)}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
