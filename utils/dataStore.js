const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const {
  connectDB,
  User,
  Token,
  Message,
  Product,
  Order,
  Store,
  ActivationCode,
  ContactInfo
} = require('./mongodb');

// Connect to MongoDB
connectDB();

// For local development and backward compatibility
// Glitch uses .data directory for persistent storage
const DATA_DIR = path.join(__dirname, '..', '.data');

// Ensure data directory exists for local development
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DataStore {
  // Generic methods for data manipulation
  static async readData(fileName) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Extract collection name from fileName (remove .json extension)
        const collectionName = fileName.replace('.json', '');

        // Map file names to MongoDB models
        const modelMap = {
          'users': User,
          'tokens': Token,
          'messages': Message,
          'activation_codes': ActivationCode
        };

        // Handle user-specific collections
        if (collectionName.includes('_')) {
          const [baseCollection, userId] = collectionName.split('_');

          // Map base collection names to MongoDB models
          const userModelMap = {
            'products': Product,
            'orders': Order,
            'store_info': Store,
            'contact_info': ContactInfo
          };

          if (userModelMap[baseCollection]) {
            const items = await userModelMap[baseCollection].find({ userId });
            return items.map(item => item.toObject());
          }

          return [];
        }

        // Handle regular collections
        if (modelMap[collectionName]) {
          const items = await modelMap[collectionName].find();
          return items.map(item => item.toObject());
        }

        return [];
      } else {
        // Fallback to file-based storage for local development
        const filePath = path.join(DATA_DIR, fileName);
        if (!fs.existsSync(filePath)) {
          return [];
        }
        return fs.readJsonSync(filePath);
      }
    } catch (error) {
      console.error(`Error reading ${fileName}:`, error);
      return [];
    }
  }

  static async writeData(fileName, data) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Extract collection name from fileName (remove .json extension)
        const collectionName = fileName.replace('.json', '');

        // Map file names to MongoDB models
        const modelMap = {
          'users': User,
          'tokens': Token,
          'messages': Message,
          'activation_codes': ActivationCode
        };

        // Handle user-specific collections
        if (collectionName.includes('_')) {
          const [baseCollection, userId] = collectionName.split('_');

          // Map base collection names to MongoDB models
          const userModelMap = {
            'products': Product,
            'orders': Order,
            'store_info': Store,
            'contact_info': ContactInfo
          };

          if (userModelMap[baseCollection]) {
            // Delete existing documents for this user
            await userModelMap[baseCollection].deleteMany({ userId });

            // Add new documents
            if (Array.isArray(data)) {
              for (const item of data) {
                await userModelMap[baseCollection].create({
                  ...item,
                  userId,
                  _id: item.id || uuidv4()
                });
              }
            } else {
              // For single objects like store_info
              await userModelMap[baseCollection].create({
                ...data,
                userId,
                _id: data.id || userId
              });
            }
          }
        } else {
          // Handle regular collections
          if (modelMap[collectionName]) {
            // Delete all existing documents
            await modelMap[collectionName].deleteMany({});

            // Add new documents
            for (const item of data) {
              await modelMap[collectionName].create({
                ...item,
                _id: item.id || uuidv4()
              });
            }
          }
        }
        return true;
      } else {
        // Fallback to file-based storage for local development
        const filePath = path.join(DATA_DIR, fileName);
        await fs.writeJson(filePath, data, { spaces: 2 });
        return true;
      }
    } catch (error) {
      console.error(`Error writing to ${fileName}:`, error);
      return false;
    }
  }

  // User-specific methods
  static async getUsers() {
    return this.readData('users.json');
  }

  static async getUserById(userId) {
    const users = await this.getUsers();
    return users.find(user => user.id === userId);
  }

  static async getUserByUsername(username) {
    const users = await this.getUsers();
    return users.find(user => user.username === username);
  }

  static async createUser(userData) {
    const users = await this.getUsers();
    const newUser = {
      id: uuidv4(),
      ...userData,
      messageCount: 0,
      freeMessagesRemaining: 50,
      activationCode: null,
      activationExpiry: null,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await this.writeData('users.json', users);
    return newUser;
  }

  static async updateUser(userId, updates) {
    const users = await this.getUsers();
    const index = users.findIndex(user => user.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      await this.writeData('users.json', users);
      return users[index];
    }
    return null;
  }

  // Product-specific methods
  static async getProducts(userId) {
    return this.readData(`products_${userId}.json`);
  }

  static async addProduct(userId, productData) {
    const products = await this.getProducts(userId) || [];
    const newProduct = {
      id: uuidv4(),
      ...productData,
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    await this.writeData(`products_${userId}.json`, products);
    return newProduct;
  }

  static async updateProduct(userId, productId, updates) {
    const products = await this.getProducts(userId);
    const index = products.findIndex(product => product.id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      await this.writeData(`products_${userId}.json`, products);
      return products[index];
    }
    return null;
  }

  static async deleteProduct(userId, productId) {
    const products = await this.getProducts(userId);
    const filteredProducts = products.filter(product => product.id !== productId);
    await this.writeData(`products_${userId}.json`, filteredProducts);
    return true;
  }

  // Message-specific methods
  static async getMessages(userId) {
    const allMessages = await this.readData('messages.json');
    return allMessages.filter(message => message.userId === userId);
  }

  static async getRecentMessages(userId, count = 5) {
    const allMessages = await this.readData('messages.json');
    const userMessages = allMessages.filter(message => message.userId === userId);

    // Sort messages by timestamp (newest first)
    userMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return the most recent messages (limited by count)
    return userMessages.slice(0, count);
  }

  static async getConversationHistory(userId, count = 5) {
    const allMessages = await this.readData('messages.json');
    const userMessages = allMessages.filter(message => message.userId === userId);

    // Sort messages by timestamp (oldest first)
    userMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Get the most recent messages
    const recentMessages = userMessages.slice(-count * 2); // Get twice the count to ensure we have pairs

    return recentMessages;
  }

  static async addMessage(messageData) {
    const messages = await this.readData('messages.json');
    const newMessage = {
      id: uuidv4(),
      ...messageData,
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    await this.writeData('messages.json', messages);
    return newMessage;
  }

  // Contact information methods
  static async getContactInfo(userId) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Get contact info from MongoDB
        let contact = await ContactInfo.findOne({ userId });

        if (!contact) {
          // Create default contact info
          contact = new ContactInfo({
            userId,
            phone: '',
            address: '',
            supportEmail: '',
            whatsapp: '',
            workingHours: '',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await contact.save();
        }

        return contact.toObject();
      } else {
        // Fallback to file-based storage for local development
        const filePath = path.join(DATA_DIR, `contact_info_${userId}.json`);

        try {
          const data = await fs.readFile(filePath, 'utf8');
          return JSON.parse(data);
        } catch (error) {
          // Return default contact info if file doesn't exist
          return {
            userId,
            phone: '',
            address: '',
            supportEmail: '',
            whatsapp: '',
            workingHours: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.error('Error getting contact info:', error);
      return {
        userId,
        phone: '',
        address: '',
        supportEmail: '',
        whatsapp: '',
        workingHours: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  static async updateContactInfo(userId, contactInfo) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Update contact info in MongoDB
        const currentInfo = await this.getContactInfo(userId);

        const updatedInfo = {
          ...currentInfo,
          ...contactInfo,
          userId,
          updatedAt: new Date()
        };

        let contact = await ContactInfo.findOne({ userId });
        if (contact) {
          Object.assign(contact, updatedInfo);
          await contact.save();
        } else {
          contact = new ContactInfo(updatedInfo);
          await contact.save();
        }

        return contact.toObject();
      } else {
        // Fallback to file-based storage for local development
        const filePath = path.join(DATA_DIR, `contact_info_${userId}.json`);
        const currentInfo = await this.getContactInfo(userId);

        const updatedInfo = {
          ...currentInfo,
          ...contactInfo,
          updatedAt: new Date().toISOString()
        };

        await fs.writeFile(filePath, JSON.stringify(updatedInfo, null, 2));
        return updatedInfo;
      }
    } catch (error) {
      console.error('Error updating contact info:', error);
      throw error;
    }
  }

  // Store information methods
  static async getStoreInfo(userId) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Get store info from MongoDB
        let store = await Store.findOne({ userId });

        if (!store) {
          // Create default store info
          const defaultStoreInfo = {
            _id: userId,
            userId,
            name: '',
            address: '',
            description: '',
            updatedAt: new Date()
          };
          store = await Store.create(defaultStoreInfo);
          return store.toObject();
        }

        return store.toObject();
      } else {
        // Fallback to file-based storage for local development
        const filePath = path.join(DATA_DIR, `store_info_${userId}.json`);
        if (!fs.existsSync(filePath)) {
          // Create default store info
          const defaultStoreInfo = {
            name: '',
            address: '',
            description: '',
            updatedAt: new Date().toISOString()
          };
          await fs.writeJson(filePath, defaultStoreInfo, { spaces: 2 });
          return defaultStoreInfo;
        }
        return fs.readJsonSync(filePath);
      }
    } catch (error) {
      console.error(`Error reading store info for user ${userId}:`, error);
      return {
        name: '',
        address: '',
        description: '',
        updatedAt: new Date().toISOString()
      };
    }
  }

  static async updateStoreInfo(userId, storeInfo) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Update store info in MongoDB
        const currentInfo = await this.getStoreInfo(userId);

        const updatedInfo = {
          ...currentInfo,
          ...storeInfo,
          userId,
          updatedAt: new Date()
        };

        // Remove MongoDB specific fields
        if (updatedInfo._id) {
          delete updatedInfo._id;
        }
        if (updatedInfo.__v) {
          delete updatedInfo.__v;
        }

        const store = await Store.findOneAndUpdate(
          { userId },
          updatedInfo,
          { new: true, upsert: true }
        );

        return store.toObject();
      } else {
        // Fallback to file-based storage for local development
        const filePath = path.join(DATA_DIR, `store_info_${userId}.json`);
        const currentInfo = await this.getStoreInfo(userId);

        const updatedInfo = {
          ...currentInfo,
          ...storeInfo,
          updatedAt: new Date().toISOString()
        };

        await fs.writeJson(filePath, updatedInfo, { spaces: 2 });
        return updatedInfo;
      }
    } catch (error) {
      console.error(`Error updating store info for user ${userId}:`, error);
      throw error;
    }
  }

  // Orders methods
  static async getOrders(userId) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Get orders from MongoDB
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        return orders.map(order => order.toObject());
      } else {
        // Fallback to file-based storage for local development
        const filePath = path.join(DATA_DIR, `orders_${userId}.json`);
        if (!fs.existsSync(filePath)) {
          await fs.writeJson(filePath, [], { spaces: 2 });
          return [];
        }
        return fs.readJsonSync(filePath);
      }
    } catch (error) {
      console.error(`Error reading orders for user ${userId}:`, error);
      return [];
    }
  }

  static async addOrder(userId, orderData) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Add order to MongoDB
        const orderId = uuidv4();
        const newOrder = {
          _id: orderId,
          ...orderData,
          userId,
          status: orderData.status || 'pending',
          createdAt: new Date()
        };

        const order = await Order.create(newOrder);
        return order.toObject();
      } else {
        // Fallback to file-based storage for local development
        const orders = await this.getOrders(userId);
        const newOrder = {
          id: uuidv4(),
          ...orderData,
          status: orderData.status || 'pending',
          createdAt: new Date().toISOString()
        };
        orders.push(newOrder);

        const filePath = path.join(DATA_DIR, `orders_${userId}.json`);
        await fs.writeJson(filePath, orders, { spaces: 2 });
        return newOrder;
      }
    } catch (error) {
      console.error(`Error adding order for user ${userId}:`, error);
      throw error;
    }
  }

  static async updateOrderStatus(userId, orderId, status) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Update order status in MongoDB
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
          throw new Error('Order not found');
        }

        order.status = status;
        order.updatedAt = new Date();
        await order.save();

        return order.toObject();
      } else {
        // Fallback to file-based storage for local development
        const orders = await this.getOrders(userId);
        const orderIndex = orders.findIndex(order => order.id === orderId);

        if (orderIndex === -1) {
          throw new Error('Order not found');
        }

        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();

        const filePath = path.join(DATA_DIR, `orders_${userId}.json`);
        await fs.writeJson(filePath, orders, { spaces: 2 });
        return orders[orderIndex];
      }
    } catch (error) {
      console.error(`Error updating order status for user ${userId}:`, error);
      throw error;
    }
  }

  static async deleteOrder(userId, orderId) {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Delete order from MongoDB
        const result = await Order.deleteOne({ _id: orderId, userId });

        if (result.deletedCount === 0) {
          throw new Error('Order not found');
        }

        return { success: true };
      } else {
        // Fallback to file-based storage for local development
        const orders = await this.getOrders(userId);
        const updatedOrders = orders.filter(order => order.id !== orderId);

        if (updatedOrders.length === orders.length) {
          throw new Error('Order not found');
        }

        const filePath = path.join(DATA_DIR, `orders_${userId}.json`);
        await fs.writeJson(filePath, updatedOrders, { spaces: 2 });
        return { success: true };
      }
    } catch (error) {
      console.error(`Error deleting order for user ${userId}:`, error);
      throw error;
    }
  }

  // Activation code methods
  static async getActivationCodes() {
    if (process.env.NODE_ENV === 'production') {
      // Get activation codes from MongoDB
      const codes = await ActivationCode.find().sort({ createdAt: -1 });
      return codes.map(code => code.toObject());
    } else {
      // Fallback to file-based storage for local development
      return this.readData('activation_codes.json');
    }
  }

  static async createActivationCode(codeData) {
    const generatedCode = uuidv4().substring(0, 8).toUpperCase();
    const newCode = {
      _id: generatedCode,
      code: generatedCode,
      ...codeData,
      used: false,
      createdAt: new Date()
    };

    if (process.env.NODE_ENV === 'production') {
      // Add activation code to MongoDB
      const code = await ActivationCode.create(newCode);
      return code.toObject();
    } else {
      // Fallback to file-based storage for local development
      const codes = await this.getActivationCodes();
      codes.push({
        ...newCode,
        createdAt: new Date().toISOString()
      });
      await this.writeData('activation_codes.json', codes);
      return newCode;
    }
  }

  static async useActivationCode(code, userId) {
    if (process.env.NODE_ENV === 'production') {
      // Update activation code in MongoDB
      const activationCode = await ActivationCode.findOne({ code, used: false });

      if (!activationCode) {
        return null;
      }

      activationCode.used = true;
      activationCode.usedBy = userId;
      activationCode.usedAt = new Date();
      await activationCode.save();

      return activationCode.toObject();
    } else {
      // Fallback to file-based storage for local development
      const codes = await this.getActivationCodes();
      const index = codes.findIndex(c => c.code === code && !c.used);

      if (index !== -1) {
        codes[index].used = true;
        codes[index].usedBy = userId;
        codes[index].usedAt = new Date().toISOString();
        await this.writeData('activation_codes.json', codes);
        return codes[index];
      }
      return null;
    }
  }

  static async validateActivationCode(code) {
    if (process.env.NODE_ENV === 'production') {
      // Validate activation code in MongoDB
      const activationCode = await ActivationCode.findOne({ code, used: false });
      return activationCode ? activationCode.toObject() : null;
    } else {
      // Fallback to file-based storage for local development
      const codes = await this.getActivationCodes();
      return codes.find(c => c.code === code && !c.used);
    }
  }
}

module.exports = DataStore;
