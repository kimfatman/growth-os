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
import productRoutes from './routes/products.js';
import pipelineRoutes from './routes/pipeline.js';
import leadRoutes from './routes/leads.js';
import contentRoutes from './routes/content.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Growth OS Backend Server               ║');
  console.log(`║   http://localhost:${String(PORT).padEnd(5)}                     ║`);
  console.log('║   SQLite · JWT · REST API                ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
