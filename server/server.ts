import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/exploding_kittens';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health Check with Types
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server running', database: 'MongoDB' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TS Server running on port ${PORT}`);
});