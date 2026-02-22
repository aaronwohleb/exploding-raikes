import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import { Lobby, IPlayer } from './lobby/models/Lobby';
import { generateUniqueLobbyCode } from './utils/lobbyCode';
// @ts-ignore - Will be used in game routes
import { Game } from '../game-runner/Game';
// @ts-ignore - Will be used in game routes
import { Player } from '../game-runner/Player';
// @ts-ignore - Will be used in game routes
import { Card } from '../game-runner/Card';
// @ts-ignore - Will be used in game routes
import { DrawDeck } from '../game-runner/DrawDeck';
// @ts-ignore - Will be used in game routes
import { DiscardPile } from '../game-runner/DiscardPile';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true }
});

app.use(cors());
app.use(express.json());

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

// ============= LOBBY ROUTES =============
app.post('/api/lobbies', async (req, res) => {
  try {
    const { hostId, hostName, maxPlayers } = req.body;
    if (!hostId || !hostName) {
      return res.status(400).json({ error: 'hostId and hostName required' });
    }
    
    const code = await generateUniqueLobbyCode(Lobby);
    const lobby = new Lobby({
      code,
      hostId,
      players: [{ userId: hostId, username: hostName, isReady: false }],
      maxPlayers: maxPlayers || 4,
      status: 'waiting'
    });
    
    await lobby.save();
    res.status(201).json(lobby);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lobby' });
  }
});

app.post('/api/lobbies/join', async (req, res) => {
  try {
    const { code, userId, username } = req.body;
    if (!code || !userId || !username) {
      return res.status(400).json({ error: 'code, userId, username required' });
    }
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase(), status: 'waiting' });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    if (lobby.players.length >= lobby.maxPlayers) {
      return res.status(400).json({ error: 'Lobby full' });
    }
    
    lobby.players.push({ userId, username, isReady: false });
    await lobby.save();
    
    io.to(`lobby:${lobby.code}`).emit('player-joined', { userId, username });
    res.json(lobby);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

app.get('/api/lobbies/:code', async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ code: req.params.code.toUpperCase() });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    res.json(lobby);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobby' });
  }
});

app.patch('/api/lobbies/:code/players/:userId/ready', async (req, res) => {
  try {
    const { code, userId } = req.params;
    const { isReady } = req.body;
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    
    const player = lobby.players.find((p: IPlayer) => p.userId === userId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    
    player.isReady = isReady;
    await lobby.save();
    
    io.to(`lobby:${lobby.code}`).emit('player-ready', { userId, isReady });
    res.json(lobby);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ready status' });
  }
});

app.delete('/api/lobbies/:code/players/:userId', async (req, res) => {
  try {
    const { code, userId } = req.params;
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    
    lobby.players = lobby.players.filter((p: IPlayer) => p.userId !== userId);
    
    if (lobby.players.length === 0) {
      await Lobby.deleteOne({ _id: lobby._id });
      return res.json({ message: 'Lobby deleted' });
    }
    
    if (lobby.hostId === userId && lobby.players.length > 0) {
      lobby.hostId = lobby.players[0].userId;
    }
    
    await lobby.save();
    io.to(`lobby:${lobby.code}`).emit('player-left', { userId });
    res.json(lobby);
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave lobby' });
  }
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('join-lobby-room', (lobbyCode) => {
    socket.join(`lobby:${lobbyCode}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
