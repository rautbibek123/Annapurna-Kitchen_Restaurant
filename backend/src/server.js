require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const reservations = require('./routes/reservations');
const newsletter = require('./routes/newsletter');
const auth = require('./routes/auth');
const users = require('./routes/users');
const orders = require('./routes/orders');
const menu = require('./routes/menu');
const tables = require('./routes/tables');
const activityLogs = require('./routes/activityLogs');

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Security middleware
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting (100 requests per 10 mins)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100,
});
app.use('/api', limiter);

// Mount routers
app.use('/api/reservations', reservations);
app.use('/api/newsletter', newsletter);
app.use('/api/auth', auth);
app.use('/api/users', users);
app.use('/api/orders', orders);
app.use('/api/menu', menu);
app.use('/api/tables', tables);
app.use('/api/activity-logs', activityLogs);

// Base route for health check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Annapurna Kitchen API is running' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
