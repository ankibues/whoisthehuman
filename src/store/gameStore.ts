import { create } from 'zustand';
import type { GameState, GamePhase, GameTheme, GameDifficulty, GamePace, Participant, Message, Vote, EliminationResult } from '../types/game';

interface GameStore extends GameState {
  // Actions
  setPlayerName: (name: string) => void;
  setDifficulty: (difficulty: GameDifficulty) => void;
  setPace: (pace: GamePace) => void;
  setTheme: (theme: GameTheme) => void;
  setPhase: (phase: GamePhase) => void;
  setParticipants: (participants: Participant[]) => void;
  addMessage: (message: Message) => void;
  setCurrentRound: (round: number) => void;
  addVote: (vote: Vote) => void;
  clearRoundVotes: () => void;
  eliminatePlayer: (elimination: EliminationResult) => void;
  setGameOver: (won: boolean) => void;
  setAIReady: (ready: boolean) => void;
  setError: (error: string | null) => void;
  resetGame: () => void;
}

const initialState: GameState = {
  phase: 'lobby',
  difficulty: 'medium',
  pace: 'normal',
  playerName: '',
  theme: null,
  participants: [],
  messages: [],
  currentRound: 0,
  totalRounds: 3,
  votes: [],
  eliminations: [],
  gameOver: false,
  humanWon: null,
  isAIReady: false,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setPlayerName: (name) => set({ playerName: name }),
  
  setDifficulty: (difficulty) => set({ difficulty }),
  
  setPace: (pace) => set({ pace }),
  
  setTheme: (theme) => set({ theme }),
  
  setPhase: (phase) => set({ phase }),
  
  setParticipants: (participants) => set({ participants }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setCurrentRound: (round) => set({ currentRound: round }),
  
  addVote: (vote) => set((state) => ({ 
    votes: [...state.votes, vote] 
  })),
  
  clearRoundVotes: () => set({ votes: [] }),
  
  eliminatePlayer: (elimination) => set((state) => ({
    eliminations: [...state.eliminations, elimination],
    participants: state.participants.map((p) =>
      p.id === elimination.eliminatedId
        ? { ...p, isEliminated: true, eliminatedInRound: elimination.round }
        : p
    ),
  })),
  
  setGameOver: (won) => set({ gameOver: true, humanWon: won, phase: 'reveal' }),
  
  setAIReady: (ready) => set({ isAIReady: ready }),
  
  setError: (error) => set({ error }),
  
  resetGame: () => set(initialState),
}));

