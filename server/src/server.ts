import express, { Request, Response } from 'express';
import 'dotenv/config';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import{ connectDB } from './config/database';
import { setupLobbySockets } from './sockets/lobbySockets';
import { setupGameSockets } from './sockets/gameSockets';
import lobbyRoutes from './routes/lobbyRoutes';
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const io = new Server(server, {
   cors: {origin: CLIENT_ORIGIN, credentials: true}
  });

app.set('io', io);

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json());

connectDB();

setupLobbySockets(io);
setupGameSockets(io);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server running', database: 'MongoDB' });
});

app.use('/api', authRoutes);
app.use('/api/lobbies', lobbyRoutes);
app.use('/api/users', userRoutes);


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TS Server running on port ${PORT}`);
});