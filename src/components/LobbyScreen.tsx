import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { themes } from '../data/themes';
import type { GameTheme, GameDifficulty, GamePace } from '../types/game';
import { chromeAI } from '../utils/chromeAI';
import { generatePersonas } from '../utils/aiPersonaGenerator';

export function LobbyScreen() {
  const [name, setName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<GameTheme | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('medium');
  const [selectedPace, setSelectedPace] = useState<GamePace>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    setPlayerName,
    setDifficulty,
    setPace,
    setTheme,
    setPhase,
    setParticipants,
    setCurrentRound,
    setAIReady,
  } = useGameStore();

  const handleStartGame = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedTheme) {
      setError('Please select a theme');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStage(0);

    try {
      // Stage 1: Check availability
      setLoadingStage(1);
      const isAvailable = await chromeAI.isAvailable();
      if (!isAvailable) {
        throw new Error(
          'Chrome AI is not available. Please make sure you are using Chrome Dev/Canary with AI flags enabled.'
        );
      }

      // Stage 2: Initialize AI
      setLoadingStage(2);
      await chromeAI.initLanguageModel();
      setAIReady(true);

      // Stage 3: Generate personas
      setLoadingStage(3);
      const participants = await generatePersonas(selectedTheme, name.trim(), 4);
      
      // Stage 4: Ready!
      setLoadingStage(4);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause to show success

      // Update game state
      setPlayerName(name.trim());
      setDifficulty(selectedDifficulty);
      setPace(selectedPace);
      setTheme(selectedTheme);
      setParticipants(participants);
      setCurrentRound(1);
      setPhase('chat');
    } catch (err) {
      console.error('Error starting game:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start game. Please check your Chrome AI setup.'
      );
    } finally {
      setIsLoading(false);
      setLoadingStage(0);
    }
  };

  const loadingMessages = [
    { icon: '🔍', text: 'Checking Chrome AI availability...' },
    { icon: '🤖', text: 'Initializing AI engine...' },
    { icon: '👥', text: 'Creating AI personas...' },
    { icon: '✨', text: 'Game ready! Starting...' },
  ];

  // Show loading overlay when initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center space-y-6 animate-fade-in">
          <div className="text-6xl animate-bounce mb-4">
            {loadingMessages[loadingStage - 1]?.icon || '⚙️'}
          </div>
          <h2 className="text-2xl font-bold text-white">
            {loadingMessages[loadingStage - 1]?.text || 'Initializing the game...'}
          </h2>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-primary-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(loadingStage / 4) * 100}%` }}
            />
          </div>
          
          {/* Stage indicators */}
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4].map((stage) => (
              <div
                key={stage}
                className={`w-3 h-3 rounded-full transition-all ${
                  stage <= loadingStage ? 'bg-primary-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <p className="text-sm text-gray-400">
            This should only take a few seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold mb-4">
            <span className="gradient-text">Who's Human?</span> 🧠
          </h1>
          <p className="text-xl text-gray-300">
            Can you fool the AIs and blend in?
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Powered by Chrome's Built-in AI (Gemini Nano)
          </p>
        </div>

        {/* Main Card */}
        <div className="card max-w-2xl mx-auto space-y-6 animate-slide-up">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input-field"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              AI Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as GameDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  disabled={isLoading}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    selectedDifficulty === diff
                      ? 'border-primary-500 bg-primary-500 bg-opacity-20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="font-semibold text-white capitalize">{diff}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {selectedDifficulty === 'easy' && '🟢 AIs make random guesses (50% chance)'}
              {selectedDifficulty === 'medium' && '🟡 AIs detect patterns (75% accuracy)'}
              {selectedDifficulty === 'hard' && '🔴 AIs are BRUTAL - They WILL find you!'}
            </p>
          </div>

          {/* Game Pace Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Game Pace
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['relaxed', 'normal', 'fast'] as GamePace[]).map((pace) => (
                <button
                  key={pace}
                  onClick={() => setSelectedPace(pace)}
                  disabled={isLoading}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    selectedPace === pace
                      ? 'border-primary-500 bg-primary-500 bg-opacity-20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="font-semibold text-white capitalize">{pace}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {selectedPace === 'relaxed' && '🐢 Slow pace - AIs respond every 8-12 seconds'}
              {selectedPace === 'normal' && '⚡ Normal pace - AIs respond every 5-8 seconds'}
              {selectedPace === 'fast' && '🚀 Fast pace - AIs respond every 2-4 seconds'}
            </p>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose a Theme
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  disabled={isLoading}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedTheme === theme.id
                      ? 'border-primary-500 bg-primary-500 bg-opacity-20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{theme.icon}</span>
                    <span className="font-semibold text-white">{theme.name}</span>
                  </div>
                  <p className="text-sm text-gray-400">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* How to Play */}
          <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold text-white mb-2">📖 How to Play</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• You're the human among 4 AI players (5 total)</li>
              <li>• Chat naturally - try to blend in!</li>
              <li>• After each round, everyone votes for who they think is human</li>
              <li>• If AIs eliminate you → You LOSE 😔</li>
              <li>• Survive 3 rounds without being eliminated → You WIN! 🎉</li>
            </ul>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartGame}
            disabled={isLoading || !name.trim() || !selectedTheme}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                Initializing the game...
              </span>
            ) : (
              'Start Game'
            )}
          </button>

          {/* Chrome AI Notice */}
          <div className="text-center text-xs text-gray-500">
            <p>
              ⚠️ Requires Chrome Dev/Canary with AI flags enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

