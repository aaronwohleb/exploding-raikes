import mongoose, { Document, Types } from 'mongoose';
import './User'; // Make sure User model is loaded

export interface ILobby extends Document {
  code: string;
  hostId: Types.ObjectId;  // Reference to User
  players: Types.ObjectId[]; // Array of User ObjectIds
  readyStatus: Map<string, boolean>; // Dictionary of userId -> ready status
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'playing' | 'closed';
}

const lobbySchema = new mongoose.Schema<ILobby>({
  code: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true
  },
  hostId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  players: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  readyStatus: {
    type: Map,
    of: Boolean,
    default: {}
  },
  maxPlayers: { 
    type: Number, 
    default: 4 
  },
  status: {
    type: String,
    enum: ['waiting', 'starting', 'playing', 'closed'],
    default: 'waiting'
  }
}, { timestamps: true });

export const Lobby = mongoose.model<ILobby>('Lobby', lobbySchema);