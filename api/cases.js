import express from 'express';
import cors from 'cors';
import casesRouter from '../../backend/routes/cases.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: /https:\/\/.+\.vercel\.app$/,
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/cases', casesRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Cases API endpoint' });
});

export default app;
