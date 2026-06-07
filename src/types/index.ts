export type RoomStatus = 'lobby' | 'playing' | 'finished';
export type GamePhase = 'topic' | 'draw' | 'vote' | 'result';
export type TopicMode = 'random' | 'custom';
export type PlayerRole = 'drawer' | 'judge';
export type SubscriptionType = 'none' | 'daily' | 'monthly';

export interface User {
  uid: string;
  displayName: string;
  photoURL: string | null;
  premiumUntil: Date | null;
  subscriptionType: SubscriptionType;
  totalGames: number;
  totalWins: number;
  createdAt: Date;
}

export interface RoomSettings {
  drawTime: 10 | 20 | 30;
  roundCount: 3 | 5 | 10;
  topicMode: TopicMode;
}

export interface Room {
  id: string;
  code: string;
  hostUid: string;
  isPremium: boolean;
  status: RoomStatus;
  settings: RoomSettings;
  currentRound: number;
  currentPhase: GamePhase;
  currentTopic: string;
  topicWriterUid: string | null;
  phaseEndsAt: Date | null;
  createdAt: Date;
}

export interface Player {
  uid: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  role: PlayerRole;
  joinedAt: Date;
  isHost: boolean;
  isConnected: boolean;
}

export interface Drawing {
  uid: string;
  imageUrl: string;
  submittedAt: Date;
}

export interface Vote {
  voterUid: string;
  targetUid: string;
  votedAt: Date;
}

export interface RoundResult {
  uid: string;
  displayName: string;
  imageUrl: string;
  votes: number;
  rank: number;
}
