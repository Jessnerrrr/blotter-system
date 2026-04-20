import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Import routes
import caseRoutes from './routes/cases.js';
import summonsRoutes from './routes/summons.js';
import curfewRoutes from './routes/curfews.js';
import blacklistRoutes from './routes/blacklist.js';
import residentRoutes from './routes/residents.js';
import personRoutes from './routes/person.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Allow any localhost port
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Blotter System API',
    version: '1.0.0',
    endpoints: {
      cases: '/api/cases',
      summons: '/api/summons',
      curfews: '/api/curfews',
      blacklist: '/api/blacklist',
      residents: '/api/residents'
    }
  });
});

app.use('/api/cases', caseRoutes);
app.use('/api/summons', summonsRoutes);
app.use('/api/curfews', curfewRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/person', personRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🌐 API: http://localhost:${PORT}`);
  });
}

export default app;
