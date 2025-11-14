require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { attachUser, requireRole } = require('./middleware/auth');
const prisma = require('./services/db');

const chatRoutes = require('./routes/chat');
const scheduleRoutes = require('./routes/schedule');
const eventsRoutes = require('./routes/events');
const applicationsRoutes = require('./routes/applications');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const studentsRoutes = require('./routes/students');
const analyticsRoutes = require('./routes/analytics');
// Updated: consolidated bot service now lives in maxBotService.js
const MaxBotService = require('./services/maxBotService');
const { seedAdmin, seedAcademics } = require('./services/seedService');

const app = express();
const PORT = process.env.PORT || 5000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Initialize MAX Bot if token is provided
let maxBot = null;
if (BOT_TOKEN) {
  maxBot = new MaxBotService(BOT_TOKEN);
  global.maxBotInstance = maxBot; // Сохраняем глобально для уведомлений
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
app.use(attachUser); // attach provisional user context

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Protected admin diagnostics route (example)
app.get('/api/admin/db-stats', requireRole('ADMIN','STAFF'), async (req, res) => {
  try {
    const [users, applications, events] = await Promise.all([
      prisma.user.count(),
      prisma.application.count(),
      prisma.event.count()
    ]);
    res.json({ success:true, data:{ users, applications, events }});
  } catch (e) {
    res.status(500).json({ success:false, error:e.message });
  }
});

// Мини-приложение/Frontend удалены — статики нет

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MAX Chatbot Server is running' });
});

// Start server
app.listen(PORT, async () => {
  const maskedToken = BOT_TOKEN ? `${BOT_TOKEN.slice(0, 6)}...${BOT_TOKEN.slice(-4)}` : 'NOT SET';
  console.log(`🚀 MAX Chatbot Server running on port ${PORT}`);
  console.log(`🔐 BOT_TOKEN: ${maskedToken}`);
  
  // Seed admin user on startup
  await seedAdmin();
  // Seed base academic data if empty
  await seedAcademics();
  
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
