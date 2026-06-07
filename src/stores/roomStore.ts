import { create } from 'zustand';
import type { Room, Player } from '../types';

interface RoomState {
  roomId: string | null;
  room: Room | null;
  players: Player[];
  setRoomId: (id: string | null) => void;
  setRoom: (room: Room | null) => void;
  setPlayers: (players: Player[]) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  room: null,
  players: [],
  setRoomId: (roomId) => set({ roomId }),
  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  reset: () => set({ roomId: null, room: null, players: [] }),
}));
