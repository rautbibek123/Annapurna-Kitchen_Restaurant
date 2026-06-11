import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  X, 
  ChevronRight, 
  Utensils,
  Image as ImageIcon,
  Check,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/Toast';
import { apiFetch } from '../../lib/api';

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    nepali: '',
    description: '',
    price: '',
    category: 'Main Course',
    isVegetarian: false,
    available: true,
    stock: 99,
    image: ''
  });

  const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks', 'Bakery'];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch('/api/menu?admin=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (err) {
      toast('Failed to fetch menu items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        nepali: item.nepali || '',
        description: item.description,
        price: item.price,
        category: item.category,
        isVegetarian: item.isVegetarian,
        available: item.available,
        stock: item.stock,
        image: item.image || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        nepali: '',
        description: '',
        price: '',
        category: 'Main Course',
        isVegetarian: false,
        available: true,
        stock: 99,
        image: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('portal_token');
      const url = editingItem ? `/api/menu/${editingItem._id}` : '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        toast(`Item ${editingItem ? 'updated' : 'added'} successfully!`, 'success');
        setShowModal(false);
        fetchItems();
      } else {
        toast(data.message || 'Operation failed', 'error');
      }
    } catch (err) {
      toast('Network error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch(`/api/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast('Item deleted', 'success');
        fetchItems();
      }
    } catch (err) {
      toast('Delete failed', 'error');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const token = localStorage.getItem('portal_token');
      const res = await apiFetch(`/api/menu/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ available: !item.available })
      });
      if (res.ok) {
        setItems(items.map(i => i._id === item._id ? {...i, available: !i.available} : i));
        toast(`${item.name} is now ${!item.available ? 'Available' : 'Unavailable'}`, 'info');
      }
    } catch (err) {
      toast('Update failed', 'error');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="menu-mgmt-page">
      <div className="mgmt-header">
        <div>
          <h2 className="mgmt-title">Menu Management</h2>
          <p className="mgmt-card-sub">Create, edit, and manage your restaurant menu</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Add New Item
        </button>
      </div>

      <div className="mgmt-controls">
        <div className="search-group">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-scroll">
          {categories.map(cat => (
            <button 
              key={cat}
              className={`filter-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-grid">
        {loading ? (
          <div className="loading-state">Loading delicious items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <Utensils size={48} />
            <p>No items found in this category.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <motion.div 
              key={item._id}
              className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="item-img-wrapper">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="no-img-placeholder"><ImageIcon size={32} /></div>
                )}
                {item.isVegetarian && <span className="veg-badge"></span>}
                <div className="item-category-tag">{item.category}</div>
              </div>
              <div className="item-content">
                <div className="item-header">
                  <div>
                    <h4>{item.name}</h4>
                    {item.nepali && <small className="nepali-text">{item.nepali}</small>}
                  </div>
                  <span className="item-price">Rs. {item.price}</span>
                </div>
                <p className="item-desc">{item.description}</p>
                
                <div className="item-footer">
                  <div className="stock-info">
                    <span className={`stock-pill ${item.stock < 10 ? 'low' : ''}`}>
                      Stock: {item.stock}
                    </span>
                  </div>
                  <div className="item-actions">
                    <button className="icon-btn" onClick={() => handleOpenModal(item)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className={`icon-btn ${item.available ? 'active' : ''}`} 
                      onClick={() => toggleAvailability(item)}
                      title={item.available ? 'Mark Unavailable' : 'Mark Available'}
                    >
                      {item.available ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <button className="icon-btn delete" onClick={() => handleDelete(item._id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {!item.available && (
                <div className="unavailable-overlay">
                  <AlertTriangle size={24} />
                  <span>Hidden from POS</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="pos-modal-overlay">
            <motion.div 
              className="pos-modal-card menu-form-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body scrollable">
                  <div className="input-grid">
                    <div className="form-item">
                      <label>Item Name (English)</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="form-item">
                      <label>Item Name (Nepali - Optional)</label>
                      <input 
                        type="text"
                        value={formData.nepali}
                        onChange={e => setFormData({...formData, nepali: e.target.value})}
                      />
                    </div>
                    <div className="form-item">
                      <label>Price (Rs.)</label>
                      <input 
                        type="number" required
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-item">
                      <label>Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        {categories.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-item full">
                      <label>Description</label>
                      <textarea 
                        required
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                    <div className="form-item">
                      <label>Image URL</label>
                      <input 
                        type="text"
                        value={formData.image}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                      />
                    </div>
                    <div className="form-item">
                      <label>Initial Stock</label>
                      <input 
                        type="number"
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                      />
                    </div>
                    <div className="form-item">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={formData.isVegetarian}
                          onChange={e => setFormData({...formData, isVegetarian: e.target.checked})}
                        />
                        <span>Is Vegetarian?</span>
                      </label>
                    </div>
                    <div className="form-item">
                      <label className="checkbox-label">
                        <input 
                          type="checkbox"
                          checked={formData.available}
                          onChange={e => setFormData({...formData, available: e.target.checked})}
                        />
                        <span>Active in Menu?</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Update Item' : 'Create Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
