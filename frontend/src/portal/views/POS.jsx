import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { Send, Plus, Minus, Trash2, ShoppingBag, Utensils, CheckCircle2, ChevronRight, X, Search, Printer, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../lib/api';

export default function POS() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCat, setActiveCat] = useState('All');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced POS State
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderType, setOrderType] = useState('dine-in'); // dine-in, takeaway
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemNote, setItemNote] = useState('');
  
  // New Features State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState(0);

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, tablesRes] = await Promise.all([
          apiFetch('/api/menu'),
          apiFetch('/api/tables') 
        ]);
        
        const menuData = await menuRes.json();
        if (menuData.success) {
          setMenuItems(menuData.data);
          const cats = ['All', ...new Set(menuData.data.map(i => i.category))];
          setCategories(cats);
        }

        try {
          const tablesData = await tablesRes.json();
          if (tablesData.success) setTables(tablesData.data);
          else throw new Error();
        } catch {
          setTables([
            { number: 'T1', status: 'available' }, { number: 'T2', status: 'occupied' },
            { number: 'T3', status: 'available' }, { number: 'T4', status: 'available' },
            { number: 'T5', status: 'available' }, { number: 'T6', status: 'reserved' },
          ]);
        }
      } catch (error) {
        toast("System sync error", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const filteredItems = useMemo(() => {
    let items = activeCat === 'All' 
      ? menuItems 
      : menuItems.filter(i => i.category === activeCat);
    
    if (searchTerm) {
      items = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return items;
  }, [menuItems, activeCat, searchTerm]);

  const { subtotal, tax, grandTotal } = useMemo(() => {
    const sub = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discAmount = sub * (discount / 100);
    const subAfterDisc = sub - discAmount;
    const t = subAfterDisc * 0.13;
    return { subtotal: subAfterDisc, tax: t, grandTotal: subAfterDisc + t };
  }, [cart, discount]);

  const findCustomer = () => {
    const customers = [
      { name: 'Bibek Raut', phone: '9800000000', visits: 12, discount: 10 },
      { name: 'John Doe', phone: '9841000000', visits: 5, discount: 5 }
    ];
    const found = customers.find(c => c.phone === customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()));
    if (found) {
      setSelectedCustomer(found);
      setDiscount(found.discount);
      toast(`Customer Found: ${found.name}! ${found.discount}% applied.`, 'success');
    } else {
      toast('Customer not found', 'info');
    }
  };

  const printKOT = () => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>KOT - ${selectedTable || 'Takeaway'}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; margin: auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 1.1rem; font-weight: bold; }
            .footer { border-top: 2px dashed #000; padding-top: 10px; margin-top: 20px; font-size: 0.9rem; }
            .meta { font-size: 0.8rem; margin: 4px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h3>ANNAPURNA KITCHEN</h3>
            <div class="meta">Order: #${Date.now().toString().slice(-6)}</div>
            <div class="meta">Table: ${selectedTable || 'Takeaway'}</div>
            <div class="meta">Staff: ${user?.name || 'POS'}</div>
            <div class="meta">${new Date().toLocaleString()}</div>
          </div>
          ${cart.map(i => `
            <div class="item">
              <span>${i.quantity}x ${i.name}</span>
            </div>
            ${i.note ? `<div style="font-size: 0.8rem; margin: -4px 0 8px 20px; color: #555;">* ${i.note}</div>` : ''}
          `).join('')}
          <div class="footer">
            <p>--- End of Kitchen Ticket ---</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const addToCart = (item) => {
    setEditingItem(item);
    setItemNote('');
    setShowModifierModal(true);
  };

  const confirmAddToCart = () => {
    const cartId = `${editingItem._id}-${itemNote}`;
    setCart(prev => {
      const exists = prev.find(i => i.cartId === cartId);
      if (exists) {
        return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        cartId,
        id: editingItem._id,
        name: editingItem.name,
        price: editingItem.price,
        quantity: 1,
        note: itemNote,
        modifiers: itemNote ? [itemNote] : [],
        image: editingItem.image
      }];
    });
    toast(`${editingItem.name} added`, 'success');
    setShowModifierModal(false);
    setEditingItem(null);
  };

  const updateQuantity = (cartId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.cartId === cartId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const clearCart = () => {
    if (window.confirm('Clear current ticket?')) {
      setCart([]);
      setSelectedTable(null);
      setSelectedCustomer(null);
      setDiscount(0);
    }
  };

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const submitOrder = async (payMethod = 'none') => {
    if (cart.length === 0) {
      toast('Add items to order first', 'info');
      return;
    }
    if (orderType === 'dine-in' && !selectedTable) {
      toast('Please select a table', 'warning');
      return;
    }

    // For takeaway, suggest immediate payment
    if (orderType === 'takeaway' && payMethod === 'none' && !showPaymentModal) {
      setShowPaymentModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('portal_token');
      const payload = {
        items: cart.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          modifiers: i.modifiers
        })),
        totalAmount: grandTotal,
        orderType,
        tableNumber: orderType === 'dine-in' ? selectedTable : null,
        customerId: selectedCustomer?._id,
        paymentStatus: payMethod !== 'none' ? 'paid' : 'unpaid',
        paymentMethod: payMethod
      };

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast(payMethod !== 'none' ? `Order Paid via ${payMethod}! 🧾` : 'Order sent to kitchen! 🍳', 'success');
        setCart([]);
        setSelectedTable(null);
        setSelectedCustomer(null);
        setDiscount(0);
        setShowPaymentModal(false);
      } else {
        throw new Error(data.message || 'Failed to submit order');
      }
    } catch (err) {
      toast(err.message || 'Network error saving order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pos-loading-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Utensils size={48} color="var(--color-gold)" />
        </motion.div>
        <p>Initializing POS System...</p>
      </div>
    );
  }

  return (
    <div className="pos-container-advanced">
      <div className="pos-header-controls">
        <div className="pos-order-type-switch">
          <button className={`type-btn ${orderType === 'dine-in' ? 'active' : ''}`} onClick={() => setOrderType('dine-in')}>
            <Utensils size={18} /> Dine-in
          </button>
          <button className={`type-btn ${orderType === 'takeaway' ? 'active' : ''}`} onClick={() => setOrderType('takeaway')}>
            <ShoppingBag size={18} /> Takeaway
          </button>
        </div>

        {orderType === 'dine-in' && (
          <div className="pos-table-selector">
            <span className="label">Table:</span>
            <div className="table-grid-mini">
              {tables.map(t => (
                <button
                  key={t.number}
                  className={`mini-table-btn ${selectedTable === t.number ? 'selected' : ''} ${t.status}`}
                  disabled={t.status === 'occupied'}
                  onClick={() => setSelectedTable(t.number)}
                >
                  {t.number}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pos-customer-lookup">
          <div className="lookup-input-group">
            <UserIcon size={16} />
            <input 
              type="text" 
              placeholder="Find Customer (Phone/Name)" 
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && findCustomer()}
            />
            <button onClick={findCustomer}>Lookup</button>
          </div>
          {selectedCustomer && (
            <div className="selected-customer-tag">
              <CheckCircle2 size={14} /> {selectedCustomer.name} (${selectedCustomer.discount}%)
              <X size={14} onClick={() => { setSelectedCustomer(null); setDiscount(0); }} />
            </div>
          )}
        </div>
      </div>

      <div className="pos-main-split">
        <div className="pos-menu-area">
          <div className="pos-menu-top-bar">
            <div className="pos-categories-strip">
              {categories.map(cat => (
                <button key={cat} className={`pos-cat-pill ${activeCat === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="pos-search-wrapper">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {searchTerm && <X size={16} className="clear-search" onClick={() => setSearchTerm('')} />}
            </div>
          </div>

          <div className="pos-tile-grid">
            {filteredItems.map(item => (
              <motion.div 
                key={item._id} 
                className={`pos-tile ${item.stock < 10 ? 'low-stock' : ''}`}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => addToCart(item)}
              >
                {item.stock < 10 && <div className="stock-badge">ONLY {item.stock} LEFT</div>}
                <div className="tile-img-wrapper">
                  <img src={item.image} alt={item.name} />
                  <div className="tile-overlay"><Plus size={24} /></div>
                </div>
                <div className="tile-content">
                  <h4 className="tile-name">{item.name}</h4>
                  <div className="tile-footer">
                    <span className="tile-price">Rs. {item.price}</span>
                    {item.isVegetarian && <span className="veg-indicator" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pos-ticket-column">
          <div className="ticket-paper">
            <div className="ticket-header">
              <div className="ticket-title-row">
                <div className="ticket-title">ACTIVE TICKET</div>
                <button className="clear-ticket-btn" onClick={clearCart}>Clear</button>
              </div>
              <div className="ticket-meta">
                <span>#{orderType.toUpperCase()}</span>
                {selectedTable && <span>TABLE {selectedTable}</span>}
              </div>
            </div>

            <div className="ticket-body">
              {cart.length === 0 ? (
                <div className="empty-ticket">
                  <div className="empty-icon">🍽️</div>
                  <p>Order is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.cartId} className="ticket-item">
                    <div className="item-main">
                      <div className="item-info">
                        <span className="item-qty">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                      <span className="item-price">Rs. {item.price * item.quantity}</span>
                    </div>
                    {item.note && <div className="item-note">Note: {item.note}</div>}
                    <div className="item-actions">
                      <button onClick={() => updateQuantity(item.cartId, -1)}><Minus size={14}/></button>
                      <button onClick={() => updateQuantity(item.cartId, 1)}><Plus size={14}/></button>
                      <button className="remove" onClick={() => removeFromCart(item.cartId)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="ticket-footer">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(0)}</span>
              </div>
              {discount > 0 && (
                <div className="summary-row discount">
                  <span>Loyalty Discount (${discount}%)</span>
                  <span>-Rs. {((subtotal * discount) / (100 - discount)).toFixed(0)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>VAT (13%)</span>
                <span>Rs. {tax.toFixed(0)}</span>
              </div>
              <div className="summary-total">
                <span>TOTAL</span>
                <span>Rs. {grandTotal.toFixed(0)}</span>
              </div>

              <div className="action-row">
                <button className="print-kot-btn" disabled={cart.length === 0} onClick={printKOT}>
                  <Printer size={18} /> Print KOT
                </button>
                <button className="order-submit-btn" disabled={cart.length === 0 || isSubmitting} onClick={() => submitOrder()}>
                  {isSubmitting ? "..." : <><Send size={18} /> SEND</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModifierModal && (
          <div className="pos-modal-overlay">
            <motion.div className="pos-modal-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h3>Customize Item</h3>
                <button className="close-btn" onClick={() => setShowModifierModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="editing-item-preview">
                  <img src={editingItem?.image} alt="" />
                  <div><h4>{editingItem?.name}</h4><p>Rs. {editingItem?.price}</p></div>
                </div>
                <div className="modifier-group">
                  <label>Order Notes</label>
                  <textarea placeholder="e.g. Extra spicy..." value={itemNote} onChange={(e) => setItemNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModifierModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmAddToCart}>Add to Ticket</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPaymentModal && (
          <div className="pos-modal-overlay">
            <motion.div className="pos-modal-card payment-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="modal-header">
                <h3>Process Payment</h3>
                <button className="close-btn" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="payment-summary">
                  <span>Total Amount Due:</span>
                  <h2>Rs. {grandTotal.toFixed(0)}</h2>
                </div>
                <div className="payment-options-grid">
                  <button className="pay-opt-btn cash" onClick={() => submitOrder('cash')}>
                    <div className="opt-icon">💵</div>
                    <span>Cash Payment</span>
                  </button>
                  <button className="pay-opt-btn card" onClick={() => submitOrder('card')}>
                    <div className="opt-icon">💳</div>
                    <span>Card / QR</span>
                  </button>
                </div>
                <button className="pay-later-link" onClick={() => submitOrder('none')}>
                  Skip payment and send to kitchen (Pay Later)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
