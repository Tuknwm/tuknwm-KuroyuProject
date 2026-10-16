const mongoose = require('mongoose');
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kuroyu_db');
    console.log(`[Mongoose] Connected to MongoDB Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Mongoose Error] Database connection failed: ${error.message}`);

  }
};

module.exports = connectDB;
