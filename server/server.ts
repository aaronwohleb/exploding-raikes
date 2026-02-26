import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { Lobby, IPlayer } from './src/lobby/models/Lobby'; 
import { generateUniqueLobbyCode } from './src/utils/lobbyCode'; 


const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "http://localhost:3000", credentials: true }
});

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



app.post('/api/lobbies', async (req, res) => {
  try {
    const { userId, maxPlayers } = req.body; // username comes from User model
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const code = await generateUniqueLobbyCode(Lobby);
    const lobby = new Lobby({
      code,
      hostId: userId,
      players: [userId], // Add host to players array
      readyStatus: { [userId]: false }, // Initialize ready status
      maxPlayers: maxPlayers || 4,
      status: 'waiting'
    });
    
    await lobby.save();
    
    // Populate user details
    const populatedLobby = await Lobby.findById(lobby._id)
      .populate('hostId', 'username email')
      .populate('players', 'username email');
      
    res.status(201).json(populatedLobby);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create lobby' });
  }
});

// JOIN a lobby
app.post('/api/lobbies/join', async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) {
      return res.status(400).json({ error: 'code and userId required' });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase(), status: 'waiting' });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    if (lobby.players.length >= lobby.maxPlayers) {
      return res.status(400).json({ error: 'Lobby full' });
    }
    
    // Check if user already in lobby
    if (lobby.players.includes(userId as any)) {
      return res.status(400).json({ error: 'User already in lobby' });
    }
    
    // Add user to players array and initialize ready status
    lobby.players.push(userId as any);
    lobby.readyStatus.set(userId, false);
    
    await lobby.save();
    
    // Populate user details
    const populatedLobby = await Lobby.findById(lobby._id)
      .populate('hostId', 'username email')
      .populate('players', 'username email');
    
    // Get ready count
    const readyCount = Array.from(lobby.readyStatus.values()).filter(v => v).length;
    
    io.to(`lobby:${lobby.code}`).emit('player-joined', { 
      userId: userId,
      username: user.username,
      playerCount: lobby.players.length,
      readyCount
    });
    
    res.json(populatedLobby);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

// GET lobby details
app.get('/api/lobbies/:code', async (req, res) => {
  try {
    const lobby = await Lobby.findOne({ code: req.params.code.toUpperCase() })
      .populate('hostId', 'username email')
      .populate('players', 'username email');
      
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    
    // Transform the response to include ready status with user info
    const response = {
      ...lobby.toObject(),
      players: lobby.players.map(player => ({
        ...player.toObject(),
        isReady: lobby.readyStatus.get(player._id.toString()) || false
      }))
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobby' });
  }
});

// UPDATE player ready status
app.patch('/api/lobbies/:code/players/:userId/ready', async (req, res) => {
  try {
    const { code, userId } = req.params;
    const { isReady } = req.body;
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    
    // Check if user is in lobby
    if (!lobby.players.includes(userId as any)) {
      return res.status(404).json({ error: 'Player not in lobby' });
    }
    
    // Update ready status
    lobby.readyStatus.set(userId, isReady);
    await lobby.save();
    
    // Get user details for response
    const user = await User.findById(userId);
    
    // Calculate ready count
    const readyCount = Array.from(lobby.readyStatus.values()).filter(v => v).length;
    
    io.to(`lobby:${lobby.code}`).emit('player-ready', { 
      userId, 
      isReady,
      username: user?.username,
      readyCount
    });
    
    // Return populated lobby
    const populatedLobby = await Lobby.findById(lobby._id)
      .populate('hostId', 'username email')
      .populate('players', 'username email');
    
    const response = {
      ...populatedLobby?.toObject(),
      players: populatedLobby?.players.map(player => ({
        ...player.toObject(),
        isReady: lobby.readyStatus.get(player._id.toString()) || false
      }))
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ready status' });
  }
});

// LEAVE lobby
app.delete('/api/lobbies/:code/players/:userId', async (req, res) => {
  try {
    const { code, userId } = req.params;
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    
    // Remove user from players array and readyStatus
    lobby.players = lobby.players.filter(id => id.toString() !== userId);
    lobby.readyStatus.delete(userId);
    
    if (lobby.players.length === 0) {
      await Lobby.deleteOne({ _id: lobby._id });
      return res.json({ message: 'Lobby deleted' });
    }
    
    // If host left, assign new host
    if (lobby.hostId.toString() === userId && lobby.players.length > 0) {
      lobby.hostId = lobby.players[0];
    }
    
    await lobby.save();
    
    // Get user details for notification
    const user = await User.findById(userId);
    
    // Calculate ready count
    const readyCount = Array.from(lobby.readyStatus.values()).filter(v => v).length;
    
    io.to(`lobby:${lobby.code}`).emit('player-left', { 
      userId,
      username: user?.username,
      playerCount: lobby.players.length,
      readyCount
    });
    
    // Return populated lobby
    const populatedLobby = await Lobby.findById(lobby._id)
      .populate('hostId', 'username email')
      .populate('players', 'username email');
    
    const response = {
      ...populatedLobby?.toObject(),
      players: populatedLobby?.players.map(player => ({
        ...player.toObject(),
        isReady: lobby.readyStatus.get(player._id.toString()) || false
      }))
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave lobby' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TS Server running on port ${PORT} with lobby support`);
});