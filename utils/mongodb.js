const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media-automation';

// Connect to MongoDB with retry logic for Glitch
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Retrying connection in 5 seconds...');
    // Instead of exiting, retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Define schemas and models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  messageCount: { type: Number, default: 0 },
  freeMessagesRemaining: { type: Number, default: 50 },
  activationCode: { type: String, default: null },
  activationExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const tokenSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  accessToken: { type: String, required: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sender: { type: String },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isFromUser: { type: Boolean, default: false }
});

const productSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  customerName: { type: String },
  customerContact: { type: String },
  products: [{
    productId: { type: String },
    name: { type: String },
    quantity: { type: Number },
    price: { type: Number }
  }],
  totalAmount: { type: Number },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

const storeSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  address: { type: String, default: '' },
  description: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const activationCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  duration: { type: Number }, // in days
  used: { type: Boolean, default: false },
  usedBy: { type: String },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const contactInfoSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  supportEmail: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  workingHours: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Token = mongoose.model('Token', tokenSchema);
const Message = mongoose.model('Message', messageSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Store = mongoose.model('Store', storeSchema);
const ActivationCode = mongoose.model('ActivationCode', activationCodeSchema);
const ContactInfo = mongoose.model('ContactInfo', contactInfoSchema);

module.exports = {
  connectDB,
  User,
  Token,
  Message,
  Product,
  Order,
  Store,
  ActivationCode,
  ContactInfo
};
