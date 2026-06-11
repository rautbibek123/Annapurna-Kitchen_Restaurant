import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  Banknote, 
  Printer, 
  QrCode, 
  X, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/Toast';
import { apiFetch } from '../../lib/api';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, history
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      toast('Failed to fetch records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleProcessPayment = async (orderId, method) => {
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch(`/api/orders/${orderId}/pay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentMethod: method })
      });

      const data = await res.json();
      if (data.success) {
        toast(`Payment processed via ${method.toUpperCase()}!`, 'success');
        setShowCheckoutModal(false);
        fetchOrders(); // Refresh list
      }
    } catch (error) {
      toast('Payment processing failed', 'error');
    }
  };

  const printCustomerReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 30px; width: 350px; margin: auto; border: 1px solid #eee; }
            .header { text-align: center; margin-bottom: 20px; }
            .brand { font-size: 1.5rem; font-weight: 800; color: #b8860b; }
            .meta { font-size: 0.8rem; color: #666; margin-top: 5px; }
            .divider { border-bottom: 1px dashed #ccc; margin: 15px 0; }
            .item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
            .total-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; margin-top: 15px; }
            .footer { text-align: center; font-size: 0.8rem; color: #888; margin-top: 30px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="brand">ANNAPURNA KITCHEN</div>
            <div class="meta">Tax Invoice / Receipt</div>
            <div class="meta">${order.orderNumber}</div>
            <div class="meta">${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          <div class="divider"></div>
          ${order.items.map(i => `
            <div class="item">
              <span>${i.quantity}x ${i.name}</span>
              <span>Rs. ${i.price * i.quantity}</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="item"><span>Subtotal</span><span>Rs. ${(order.totalAmount / 1.13).toFixed(0)}</span></div>
          <div class="item"><span>VAT (13%)</span><span>Rs. ${(order.totalAmount - (order.totalAmount / 1.13)).toFixed(0)}</span></div>
          <div class="total-row"><span>GRAND TOTAL</span><span>Rs. ${order.totalAmount}</span></div>
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>Visit again soon.</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const pendingOrders = orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled');
  const settledOrders = orders.filter(o => o.paymentStatus === 'paid');

  const displayList = activeTab === 'pending' ? pendingOrders : settledOrders;
  const filteredDisplay = displayList.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.tableNumber && o.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="cashier-terminal">
      <div className="mgmt-header">
        <div>
          <h2 className="mgmt-title">Cashier Terminal</h2>
          <p className="mgmt-card-sub">Process settlements and manage financial records</p>
        </div>
        <div className="revenue-pill">
          <DollarSign size={18} />
          <span>Daily Revenue: <strong>Rs. {settledOrders.reduce((s, p) => s + p.totalAmount, 0).toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="cashier-tabs">
        <button 
          className={`cashier-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Settlements <span className="count-badge">{pendingOrders.length}</span>
        </button>
        <button 
          className={`cashier-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Settled History
        </button>
      </div>

      <div className="cashier-main-layout">
        <div className="cashier-list-side">
          <div className="search-box-wrapper">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Table..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="order-cards-stack">
            {loading ? (
              <div className="loading-placeholder">Syncing with POS...</div>
            ) : filteredDisplay.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No {activeTab} orders found.</p>
              </div>
            ) : (
              filteredDisplay.map(order => (
                <motion.div 
                  key={order._id}
                  className={`order-card-mini ${selectedOrder?._id === order._id ? 'selected' : ''}`}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="card-top">
                    <span className="order-no">#{order.orderNumber.split('-').pop()}</span>
                    <span className="order-time">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="card-mid">
                    <span className="table-tag">{order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : 'Takeaway'}</span>
                    <span className="amount">Rs. {order.totalAmount}</span>
                  </div>
                  <div className="card-footer">
                    <span className={`status-tag ${order.status}`}>{order.status}</span>
                    <ChevronRight size={16} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="cashier-detail-side">
          {selectedOrder ? (
            <motion.div 
              className="order-detail-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={selectedOrder._id}
            >
              <div className="detail-header">
                <h3>Order Details</h3>
                <button className="receipt-btn" onClick={() => printCustomerReceipt(selectedOrder)}>
                  <Printer size={18} /> Print Draft
                </button>
              </div>

              <div className="detail-meta-grid">
                <div className="meta-item">
                  <label>Order Reference</label>
                  <span>{selectedOrder.orderNumber}</span>
                </div>
                <div className="meta-item">
                  <label>Order Type</label>
                  <span>{selectedOrder.orderType.toUpperCase()}</span>
                </div>
                {selectedOrder.tableNumber && (
                  <div className="meta-item">
                    <label>Table Number</label>
                    <span>{selectedOrder.tableNumber}</span>
                  </div>
                )}
                <div className="meta-item">
                  <label>Staff Handle</label>
                  <span>{selectedOrder.staffId?.name || 'POS'}</span>
                </div>
              </div>

              <div className="detail-items-list">
                <h4>Items Summary</h4>
                <div className="items-table">
                  {selectedOrder.items.map(item => (
                    <div key={item._id} className="item-row">
                      <span className="item-qty">{item.quantity}x</span>
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">Rs. {item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-cost-summary">
                <div className="cost-row">
                  <span>Subtotal</span>
                  <span>Rs. {(selectedOrder.totalAmount / 1.13).toFixed(0)}</span>
                </div>
                <div className="cost-row">
                  <span>VAT (13%)</span>
                  <span>Rs. {(selectedOrder.totalAmount - (selectedOrder.totalAmount / 1.13)).toFixed(0)}</span>
                </div>
                <div className="cost-total">
                  <span>Amount to Settle</span>
                  <span>Rs. {selectedOrder.totalAmount}</span>
                </div>
              </div>

              {selectedOrder.paymentStatus === 'unpaid' ? (
                <button className="checkout-trigger-btn" onClick={() => setShowCheckoutModal(true)}>
                  Proceed to Checkout
                </button>
              ) : (
                <div className="paid-confirmation">
                  <CheckCircle2 size={24} />
                  <div>
                    <strong>Settled via {selectedOrder.paymentMethod.toUpperCase()}</strong>
                    <p>Processed on {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => printCustomerReceipt(selectedOrder)} className="reprint-btn">
                    <Printer size={16} /> Receipt
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="detail-empty-state">
              <ShoppingBag size={64} />
              <p>Select an order to proceed with checkout</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCheckoutModal && selectedOrder && (
          <div className="pos-modal-overlay">
            <motion.div 
              className="pos-modal-card checkout-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Final Settlement</h3>
                <button className="close-btn" onClick={() => setShowCheckoutModal(false)}><X size={20} /></button>
              </div>
              
              <div className="modal-body">
                <div className="checkout-summary">
                  <span>TOTAL BILL AMOUNT</span>
                  <h2>Rs. {selectedOrder.totalAmount}</h2>
                </div>

                <div className="checkout-options">
                  <div className="qr-section">
                    <h4>Scan to Pay (FonePay/QR)</h4>
                    <div className="qr-box">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=PaymentForOrder_${selectedOrder.orderNumber}_Amount_${selectedOrder.totalAmount}`} 
                        alt="Payment QR" 
                      />
                      <p>Generate for Rs. {selectedOrder.totalAmount}</p>
                    </div>
                    <button className="qr-confirm-btn" onClick={() => handleProcessPayment(selectedOrder._id, 'card')}>
                      <QrCode size={18} /> Confirm QR Settlement
                    </button>
                  </div>

                  <div className="manual-section">
                    <h4>Manual Payment</h4>
                    <button className="pay-method-btn cash" onClick={() => handleProcessPayment(selectedOrder._id, 'cash')}>
                      <Banknote size={20} /> Receive Cash
                    </button>
                    <button className="pay-method-btn card" onClick={() => handleProcessPayment(selectedOrder._id, 'card')}>
                      <CreditCard size={20} /> Swipe Card
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
