require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

const chatRoutes = require('./routes/chat');
const scheduleRoutes = require('./routes/schedule');
const eventsRoutes = require('./routes/events');
const applicationsRoutes = require('./routes/applications');
const MaxBotService = require('./services/maxBotService');

const app = express();
const PORT = process.env.PORT || 5000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Initialize MAX Bot if token is provided
let maxBot = null;
if (BOT_TOKEN) {
  maxBot = new MaxBotService(BOT_TOKEN);
  console.log('[MAX Bot] Initializing bot service...');
} else {
  console.warn('⚠️  BOT_TOKEN not set. Bot will not connect to MAX messenger.');
  console.warn('   Set BOT_TOKEN in .env file to enable messenger integration.');
}

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/', limiter); // Apply rate limiting to all API routes

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/applications', applicationsRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MAX Chatbot Server is running' });
});

// Start server
app.listen(PORT, () => {
  const maskedToken = BOT_TOKEN ? `${BOT_TOKEN.slice(0, 6)}...${BOT_TOKEN.slice(-4)}` : 'NOT SET';
  console.log(`🚀 MAX Chatbot Server running on port ${PORT}`);
  console.log(`🔐 BOT_TOKEN: ${maskedToken}`);
  
  if (!BOT_TOKEN) {
    console.warn('⚠️  BOT_TOKEN is not set.');
    console.warn('   Set BOT_TOKEN in .env file to enable MAX messenger bot.');
  } else {
    // Start bot after server is ready
    console.log('[MAX Bot] Starting bot in 2 seconds...');
    setTimeout(async () => {
      if (maxBot) {
        try {
          await maxBot.start();
        } catch (error) {
          console.error('[MAX Bot] Failed to start:', error.message);
        }
      }
    }, 2000);
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (maxBot) {
    await maxBot.stop();
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
