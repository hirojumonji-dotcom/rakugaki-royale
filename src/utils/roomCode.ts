export function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function formatRoomCode(code: string): string {
  return code.replace(/(.{2})/g, '$1 ').trim();
}
