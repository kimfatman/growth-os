import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import timelineRoutes from './routes/timeline.js';
import targetRoutes from './routes/targets.js';
import aiRoutes from './routes/ai.js';
import gamificationRoutes from './routes/gamification.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gamification', gamificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Growth OS Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
