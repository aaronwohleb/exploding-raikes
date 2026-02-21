import mongoose, { Document, Schema } from 'mongoose';

// Define interfaces for TypeScript
export interface IPlayer {
  userId: string;
  username: string;
  isReady: boolean;
  joinedAt: Date;
}

export interface ILobby extends Document {
  code: string;
  hostId: string;
  players: IPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'playing' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

// Define the player schema
const playerSchema = new Schema<IPlayer>({
  userId: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  isReady: { 
    type: Boolean, 
    default: false 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Define the lobby schema
const lobbySchema = new Schema<ILobby>({
  code: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true
  },
  hostId: { 
    type: String, 
    required: true 
  },
  players: [playerSchema],
  maxPlayers: { 
    type: Number, 
    default: 4,
    min: 2,
    max: 8
  },
  status: { 
    type: String, 
    enum: ['waiting', 'starting', 'playing', 'closed'],
    default: 'waiting'
  }
}, {
  timestamps: true
});

// Create and export the model
export const Lobby = mongoose.model<ILobby>('Lobby', lobbySchema);