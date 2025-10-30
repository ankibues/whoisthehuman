// Game types and interfaces

export type GamePhase = 'lobby' | 'chat' | 'discussion' | 'voting' | 'reveal';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export type GamePace = 'relaxed' | 'normal' | 'fast';

export type GameTheme = 
  | 'space-crew'
  | 'cafe-talk'
  | 'office-party'
  | 'college-dorm'
  | 'mystery-dinner'
  | 'pizza-debate'
  | 'road-trip'
  | 'movie-night'
  | 'gym-buddies'
  | 'gaming-session';

export interface ThemeConfig {
  id: GameTheme;
  name: string;
  description: string;
  icon: string;
  prompts: string[];
}

export interface Participant {
  id: string;
  name: string;
  isHuman: boolean;
  personality?: string; // AI personality description
  bio?: string; // Short backstory
  avatar: string; // emoji or icon
  isEliminated: boolean;
  eliminatedInRound?: number;
}

export interface Message {
  id: string;
  participantId: string;
  participantName: string;
  content: string;
  round: number;
  timestamp: number;
}

export interface Vote {
  voterId: string;
  votedForId: string;
  round: number;
  reasoning?: string; // AI's reasoning for the vote
}

export interface EliminationResult {
  eliminatedId: string;
  round: number;
  votes: Vote[];
  wasHuman: boolean;
  humanAnalysis?: {
    detectionFlags: string[];
    exampleMessages: string[];
    tips: string[];
  };
}

export interface GameState {
  phase: GamePhase;
  difficulty: GameDifficulty;
  pace: GamePace;
  playerName: string;
  theme: GameTheme | null;
  participants: Participant[];
  messages: Message[];
  currentRound: number;
  totalRounds: number;
  votes: Vote[];
  eliminations: EliminationResult[];
  gameOver: boolean;
  humanWon: boolean | null;
  isAIReady: boolean;
  error: string | null;
}

