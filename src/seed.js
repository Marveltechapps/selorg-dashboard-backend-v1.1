const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import models from their respective dashboards
const Alert = require('./darkstore/models/Alert'); // Darkstore Alert (different from merch Alert)
const Allocation = require('./merch/models/Allocation'); // Moved from warehouse to merch
const AnalyticsRecord = require('./merch/models/AnalyticsRecord'); // Moved from admin to merch
const ApprovalRequest = require('./merch/models/ApprovalRequest'); // Moved from admin to merch
const AuditLog = require('./common-models/AuditLog');
const Campaign = require('./merch/models/Campaign');
const Collection = require('./merch/models/Collection'); // Moved from admin to merch
const PriceChange = require('./merch/models/PriceChange'); // Moved from admin to merch
const PromoUplift = require('./merch/models/PromoUplift');
const ReplenishmentAlert = require('./merch/models/ReplenishmentAlert'); // Moved from warehouse to merch
const SKU = require('./merch/models/SKU'); // Moved from admin to merch
const StockConflict = require('./merch/models/StockConflict');
const Store = require('./merch/models/Store'); // Moved from admin to merch
const SurgeRule = require('./merch/models/SurgeRule'); // Moved from admin to merch
const Zone = require('./merch/models/Zone');
const logger = require('./core/utils/logger'); // Moved from admin to merch

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/selorg-admin-ops';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB Connected for seeding');
  } catch (err) {
    logger.error('Database connection error:', err.message);
    process.exit(1);
  }
};

// Seed function
const seed = async () => {
  try {
    await connectDB();
    
    // Add your seed data here
    // Example:
    // await SKU.insertMany([...]);
    // await Campaign.insertMany([...]);
    
    logger.info('Seed data inserted successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Seed error:', err);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
