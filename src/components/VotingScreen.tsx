import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateAIVotes, determineElimination, generateHumanAnalysis } from '../utils/aiVoting';
import { gameAudio } from '../utils/audio';
import type { Vote } from '../types/game';

export function VotingScreen() {
  const {
    difficulty,
    participants,
    messages,
    currentRound,
    totalRounds,
    addVote,
    clearRoundVotes,
    eliminatePlayer,
    setCurrentRound,
    setPhase,
    setGameOver,
  } = useGameStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [eliminatedName, setEliminatedName] = useState<string>('');
  const [isTie, setIsTie] = useState(false);
  const [roundVotesData, setRoundVotesData] = useState<Vote[]>([]);
  const [aiVotesReady, setAiVotesReady] = useState(false);

  const humanParticipant = participants.find((p) => p.isHuman);
  const activeParticipants = participants.filter((p) => !p.isEliminated);

  // Auto-generate AI votes when component mounts
  useEffect(() => {
    const hasGeneratedRef = { current: false };
    
    const init = async () => {
      if (!hasGeneratedRef.current && activeParticipants.length > 0) {
        hasGeneratedRef.current = true;
        console.log('🎯 Voting screen mounted - starting vote generation');
        gameAudio.playVotingMusic(); // Start voting music
        await generateAIVotesAutomatically();
      } else {
        console.log('⚠️ Skipping vote generation (already generated or no participants)');
      }
    };
    
    init();
    
    return () => {
      console.log('🧹 Voting screen unmounting');
      gameAudio.stopMusic(); // Stop music when leaving
    };
  }, []); // Keep empty to run once on mount

  const generateAIVotesAutomatically = async () => {
    const aiParticipants = activeParticipants.filter((p) => !p.isHuman);
    
    console.log('=== VOTE GENERATION START ===');
    console.log('Generating votes for', aiParticipants.length, 'AI participants');
    console.log('AI participants:', aiParticipants.map(p => p.name));
    console.log('Active participants:', activeParticipants.map(p => p.name));
    console.log('Current round:', currentRound);
    
    try {
      const aiVotes = await generateAIVotes(
        aiParticipants,
        activeParticipants, // Pass ALL active participants (including human) so AIs can vote for anyone
        messages,
        currentRound,
        difficulty
      );
      
      console.log('Generated', aiVotes.length, 'AI votes');
      console.log('AI votes:', aiVotes.map(v => `${participants.find(p => p.id === v.voterId)?.name} → ${participants.find(p => p.id === v.votedForId)?.name}`));
      
      // Add AI votes to store one by one
      for (const vote of aiVotes) {
        console.log('Adding vote to store:', {
          voter: participants.find(p => p.id === vote.voterId)?.name,
          votedFor: participants.find(p => p.id === vote.votedForId)?.name,
          round: vote.round
        });
        addVote(vote);
      }
      
      // Verify votes were added
      const store = useGameStore.getState();
      const allVotes = store.votes;
      console.log('Total votes in store after adding:', allVotes.length);
      console.log('Votes for this round:', allVotes.filter(v => v.round === currentRound).length);
      console.log('=== VOTE GENERATION END ===');
      
      // Mark AI votes as ready
      setAiVotesReady(true);
      console.log('AI votes are now ready!');
    } catch (error) {
      console.error('Error generating AI votes:', error);
      // Even on error, mark as ready so human can still vote
      setAiVotesReady(true);
    }
  };

  const handlePlayerVote = async () => {
    if (!selectedId || !humanParticipant || isProcessing || !aiVotesReady) {
      console.log('Cannot vote yet:', { selectedId, hasHuman: !!humanParticipant, isProcessing, aiVotesReady });
      return;
    }

    setIsProcessing(true);
    console.log('=== HUMAN VOTING ===');
    console.log('Human voting for:', participants.find(p => p.id === selectedId)?.name);

    // Add player's vote
    const playerVote: Vote = {
      voterId: humanParticipant.id,
      votedForId: selectedId,
      round: currentRound,
    };
    addVote(playerVote);
    console.log('Human vote added to store');
    gameAudio.playVoteCast(); // Play vote sound

    // Small delay to show player voted
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Stop music and play reveal sound
    gameAudio.stopMusic();
    gameAudio.playRevealSound();
    
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Process elimination
    console.log('=== PROCESSING ELIMINATION ===');
    processElimination();
  };

  const processElimination = () => {
    // Get all votes for this round (from store)
    const store = useGameStore.getState();
    const roundVotes = store.votes.filter((v) => v.round === currentRound);
    console.log('=== PROCESSING ELIMINATION ===');
    console.log('Current round:', currentRound, '/', totalRounds);
    console.log('Processing elimination with', roundVotes.length, 'total votes');
    console.log('Round votes:', roundVotes);
    setRoundVotesData(roundVotes);

    // Determine who gets eliminated
    const eliminatedId = determineElimination(roundVotes, activeParticipants);

    if (!eliminatedId) {
      // Tie - no elimination
      console.log('TIE - no elimination');
      setIsTie(true);
      setShowResult(true);
      // User will click button to proceed
      return;
    }

    const eliminatedPlayer = participants.find((p) => p.id === eliminatedId);
    if (!eliminatedPlayer) {
      console.error('Could not find eliminated player!');
      return;
    }

    console.log('ELIMINATED:', eliminatedPlayer.name, '(Human:', eliminatedPlayer.isHuman, ')');
    setEliminatedName(eliminatedPlayer.name);
    setShowResult(true);

    // Generate analysis if human was eliminated
    const humanAnalysis = eliminatedPlayer.isHuman 
      ? generateHumanAnalysis(eliminatedPlayer, messages, currentRound)
      : undefined;

    // Record elimination
    eliminatePlayer({
      eliminatedId,
      round: currentRound,
      votes: roundVotes,
      wasHuman: eliminatedPlayer.isHuman,
      humanAnalysis,
    });

    // Check if human was eliminated (for sound effect)
    if (eliminatedPlayer.isHuman) {
      console.log('GAME OVER - Human was eliminated!');
      gameAudio.playEliminationSound();
    } else if (currentRound >= totalRounds) {
      console.log('GAME COMPLETE - HUMAN WINS! Survived all', totalRounds, 'rounds!');
      gameAudio.playWinSound();
    }
    // User will click button to proceed
  };

  // Handle advancing to next round or ending game
  const handleProceedToNextRound = () => {
    const eliminatedPlayer = participants.find((p) => p.name === eliminatedName);
    
    if (isTie) {
      // Tie - continue to next round
      clearRoundVotes();
      if (currentRound < totalRounds) {
        console.log('Advancing from tie to round', currentRound + 1);
        // Reset local state for next round
        setSelectedId(null);
        setIsProcessing(false);
        setShowResult(false);
        setEliminatedName('');
        setIsTie(false);
        setRoundVotesData([]);
        setAiVotesReady(false);
        
        setCurrentRound(currentRound + 1);
        setPhase('chat');
      } else {
        console.log('All rounds complete after tie - HUMAN WINS!');
        setGameOver(true);
      }
    } else if (eliminatedPlayer?.isHuman) {
      // Human eliminated - Game Over
      setTimeout(() => setGameOver(false), 500);
    } else {
      // AI eliminated - check if game continues
      if (currentRound >= totalRounds) {
        // Survived all rounds - WIN!
        setTimeout(() => setGameOver(true), 500);
      } else {
        // Continue to next round
        console.log('Advancing to next round:', currentRound + 1);
        clearRoundVotes();
        
        // Reset local state for next round
        setSelectedId(null);
        setIsProcessing(false);
        setShowResult(false);
        setEliminatedName('');
        setIsTie(false);
        setRoundVotesData([]);
        setAiVotesReady(false);
        
        setCurrentRound(currentRound + 1);
        setPhase('chat');
      }
    }
  };

  if (showResult) {
    // Count votes for each participant
    const voteCounts = new Map<string, number>();
    activeParticipants.forEach((p) => {
      voteCounts.set(p.id, roundVotesData.filter((v) => v.votedForId === p.id).length);
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8">
          {/* Result Banner */}
          <div className="card text-center animate-fade-in mb-8">
            {isTie ? (
              <>
                <div className="text-6xl mb-4">🤝</div>
                <h2 className="text-3xl font-bold text-yellow-400 mb-4">It's a Tie!</h2>
                <p className="text-gray-300 text-lg">
                  No one gets eliminated this round.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">
                  {eliminatedName === humanParticipant?.name ? '💀' : '🤖'}
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  {eliminatedName} has been eliminated!
                </h2>
                {eliminatedName === humanParticipant?.name ? (
                  <p className="text-red-400 text-lg font-semibold">
                    Game Over! You were detected! 😔
                  </p>
                ) : (
                  <p className="text-green-400 text-lg">
                    {currentRound < totalRounds
                      ? `You survived Round ${currentRound}!`
                      : 'You survived all rounds! You win! 🎉'}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Voting Results */}
          <div className="card animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4 text-center">📊 Voting Results</h3>
            
            {/* Vote Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {activeParticipants.map((participant) => {
                const voteCount = voteCounts.get(participant.id) || 0;
                const percentage = activeParticipants.length > 0 
                  ? (voteCount / activeParticipants.length) * 100 
                  : 0;
                const wasEliminated = participant.name === eliminatedName;

                return (
                  <div
                    key={participant.id}
                    className={`p-4 rounded-lg border-2 ${
                      wasEliminated
                        ? 'bg-red-900 bg-opacity-30 border-red-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{participant.avatar}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {participant.name}
                          {participant.isHuman && ' (You)'}
                        </div>
                        <div className="text-2xl font-bold text-primary-400">
                          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                        </div>
                      </div>
                      {wasEliminated && <span className="text-2xl">❌</span>}
                    </div>
                    {/* Vote Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          wasEliminated ? 'bg-red-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Voting Breakdown */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-lg font-semibold text-white mb-3">Who Voted For Whom:</h4>
              <div className="space-y-2">
                {roundVotesData.map((vote, index) => {
                  const voter = participants.find((p) => p.id === vote.voterId);
                  const votedFor = participants.find((p) => p.id === vote.votedForId);
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-800 bg-opacity-50 rounded-lg"
                    >
                      <span className="text-xl">{voter?.avatar}</span>
                      <span className="text-gray-300">{voter?.name}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-xl">{votedFor?.avatar}</span>
                      <span className="text-white font-semibold">{votedFor?.name}</span>
                      {vote.reasoning && (
                        <span className="ml-auto text-xs text-gray-500 italic max-w-xs truncate">
                          "{vote.reasoning}"
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Move to Next Round Button */}
          <div className="mt-8 text-center animate-fade-in">
            <button
              onClick={handleProceedToNextRound}
              className="btn-primary px-8 py-4 text-lg"
            >
              {eliminatedName === humanParticipant?.name ? (
                '📊 View Final Results'
              ) : currentRound >= totalRounds ? (
                '🎉 Celebrate Victory!'
              ) : isTie ? (
                `➡️ Continue to Round ${currentRound + 1}`
              ) : (
                `➡️ Move to Round ${currentRound + 1}`
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Voting Time!</span>
          </h2>
          <p className="text-gray-300">
            Everyone votes for who they think is human
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Round {currentRound} of {totalRounds}
          </p>
        </div>

        {/* Voting Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {activeParticipants
            .filter((p) => p.id !== humanParticipant?.id) // Don't let human vote for themselves
            .map((participant) => (
              <button
                key={participant.id}
                onClick={() => !isProcessing && setSelectedId(participant.id)}
                disabled={isProcessing}
                className={`card-hover text-left transition-all duration-200 ${
                  selectedId === participant.id
                    ? 'border-primary-500 bg-primary-500 bg-opacity-20 scale-105'
                    : ''
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {/* Participant Header */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-700">
                  <span className="text-3xl">{participant.avatar}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-lg">
                      {participant.name}
                    </div>
                    {participant.bio && (
                      <div className="text-xs text-gray-400 mt-1">
                        {participant.bio}
                      </div>
                    )}
                  </div>
                  {selectedId === participant.id && (
                    <span className="text-2xl">✓</span>
                  )}
                </div>

                {/* Recent Messages */}
                <div className="space-y-2">
                  {messages
                    .filter((m) => m.participantId === participant.id && m.round === currentRound)
                    .slice(0, 2)
                    .map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <div className="text-gray-300 line-clamp-2">
                          "{msg.content}"
                        </div>
                      </div>
                    ))}
                </div>
              </button>
            ))}
        </div>

        {/* Vote Button */}
        <div className="card text-center max-w-md mx-auto">
          {selectedId ? (
            <>
              <p className="text-gray-300 mb-4">
                You're voting for:{' '}
                <span className="text-white font-semibold">
                  {participants.find((p) => p.id === selectedId)?.name}
                </span>
              </p>
              <button
                onClick={handlePlayerVote}
                disabled={!selectedId || isProcessing || !aiVotesReady}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!aiVotesReady ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    AI agents voting...
                  </span>
                ) : isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Counting votes...
                  </span>
                ) : (
                  'Cast Vote'
                )}
              </button>
            </>
          ) : (
            <p className="text-gray-400">
              Select a player to vote for
            </p>
          )}
        </div>

        {/* Hint */}
        <div className="mt-6 card max-w-2xl mx-auto bg-gray-900 bg-opacity-50">
          <p className="text-sm text-gray-400 text-center">
            💡 Tip: The AIs are analyzing the conversation to find the human. Try to blend in!
          </p>
        </div>
      </div>
    </div>
  );
}
