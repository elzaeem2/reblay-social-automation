/**
 * API Service for handling all API requests
 */
const API = {
  // Base URL for API requests
  baseUrl: '/api',

  // Store the authentication token
  token: localStorage.getItem('token'),

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  },

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  },

  // Get authentication headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { 'x-auth-token': this.token } : {})
    };
  },

  // Generic request method
  async request(endpoint, method = 'GET', data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options = {
        method,
        headers: this.getHeaders()
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      return result;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  },

  // Authentication methods
  auth: {
    // Register a new user
    async register(userData) {
      return API.request('/auth/register', 'POST', userData);
    },

    // Login user
    async login(credentials) {
      const result = await API.request('/auth/login', 'POST', credentials);
      if (result.token) {
        API.setToken(result.token);
      }
      return result;
    },

    // Get current user
    async getCurrentUser() {
      return API.request('/auth/me');
    },

    // Activate user with code
    async activate(code) {
      return API.request('/auth/activate', 'POST', { code });
    },

    // Logout user
    logout() {
      API.clearToken();
    }
  },

  // Product methods
  products: {
    // Get all products
    async getAll() {
      return API.request('/products');
    },

    // Add a new product
    async add(productData) {
      return API.request('/products', 'POST', productData);
    },

    // Update a product
    async update(productId, productData) {
      return API.request(`/products/${productId}`, 'PUT', productData);
    },

    // Delete a product
    async delete(productId) {
      return API.request(`/products/${productId}`, 'DELETE');
    }
  },

  // Message methods
  messages: {
    // Test Gemini API connection
    async testGemini() {
      return API.request('/messages/test-gemini');
    },

    // Send a message and get AI response
    async sendMessage(message, platform = 'test') {
      return API.request('/messages/chat', 'POST', { message, platform });
    },

    // Get message history
    async getHistory() {
      return API.request('/messages');
    },

    // Get message statistics
    async getStats() {
      return API.request('/messages/stats');
    }
  },

  // OAuth methods
  oauth: {
    // Get Facebook OAuth URL
    async getFacebookAuthUrl() {
      return API.request('/oauth/facebook');
    },

    // Get connected accounts
    async getConnectedAccounts() {
      return API.request('/oauth/accounts');
    },

    // Disconnect account
    async disconnectAccount() {
      return API.request('/oauth/accounts', 'DELETE');
    }
  },

  // Store methods
  store: {
    // Get store information
    async getInfo() {
      return API.request('/store/info');
    },

    // Update store information
    async updateInfo(storeData) {
      return API.request('/store/info', 'POST', storeData);
    }
  },

  // Orders methods
  orders: {
    // Get all orders
    async getAll() {
      return API.request('/orders');
    },

    // Add a new order
    async add(orderData) {
      return API.request('/orders', 'POST', orderData);
    },

    // Update order status
    async updateStatus(orderId, status) {
      return API.request(`/orders/${orderId}/status`, 'PUT', { status });
    },

    // Delete an order
    async delete(orderId) {
      return API.request(`/orders/${orderId}`, 'DELETE');
    }
  },

  // Admin methods
  admin: {
    // Login as admin
    async login(credentials) {
      return API.request('/auth/admin/login', 'POST', credentials);
    },

    // Logout admin
    async logout() {
      return API.request('/auth/admin/logout', 'POST');
    },

    // Check if admin is logged in
    async checkStatus() {
      return API.request('/admin/check');
    },

    // Get all users
    async getUsers() {
      return API.request('/admin/users');
    },

    // Get all activation codes
    async getCodes() {
      return API.request('/admin/codes');
    },

    // Generate new activation code
    async generateCode(codeData) {
      return API.request('/admin/codes', 'POST', codeData);
    },

    // Delete activation code
    async deleteCode(code) {
      return API.request(`/admin/codes/${code}`, 'DELETE');
    },

    // Generic admin GET request
    async get(endpoint) {
      return API.request(endpoint);
    },

    // Generic admin POST request
    async post(endpoint, data) {
      return API.request(endpoint, 'POST', data);
    },

    // Get admin statistics
    async getStats() {
      return API.request('/admin/stats');
    }
  }
};
