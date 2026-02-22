import mongoose, { Document } from 'mongoose';

export interface IPlayer {
  userId: string;
  username: string;
  isReady: boolean;
  joinedAt?: Date;
}


interface ILobby extends Document {
  code: string;
  hostId: string;
  players: IPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'playing' | 'closed';
}

const playerSchema = new mongoose.Schema<IPlayer>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  isReady: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
});

const lobbySchema = new mongoose.Schema<ILobby>({
  code: { 
    type: String, 
    required: true,
    unique: true,
    uppercase: true
  },
  hostId: { type: String, required: true },
  players: [playerSchema],
  maxPlayers: { type: Number, default: 4 },
  status: {
    type: String,
    enum: ['waiting', 'starting', 'playing', 'closed'],
    default: 'waiting'
  }
}, { timestamps: true });

export const Lobby = mongoose.model<ILobby>('Lobby', lobbySchema);