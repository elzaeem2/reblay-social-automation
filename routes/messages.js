const express = require('express');
const router = express.Router();
const DataStore = require('../utils/dataStore');
const auth = require('../utils/auth');
const gemini = require('../utils/gemini');

// Test Gemini API connection
router.get('/test-gemini', async (req, res) => {
  try {
    const result = await gemini.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Test Gemini API error:', error);
    res.status(500).json({
      message: 'Error testing Gemini API connection',
      error: error.message
    });
  }
});

// Debug Gemini API
router.get('/debug-gemini', async (req, res) => {
  try {
    // Log API key (masked for security)
    const apiKey = process.env.GEMINI_API_KEY;
    const maskedKey = apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'Not set';
    console.log('Using Gemini API Key:', maskedKey);

    // Test with a simple prompt
    const simplePrompt = 'مرحبا، كيف حالك؟';
    console.log('Sending simple prompt to Gemini API:', simplePrompt);

    const response = await gemini.generateResponse(simplePrompt);
    console.log('Received response from Gemini API:', response);

    res.json({
      success: true,
      apiKeyMasked: maskedKey,
      prompt: simplePrompt,
      response: response
    });
  } catch (error) {
    console.error('Debug Gemini API error:', error);

    // Log more detailed error information
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }

    res.status(500).json({
      message: 'Error debugging Gemini API',
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// Debug conversation API
router.get('/debug-conversation', async (req, res) => {
  try {
    // Create sample products
    const sampleProducts = [
      {
        id: '1',
        name: 'هاتف آيفون 15 برو',
        price: '1200 دولار',
        description: 'هاتف ذكي من شركة آبل بمواصفات عالية'
      },
      {
        id: '2',
        name: 'سماعة آيربودز برو',
        price: '250 دولار',
        description: 'سماعات لاسلكية من شركة آبل بخاصية إلغاء الضوضاء'
      },
      {
        id: '3',
        name: 'ساعة آبل ووتش سيريس 9',
        price: '400 دولار',
        description: 'ساعة ذكية من شركة آبل بمزايا صحية متقدمة'
      }
    ];

    // Create sample store info for testing
    const sampleStoreInfo = {
      name: 'متجر التكنولوجيا الحديثة',
      address: 'شارع الرشيد، بغداد',
      description: 'متجر متخصص في بيع أحدث المنتجات التكنولوجية بأسعار منافسة',
      updatedAt: new Date().toISOString()
    };

    // Create a sample conversation
    const conversation = [
      {
        type: 'user',
        content: 'مرحبا، كيف حالك؟',
        timestamp: new Date(Date.now() - 5000).toISOString()
      },
      {
        type: 'ai',
        content: 'أنا بخير، شكراً لسؤالك! كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date(Date.now() - 4000).toISOString()
      },
      {
        type: 'user',
        content: 'هل لديك منتجات للبيع؟',
        timestamp: new Date(Date.now() - 3000).toISOString()
      }
    ];

    console.log('Testing conversation API with sample conversation, products, and store info');

    // Test the conversation API with products and store info
    const response = await gemini.generateConversationResponse(conversation, sampleProducts, sampleStoreInfo);
    console.log('Received response from conversation API:', response);

    res.json({
      success: true,
      conversation: conversation,
      products: sampleProducts,
      storeInfo: sampleStoreInfo,
      response: response
    });
  } catch (error) {
    console.error('Debug conversation API error:', error);

    // Log more detailed error information
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }

    res.status(500).json({
      message: 'Error debugging conversation API',
      error: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// Get message history for a user
router.get('/', auth.authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await DataStore.getMessages(userId);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message and get AI response
router.post('/chat', auth.authenticate, auth.checkMessageQuota, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, platform } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get user's products
    const products = await DataStore.getProducts(userId);

    // Get store information
    const storeInfo = await DataStore.getStoreInfo(userId);
    console.log(`Retrieved store info for user ${userId}:`, JSON.stringify(storeInfo));

    // Get conversation history (last 5 messages)
    const conversationHistory = await DataStore.getConversationHistory(userId, 5);

    console.log(`Processing chat request for user ${userId} with message: "${message}"`);
    console.log(`User has ${products ? products.length : 0} products`);
    console.log(`Retrieved ${conversationHistory.length} previous messages for context`);

    try {
      // Save user message first
      const savedUserMessage = await DataStore.addMessage({
        userId,
        platform: platform || 'test',
        content: message,
        type: 'user'
      });

      // Add the new user message to the conversation history
      const updatedHistory = [...conversationHistory, savedUserMessage];

      // Generate AI response with conversation history
      let aiResponse;

      // Try to use the conversation format first (better for maintaining context)
      try {
        // If we have enough messages for a conversation, use the conversation API
        if (updatedHistory.length >= 2) {
          // Pass products and store info to the conversation API
          aiResponse = await gemini.generateConversationResponse(updatedHistory, products, storeInfo);
        } else {
          // Otherwise fall back to the regular product response with history
          aiResponse = await gemini.generateProductResponse(message, products, conversationHistory, storeInfo);
        }
      } catch (convError) {
        console.error('Conversation API error, falling back to standard API:', convError.message);
        // Fall back to the regular product response with history
        aiResponse = await gemini.generateProductResponse(message, products, conversationHistory, storeInfo);
      }

      // Check if the response contains order information
      let orderInfo = null;
      let orderStatus = null;

      // Check for confirmed order
      const orderInfoMatch = aiResponse.match(/===ORDER_INFO===\s+([\s\S]*?)===END_ORDER===/);

      // Check for pending order
      const orderPendingMatch = aiResponse.match(/===ORDER_PENDING===\s+([\s\S]*?)===END_ORDER===/);

      if (orderInfoMatch && orderInfoMatch[1]) {
        const orderText = orderInfoMatch[1];
        console.log('Confirmed order information detected:', orderText);

        // Extract order details
        const productNameMatch = orderText.match(/PRODUCT_NAME:\s*(.+?)(?:\n|$)/);
        const quantityMatch = orderText.match(/QUANTITY:\s*(\d+)(?:\n|$)/);
        const customerInfoMatch = orderText.match(/CUSTOMER_INFO:\s*(.+?)(?:\n|$)/);
        const notesMatch = orderText.match(/NOTES:\s*(.+?)(?:\n|$)/);
        const statusMatch = orderText.match(/STATUS:\s*(.+?)(?:\n|$)/);

        // Create order object
        if (productNameMatch && productNameMatch[1].trim() && statusMatch && statusMatch[1].trim() === 'CONFIRMED') {
          orderInfo = {
            productName: productNameMatch[1].trim(),
            quantity: quantityMatch && quantityMatch[1] ? parseInt(quantityMatch[1]) : 1,
            customerInfo: customerInfoMatch && customerInfoMatch[1] ? customerInfoMatch[1].trim() : '',
            notes: notesMatch && notesMatch[1] ? notesMatch[1].trim() : '',
            source: platform || 'test'
          };

          // Save order to database
          try {
            const order = await DataStore.addOrder(userId, orderInfo);
            console.log('Order saved:', order.id);
            orderStatus = 'CONFIRMED';

            // Remove order info from response
            aiResponse = aiResponse.replace(/===ORDER_INFO===\s+[\s\S]*?===END_ORDER===/, '').trim();
          } catch (orderError) {
            console.error('Error saving order:', orderError);
          }
        }
      } else if (orderPendingMatch && orderPendingMatch[1]) {
        const orderText = orderPendingMatch[1];
        console.log('Pending order information detected:', orderText);

        // Extract order details
        const productNameMatch = orderText.match(/PRODUCT_NAME:\s*(.+?)(?:\n|$)/);
        const quantityMatch = orderText.match(/QUANTITY:\s*(\d+)(?:\n|$)/);
        const statusMatch = orderText.match(/STATUS:\s*(.+?)(?:\n|$)/);

        if (productNameMatch && productNameMatch[1].trim() && statusMatch && statusMatch[1].trim() === 'WAITING_FOR_INFO') {
          // Store pending order information in session
          orderStatus = 'PENDING';

          // Remove order pending info from response
          aiResponse = aiResponse.replace(/===ORDER_PENDING===\s+[\s\S]*?===END_ORDER===/, '').trim();
        }
      }

      // Save AI response
      const savedResponse = await DataStore.addMessage({
        userId,
        platform: platform || 'test',
        content: aiResponse,
        type: 'ai'
      });

      // Return AI response
      res.json({
        message: savedResponse.content,
        messageId: savedResponse.id,
        timestamp: savedResponse.timestamp,
        orderStatus: orderStatus, // 'CONFIRMED', 'PENDING', or null
        orderCreated: orderInfo ? true : false
      });
    } catch (apiError) {
      console.error('Gemini API error:', apiError);

      // Log detailed error information
      if (apiError.response) {
        console.error('API error response:', apiError.response.data);
        console.error('API error status:', apiError.response.status);
      }

      // Return a more specific error message
      res.status(500).json({
        message: 'خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقاً.',
        error: apiError.message,
        details: apiError.response ? apiError.response.data : null
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      message: 'Error generating response',
      error: error.message
    });
  }
});

// Get message statistics
router.get('/stats', auth.authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const messages = await DataStore.getMessages(userId);

    // Calculate statistics
    const totalMessages = messages.length;
    const userMessages = messages.filter(msg => msg.type === 'user').length;
    const aiMessages = messages.filter(msg => msg.type === 'ai').length;

    // Group by platform
    const platformStats = {};
    messages.forEach(msg => {
      if (!platformStats[msg.platform]) {
        platformStats[msg.platform] = 0;
      }
      platformStats[msg.platform]++;
    });

    // Group by date
    const dateStats = {};
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toISOString().split('T')[0];
      if (!dateStats[date]) {
        dateStats[date] = 0;
      }
      dateStats[date]++;
    });

    res.json({
      totalMessages,
      userMessages,
      aiMessages,
      platformStats,
      dateStats
    });
  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
