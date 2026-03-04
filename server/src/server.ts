import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import{ connectDB } from './config/database';
import { setupLobbySockets } from './sockets/lobbySockets';

// Routes
import lobbyRoutes from './routes/lobbyRoutes';
import authRoutes from "./routes/authRoutes";

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
   cors: {origin: "http://localhost:3000", credentials: true} 
  });

app.set('io', io);

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
connectDB();

// Initialize WebSockets
setupLobbySockets(io);

// Health Check with Types
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server running', database: 'MongoDB' });
});

// Connect routes to server
app.use('/api', authRoutes);
app.use('/api/lobbies', lobbyRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TS Server running on port ${PORT}`);
});