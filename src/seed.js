const mongoose = require('mongoose');
const dotenv = require('dotenv');
<<<<<<< HEAD
const bcrypt = require('bcryptjs');

// Import User model (shared across all dashboards)
const User = require('./vendor/models/User');
const logger = require('./core/utils/logger');
=======

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
>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a

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

<<<<<<< HEAD
// Seed function - Creates login users for all dashboards
=======
// Seed function
>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
const seed = async () => {
  try {
    await connectDB();
    
<<<<<<< HEAD
    // Default password for all users (change in production!)
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Define users for each dashboard
    const dashboardUsers = [
      {
        email: 'darkstore@selorg.com',
        password: hashedPassword,
        name: 'Darkstore User',
        role: 'darkstore',
      },
      {
        email: 'production@selorg.com',
        password: hashedPassword,
        name: 'Production User',
        role: 'production',
      },
      {
        email: 'vendor@selorg.com',
        password: hashedPassword,
        name: 'Vendor User',
        role: 'vendor',
      },
      {
        email: 'warehouse@selorg.com',
        password: hashedPassword,
        name: 'Warehouse User',
        role: 'warehouse',
      },
      {
        email: 'finance@selorg.com',
        password: hashedPassword,
        name: 'Finance User',
        role: 'finance',
      },
      {
        email: 'rider@selorg.com',
        password: hashedPassword,
        name: 'Rider User',
        role: 'rider',
      },
      {
        email: 'admin@selorg.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      },
      {
        email: 'merch@selorg.com',
        password: hashedPassword,
        name: 'Merch User',
        role: 'merch',
      },
    ];
    
    // Clear existing users (optional - comment out if you want to keep existing users)
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      logger.info(`Found ${existingCount} existing users. Clearing...`);
      await User.deleteMany({});
      logger.info('Existing users cleared');
    }
    
    // Insert users (skip if already exists)
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const userData of dashboardUsers) {
      try {
        const existing = await User.findOne({ email: userData.email });
        if (existing) {
          logger.warn(`User ${userData.email} already exists, skipping...`);
          skippedCount++;
        } else {
          await User.create(userData);
          logger.info(`✅ Created user: ${userData.email} (Role: ${userData.role})`);
          createdCount++;
        }
      } catch (err) {
        logger.error(`Error creating user ${userData.email}:`, err.message);
      }
    }
    
    logger.info('\n========================================');
    logger.info('Seed Summary:');
    logger.info(`✅ Created: ${createdCount} users`);
    logger.info(`⏭️  Skipped: ${skippedCount} users (already exist)`);
    logger.info('========================================\n');
    
    logger.info('Login Credentials for all dashboards:');
    logger.info('--------------------------------------');
    dashboardUsers.forEach(user => {
      logger.info(`📧 ${user.email} | 🔑 password: ${defaultPassword} | 👤 Role: ${user.role}`);
    });
    logger.info('--------------------------------------\n');
    
    logger.info('✅ Seed data inserted successfully');
    logger.info('💡 You can now login to any dashboard using the credentials above');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed error:', err);
    await mongoose.connection.close();
=======
    // Add your seed data here
    // Example:
    // await SKU.insertMany([...]);
    // await Campaign.insertMany([...]);
    
    logger.info('Seed data inserted successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Seed error:', err);
>>>>>>> 6591dc33a9b88417e6a52adeaff72e27b1dee13a
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seed();
}

module.exports = seed;
