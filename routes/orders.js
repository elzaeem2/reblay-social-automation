const express = require('express');
const router = express.Router();
const DataStore = require('../utils/dataStore');
const auth = require('../utils/auth');

// Get all orders
router.get('/', auth.authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await DataStore.getOrders(userId);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new order
router.post('/', auth.authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, productName, quantity, customerInfo, notes } = req.body;
    
    // Validate input
    if (!productName) {
      return res.status(400).json({ message: 'Product name is required' });
    }
    
    // Create order
    const orderData = {
      productId,
      productName,
      quantity: quantity || 1,
      customerInfo: customerInfo || {},
      notes: notes || '',
      status: 'pending',
      source: 'chat'
    };
    
    const order = await DataStore.addOrder(userId, orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error('Add order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.put('/:orderId/status', auth.authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Validate input
    if (!status || !['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }
    
    const order = await DataStore.updateOrderStatus(userId, orderId, status);
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order
router.delete('/:orderId', auth.authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    
    await DataStore.deleteOrder(userId, orderId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete order error:', error);
    if (error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
