require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Product.updateMany(
    { $or: [{ reviewCount: { $exists: false } }, { reviewCount: 0 }] },
    { $set: { rating: null } }
  );
  console.log(`Reset rating to null for ${result.modifiedCount} products.`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
