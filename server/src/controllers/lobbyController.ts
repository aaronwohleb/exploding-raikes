import { Request, Response } from 'express';
import { Lobby } from '../types/Lobby';
import BackendUser from '../types/BackendUser'; // Assuming you have this file
import { generateLobbyCode } from '../utils/lobbyCode';
import { LobbyState } from '../types/types';
import { Server } from 'socket.io';

// --- HELPERS ---

async function generateUniqueLobbyCode(): Promise<string> {
  let code: string;
  let existing: any;
  do {
    code = generateLobbyCode();
    existing = await Lobby.findOne({ code });
  } while (existing);
  return code;
}

function formatLobbyResponse(lobby: any): LobbyState | null{
  if (!lobby) return null;

  // Convert Mongoose Map to a Record<string, boolean>
  const readyStatusMap = lobby.readyStatus || new Map();
  const readyStatus: Record<string, boolean> = Object.fromEntries(readyStatusMap);

  // Map players strictly to the FrontendUser interface
  const formattedPlayers = lobby.players.map((player: any) => {
    return {
      _id: player._id?.toString() || player.toString(),
      username: player.username || "",
      email: player.email || ""
    };
  });

  
  return {
    _id: lobby._id.toString(),
    code: lobby.code,
    hostId: (lobby.hostId?._id || lobby.hostId)?.toString(),
    players: formattedPlayers,
    readyStatus: readyStatus,
    maxPlayers: lobby.maxPlayers,
    status: lobby.status
  };
}

// --- CONTROLLER FUNCTIONS ---

export const createLobby = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, maxPlayers } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const user = await BackendUser.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const code = await generateUniqueLobbyCode();

    const lobby = new Lobby({
      code,
      hostId: userId,
      players: [userId],
      readyStatus: { [userId]: false },
      maxPlayers: maxPlayers || 4,
      status: 'waiting'
    });

    await lobby.save();

    const populatedLobby = await Lobby.findById(lobby._id).populate('players', 'username email');
    res.status(201).json(formatLobbyResponse(populatedLobby));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create lobby' });
  }
};

export const joinLobby = async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: 'code and userId required' });

    const user = await BackendUser.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lobby = await Lobby.findOne({ code: code.toUpperCase(), status: 'waiting' });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    if (lobby.players.length >= lobby.maxPlayers) return res.status(400).json({ error: 'Lobby full' });
    if (lobby.players.includes(userId as any)) return res.status(400).json({ error: 'User already in lobby' });

    lobby.players.push(userId as any);
    lobby.readyStatus.set(userId, false);
    await lobby.save();

    const populatedLobby = await Lobby.findById(lobby._id).populate('players', 'username email');
    const readyCount = Array.from(lobby.readyStatus.values()).filter(v => v).length;

    // Grab the IO instance from the Express app
    const io = req.app.get('io');
    io.to(`lobby:${lobby.code}`).emit('player-joined', {
      userId: userId,
      username: user.username,
      playerCount: lobby.players.length,
      readyCount
    });

    res.json(formatLobbyResponse(populatedLobby));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join lobby' });
  }
};

export const getLobbyDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const lobby = await Lobby.findOne({ code: req.params.code.toUpperCase() });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    res.json(formatLobbyResponse(lobby));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobby' });
  }
};

export const updateReadyStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, userId } = req.params;
    const { isReady } = req.body;

    const lobby = await Lobby.findOne({ code: code.toUpperCase() });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    if (!lobby.players.includes(userId as any)) return res.status(404).json({ error: 'Player not in lobby' });

    lobby.readyStatus.set(userId, isReady);
    await lobby.save();

    const user = await BackendUser.findById(userId);
    const readyCount = Array.from(lobby.readyStatus.values()).filter(v => v).length;

    const io = req.app.get('io');
    io.to(`lobby:${lobby.code}`).emit('player-ready', {
      userId,
      isReady,
      username: user?.username,
      readyCount
    });

    const populatedLobby = await Lobby.findById(lobby._id).populate('players', 'username email');
    res.json(formatLobbyResponse(populatedLobby));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ready status' });
  }
};

/**
 * Helper function to process a player leaving, used both for socket disconnects and explicit leave requests.
 * @param code Lobby code
 * @param userId 
 * @param io 
 * @returns Updated LobbyState
 */
export const processPlayerLeave = async (code: string, userId: string, io: Server) => {
  const lobby = await Lobby.findOne({ code: code.toUpperCase() });
  if (!lobby) return null;

  lobby.players = lobby.players.filter((id: any) => id.toString() !== userId);
  lobby.readyStatus.delete(userId);

  if (lobby.players.length === 0) {
    await Lobby.deleteOne({ _id: lobby._id });
    return { message: 'Lobby deleted' };
  }

  let newHostId = lobby.hostId;
  if (lobby.hostId.toString() === userId && lobby.players.length > 0) {
    lobby.hostId = lobby.players[0];
    newHostId = lobby.players[0];
  }
  await lobby.save();

  const user = await BackendUser.findById(userId);
  const readyCount = Array.from(lobby.readyStatus.values()).filter(v => v).length;

  io.to(`lobby:${lobby.code}`).emit('player-left', {
    userId,
    username: user?.username,
    playerCount: lobby.players.length,
    readyCount,
    newHostId: newHostId.toString()
  });

  const populatedLobby = await Lobby.findById(lobby._id).populate('players', 'username email');
  return formatLobbyResponse(populatedLobby);
};

export const leaveLobby = async (req: Request, res: Response): Promise<any> => {
  try {
    const { code, userId } = req.params;
    const io = req.app.get('io'); // Grab io from Express
    
    const result = await processPlayerLeave(code, userId, io);
    
    if (!result) return res.status(404).json({ error: 'Lobby not found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave lobby' });
  }
};