import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import configuration and routes
import configurePassport from './config/passport.js';
import authRoutes from './routes/auth.js';
import missionRoutes from './routes/missions.js';
import imageRoutes from './routes/images.js';
import galleryRoutes from './routes/galleries.js';
import aboutRoutes from './routes/about.js';
import adobeRoutes from './routes/adobe.js';
import gearRoutes from './routes/gear.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Passport configuration
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/galleries', galleryRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/adobe', adobeRoutes);
app.use('/api/gear', gearRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mission-gallery')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📸 Mission Gallery API ready`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err?.oauthError?.data) {
    console.error('OAuth error response:', err.oauthError.data.toString());
  }
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});
