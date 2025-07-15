const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();
const { 
  connectDB, 
  User, 
  Token, 
  Message, 
  Product, 
  Order, 
  Store, 
  ActivationCode 
} = require('./mongodb');

// Path to data directory
const DATA_DIR = path.join(__dirname, '..', 'data');

// Function to migrate data from local files to MongoDB
async function migrateData() {
  try {
    console.log('Starting migration to MongoDB...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Get all files in the data directory
    const files = await fs.readdir(DATA_DIR);
    
    // Process each file
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(DATA_DIR, file);
        const data = await fs.readJson(filePath);
        
        // Extract collection name from file name
        let collectionName = file.replace('.json', '');
        
        // Handle user-specific collections
        if (collectionName.includes('_')) {
          const [baseCollection, userId] = collectionName.split('_');
          
          console.log(`Migrating ${collectionName} to MongoDB...`);
          
          if (baseCollection === 'products') {
            // Delete existing products for this user
            await Product.deleteMany({ userId });
            
            // Add new products
            for (const item of data) {
              await Product.create({
                ...item,
                _id: item.id || undefined,
                userId,
                createdAt: new Date(item.createdAt) || new Date()
              });
            }
            console.log(`Successfully migrated ${data.length} products for user ${userId}`);
          } else if (baseCollection === 'orders') {
            // Delete existing orders for this user
            await Order.deleteMany({ userId });
            
            // Add new orders
            for (const item of data) {
              await Order.create({
                ...item,
                _id: item.id || undefined,
                userId,
                createdAt: new Date(item.createdAt) || new Date(),
                updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
              });
            }
            console.log(`Successfully migrated ${data.length} orders for user ${userId}`);
          } else if (baseCollection === 'store_info') {
            // Delete existing store info for this user
            await Store.deleteMany({ userId });
            
            // Add new store info
            await Store.create({
              ...data,
              _id: userId,
              userId,
              updatedAt: new Date(data.updatedAt) || new Date()
            });
            console.log(`Successfully migrated store info for user ${userId}`);
          }
        } else {
          // Handle regular collections
          console.log(`Migrating ${collectionName} to MongoDB...`);
          
          if (collectionName === 'users') {
            // Delete existing users
            await User.deleteMany({});
            
            // Add new users
            for (const item of data) {
              await User.create({
                ...item,
                _id: item.id || undefined,
                createdAt: new Date(item.createdAt) || new Date(),
                activationExpiry: item.activationExpiry ? new Date(item.activationExpiry) : null
              });
            }
            console.log(`Successfully migrated ${data.length} users`);
          } else if (collectionName === 'tokens') {
            // Delete existing tokens
            await Token.deleteMany({});
            
            // Add new tokens
            for (const item of data) {
              await Token.create({
                ...item,
                _id: item.id || undefined,
                createdAt: new Date(item.createdAt) || new Date(),
                expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
              });
            }
            console.log(`Successfully migrated ${data.length} tokens`);
          } else if (collectionName === 'messages') {
            // Delete existing messages
            await Message.deleteMany({});
            
            // Add new messages
            for (const item of data) {
              await Message.create({
                ...item,
                _id: item.id || undefined,
                timestamp: new Date(item.timestamp) || new Date()
              });
            }
            console.log(`Successfully migrated ${data.length} messages`);
          } else if (collectionName === 'activation_codes') {
            // Delete existing activation codes
            await ActivationCode.deleteMany({});
            
            // Add new activation codes
            for (const item of data) {
              await ActivationCode.create({
                ...item,
                _id: item.code,
                createdAt: new Date(item.createdAt) || new Date(),
                usedAt: item.usedAt ? new Date(item.usedAt) : undefined
              });
            }
            console.log(`Successfully migrated ${data.length} activation codes`);
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateData();
