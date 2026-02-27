export function generateLobbyCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }
  return code;
}

export async function generateUniqueLobbyCode(LobbyModel: any): Promise<string> {
  let code: string;
  let existing: any;
  do {
    code = generateLobbyCode();
    existing = await LobbyModel.findOne({ code });
  } while (existing);
  return code;
}
