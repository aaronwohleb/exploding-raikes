import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Lobby } from './models/Lobby';
import { generateUniqueLobbyCode } from './utils/lobbyCode';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/exploding_kittens';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'Server running', 
    database: 'MongoDB',
    timestamp: new Date().toISOString()
  });
});

// ============= LOBBY ROUTES =============

// CREATE a new lobby
app.post('/api/lobbies', async (req: Request, res: Response) => {
  console.log('📝 Creating lobby with:', req.body);
  
  try {
    const { hostId, hostName, maxPlayers } = req.body;
    
    // Validate required fields
    if (!hostId || !hostName) {
      return res.status(400).json({ 
        error: 'hostId and hostName are required' 
      });
    }
    
    // Generate a unique code
    const code = await generateUniqueLobbyCode(Lobby);
    
    // Create the lobby
    const lobby = new Lobby({
      code,
      hostId,
      players: [{
        userId: hostId,
        username: hostName,
        isReady: false
      }],
      maxPlayers: maxPlayers || 4,
      status: 'waiting'
    });
    
    // Save to database
    await lobby.save();
    
    console.log('✅ Lobby created with code:', code);
    res.status(201).json(lobby);
    
  } catch (error) {
    console.error('❌ Error creating lobby:', error);
    res.status(500).json({ error: 'Failed to create lobby' });
  }
});

// JOIN a lobby with a code
app.post('/api/lobbies/join', async (req: Request, res: Response) => {
  console.log('📝 Joining lobby with:', req.body);
  
  try {
    const { code, userId, username } = req.body;
    
    // Validate required fields
    if (!code || !userId || !username) {
      return res.status(400).json({ 
        error: 'code, userId, and username are required' 
      });
    }
    
    // Find the lobby
    const lobby = await Lobby.findOne({ 
      code: code.toUpperCase(), 
      status: 'waiting' 
    });
    
    if (!lobby) {
      return res.status(404).json({ 
        error: 'Lobby not found or already started' 
      });
    }
    
    // Check if lobby is full
    if (lobby.players.length >= lobby.maxPlayers) {
      return res.status(400).json({ 
        error: 'Lobby is full' 
      });
    }
    
    // Check if player is already in lobby
    const alreadyInLobby = lobby.players.some((p: { userId: string }) => p.userId === userId);
    if (alreadyInLobby) {
      return res.status(400).json({ 
        error: 'You are already in this lobby' 
      });
    }
    
    // Add the player
    lobby.players.push({
      userId,
      username,
      isReady: false
    });
    
    await lobby.save();
    
    console.log(`✅ ${username} joined lobby ${lobby.code}`);
    res.json(lobby);
    
  } catch (error) {
    console.error('❌ Error joining lobby:', error);
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

// GET lobby details by code
app.get('/api/lobbies/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    
    if (!lobby) {
      return res.status(404).json({ 
        error: 'Lobby not found' 
      });
    }
    
    res.json(lobby);
    
  } catch (error) {
    console.error('❌ Error fetching lobby:', error);
    res.status(500).json({ error: 'Failed to fetch lobby' });
  }
});

// UPDATE player ready status
app.patch('/api/lobbies/:code/players/:userId/ready', async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.params;
    const { isReady } = req.body;
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    
    if (!lobby) {
      return res.status(404).json({ 
        error: 'Lobby not found' 
      });
    }
    
    // Find the player and update their ready status
   const player = lobby.players.find((p: { userId: string }) => p.userId === userId);
    if (!player) {
      return res.status(404).json({ 
        error: 'Player not found in lobby' 
      });
    }
    
    player.isReady = isReady;
    await lobby.save();
    
    res.json(lobby);
    
  } catch (error) {
    console.error('❌ Error updating player ready status:', error);
    res.status(500).json({ error: 'Failed to update ready status' });
  }
});

// DELETE/LEAVE lobby
app.delete('/api/lobbies/:code/players/:userId', async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.params;
    
    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    
    if (!lobby) {
      return res.status(404).json({ 
        error: 'Lobby not found' 
      });
    }
    
    // Remove player from lobby
    lobby.players = lobby.players.filter((p: { userId: string }) => p.userId !== userId);
    
    // If no players left, delete the lobby
    if (lobby.players.length === 0) {
      await Lobby.deleteOne({ _id: lobby._id });
      return res.json({ message: 'Lobby deleted' });
    }
    
    // If host left, assign new host
    if (lobby.hostId === userId && lobby.players.length > 0) {
      lobby.hostId = lobby.players[0].userId;
    }
    
    await lobby.save();
    res.json(lobby);
    
  } catch (error) {
    console.error('❌ Error leaving lobby:', error);
    res.status(500).json({ error: 'Failed to leave lobby' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Try these endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`   - POST http://localhost:${PORT}/api/lobbies`);
  console.log(`   - POST http://localhost:${PORT}/api/lobbies/join`);
});