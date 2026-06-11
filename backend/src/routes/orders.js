const express = require('express');
const { createOrder, getOrders, updateOrderStatus, payOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All order routes require at least staff access
router.use(protect);
router.use(authorize('admin', 'manager', 'staff'));

// Admin/Manager/Staff can view and create orders
router.route('/')
  .post(createOrder)
  .get(getOrders);

// Staff and managers can update order statuses
router.put('/:id/status', updateOrderStatus);
router.put('/:id/pay', payOrder);

module.exports = router;
