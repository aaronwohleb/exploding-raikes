import { Model } from 'mongoose';
import { ILobby } from '../models/Lobby';

/**
 * Generates a random 6-character lobby code
 */
export function generateLobbyCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codeLength = 6;
  
  let code = '';
  
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
}

/**
 * Makes sure the code isn't already in use
 */
export async function generateUniqueLobbyCode(LobbyModel: Model<ILobby>): Promise<string> {
  let code: string;
  let existingLobby: ILobby | null;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    code = generateLobbyCode();
    existingLobby = await LobbyModel.findOne({ code });
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Could not generate unique lobby code');
    }
  } while (existingLobby);
  
  return code;
}