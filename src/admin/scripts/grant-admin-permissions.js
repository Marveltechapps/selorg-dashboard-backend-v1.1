/**
 * Script to grant all permissions to admin users
 * Run this script to ensure admin users have the create_users permission
 * 
 * Usage: node src/admin/scripts/grant-admin-permissions.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Role = require('../models/Role');

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/selorg-admin-ops';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

const grantAdminPermissions = async () => {
  try {
    await connectDB();
    
    // Find all admin users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'Admin', 'super_admin', 'Super Admin'] } 
    });
    
    console.log(`Found ${adminUsers.length} admin user(s)`);
    
    // Grant all permissions (*) to admin users
    for (const user of adminUsers) {
      // Update user's permissions array to include wildcard
      if (!user.permissions || !user.permissions.includes('*')) {
        user.permissions = ['*'];
        await user.save();
        console.log(`✅ Granted all permissions to: ${user.email}`);
      } else {
        console.log(`⏭️  ${user.email} already has all permissions`);
      }
    }
    
    // Also create/update a Super Admin role with all permissions
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        roleType: 'system',
        permissions: ['*'],
        accessScope: 'global',
      });
      console.log('✅ Created Super Admin role');
    } else {
      if (!superAdminRole.permissions.includes('*')) {
        superAdminRole.permissions = ['*'];
        await superAdminRole.save();
        console.log('✅ Updated Super Admin role with all permissions');
      }
    }
    
    console.log('\n✅ All admin users now have full permissions');
    console.log('💡 Please log out and log back in to get a new token with permissions\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

grantAdminPermissions();
