const express = require('express');
const router = express.Router();
const DataStore = require('../utils/dataStore');
const auth = require('../utils/auth');

// Check if admin is logged in
router.get('/check', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// Get all users (admin only)
router.get('/users', auth.checkAdminSession, async (req, res) => {
  try {
    const users = await DataStore.getUsers();
    
    // Remove sensitive information
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json(safeUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all activation codes (admin only)
router.get('/codes', auth.checkAdminSession, async (req, res) => {
  try {
    const codes = await DataStore.getActivationCodes();
    res.json(codes);
  } catch (error) {
    console.error('Get activation codes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate new activation code (admin only)
router.post('/codes', auth.checkAdminSession, async (req, res) => {
  try {
    const { type, description } = req.body;
    
    // Validate input
    if (!type || !['full', 'temp'].includes(type)) {
      return res.status(400).json({ message: 'Valid type (full or temp) is required' });
    }
    
    // Create activation code
    const code = await DataStore.createActivationCode({
      type,
      description: description || `${type === 'full' ? '30 days' : '50 messages'} activation code`
    });
    
    res.status(201).json(code);
  } catch (error) {
    console.error('Generate activation code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete activation code (admin only)
router.delete('/codes/:code', auth.checkAdminSession, async (req, res) => {
  try {
    const code = req.params.code;

    if (process.env.NODE_ENV === 'production') {
      // Delete from MongoDB
      const { ActivationCode } = require('../utils/mongodb');
      const result = await ActivationCode.deleteOne({ code });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Activation code not found' });
      }
    } else {
      // Delete from local file
      const codes = await DataStore.getActivationCodes();
      const filteredCodes = codes.filter(c => c.code !== code);
      await DataStore.writeData('activation_codes.json', filteredCodes);
    }

    res.json({ message: 'Activation code deleted successfully' });
  } catch (error) {
    console.error('Delete activation code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get message statistics (admin only)
router.get('/stats', auth.checkAdminSession, async (req, res) => {
  try {
    const users = await DataStore.getUsers();
    const messages = await DataStore.readData('messages.json');
    
    // Calculate statistics
    const totalUsers = users.length;
    const totalMessages = messages.length;
    const activeUsers = users.filter(user => 
      user.activationExpiry && new Date(user.activationExpiry) > new Date()
    ).length;
    
    // Messages per user
    const messagesPerUser = {};
    users.forEach(user => {
      const userMessages = messages.filter(msg => msg.userId === user.id).length;
      messagesPerUser[user.username] = userMessages;
    });
    
    // Messages per day
    const messagesPerDay = {};
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toISOString().split('T')[0];
      if (!messagesPerDay[date]) {
        messagesPerDay[date] = 0;
      }
      messagesPerDay[date]++;
    });
    
    res.json({
      totalUsers,
      activeUsers,
      totalMessages,
      messagesPerUser,
      messagesPerDay
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
