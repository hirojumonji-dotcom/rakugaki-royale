import { create } from 'zustand';
import type { Drawing, Vote, RoundResult, GamePhase } from '../types';

interface GameState {
  currentRound: number;
  currentPhase: GamePhase;
  currentTopic: string;
  myDrawing: string | null;
  drawings: Drawing[];
  votes: Vote[];
  results: RoundResult[];
  isSubmitted: boolean;
  hasVoted: boolean;

  setRound: (round: number) => void;
  setPhase: (phase: GamePhase) => void;
  setTopic: (topic: string) => void;
  setMyDrawing: (drawing: string | null) => void;
  setDrawings: (drawings: Drawing[]) => void;
  setVotes: (votes: Vote[]) => void;
  setResults: (results: RoundResult[]) => void;
  setSubmitted: (submitted: boolean) => void;
  setHasVoted: (voted: boolean) => void;
  resetRound: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRound: 0,
  currentPhase: 'topic',
  currentTopic: '',
  myDrawing: null,
  drawings: [],
  votes: [],
  results: [],
  isSubmitted: false,
  hasVoted: false,

  setRound: (currentRound) => set({ currentRound }),
  setPhase: (currentPhase) => set({ currentPhase }),
  setTopic: (currentTopic) => set({ currentTopic }),
  setMyDrawing: (myDrawing) => set({ myDrawing }),
  setDrawings: (drawings) => set({ drawings }),
  setVotes: (votes) => set({ votes }),
  setResults: (results) => set({ results }),
  setSubmitted: (isSubmitted) => set({ isSubmitted }),
  setHasVoted: (hasVoted) => set({ hasVoted }),
  resetRound: () => set({
    myDrawing: null,
    drawings: [],
    votes: [],
    results: [],
    isSubmitted: false,
    hasVoted: false,
  }),
  resetAll: () => set({
    currentRound: 0,
    currentPhase: 'topic',
    currentTopic: '',
    myDrawing: null,
    drawings: [],
    votes: [],
    results: [],
    isSubmitted: false,
    hasVoted: false,
  }),
}));
