require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

const { purgeScheduledDeletes } = require('./controllers/userController');
purgeScheduledDeletes();
setInterval(purgeScheduledDeletes, 60 * 60 * 1000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', require('express').static(require('path').join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Kuroyu Backend API Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Kuroyu Backend] Server running on port ${PORT}`);
  console.log(`[Kuroyu Backend] Healthcheck available at http://localhost:${PORT}/api/health`);
});
