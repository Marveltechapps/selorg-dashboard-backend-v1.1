const mongoose = require('mongoose');
const logger = require('../core/utils/logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/selorg-admin-ops';
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('MongoDB Connected', {
      host: conn.connection.host,
      database: conn.connection.name,
    });
  } catch (err) {
    logger.error('Database connection error', {
      error: err.message,
      stack: err.stack,
    });
    logger.warn('Server will continue running, but DB features will be unavailable');
    // We don't exit the process here so the server stays alive for other requests
  }
};

module.exports = connectDB;
