import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Message } from '../types/game';

interface SuspicionMessage {
  participantId: string;
  participantName: string;
  suspectId: string;
  suspectName: string;
  reasoning: string;
}

export function DiscussionScreen() {
  const {
    participants,
    messages,
    currentRound,
    totalRounds,
    difficulty,
    addMessage,
    setPhase,
  } = useGameStore();

  const [suspicions, setSuspicions] = useState<SuspicionMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [humanSuspectId, setHumanSuspectId] = useState<string | null>(null);
  const [humanReasoning, setHumanReasoning] = useState('');
  const [humanSubmitted, setHumanSubmitted] = useState(false);
  const [humanSkipped, setHumanSkipped] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // Will be set based on difficulty
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const humanParticipant = participants.find((p) => p.isHuman);
  const activeParticipants = participants.filter((p) => !p.isEliminated);
  const activeAIs = activeParticipants.filter((p) => !p.isHuman);
  const otherParticipants = activeParticipants.filter((p) => p.id !== humanParticipant?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [suspicions]);

  // Initialize timer based on difficulty
  useEffect(() => {
    const timeLimit = difficulty === 'hard' ? 90 : 120; // 90s for hard, 120s for easy/medium
    setTimeRemaining(timeLimit);
  }, [difficulty]);

  // Timer for human to submit
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto skip
          if (!humanSubmitted && !humanSkipped) {
            handleSkip();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [humanSubmitted, humanSkipped]);

  // Generate AI suspicions after human submits or skips
  useEffect(() => {
    if ((humanSubmitted || humanSkipped) && !isGenerating && !allComplete) {
      console.log('Triggering AI suspicions generation...');
      generateAISuspicions();
    }
  }, [humanSubmitted, humanSkipped, isGenerating, allComplete]);

  const handleHumanSubmit = () => {
    if (!humanSuspectId || !humanReasoning.trim() || !humanParticipant) return;

    const suspect = activeParticipants.find((p) => p.id === humanSuspectId);
    if (!suspect) return;

    console.log('=== HUMAN SUSPICION SUBMITTED ===');
    console.log('Human suspects:', suspect.name);
    console.log('Reasoning:', humanReasoning.trim());

    // Add human suspicion
    const humanSuspicion: SuspicionMessage = {
      participantId: humanParticipant.id,
      participantName: humanParticipant.name,
      suspectId: humanSuspectId,
      suspectName: suspect.name,
      reasoning: humanReasoning.trim(),
    };

    setSuspicions([humanSuspicion]);
    console.log('Set suspicions to:', [humanSuspicion]);
    
    // Store as discussion message for voting analysis
    const discussionMsg: Message = {
      id: `discussion-${Date.now()}-human`,
      participantId: humanParticipant.id,
      participantName: humanParticipant.name,
      content: `I suspect ${suspect.name}. ${humanReasoning.trim()}`,
      round: currentRound,
      timestamp: Date.now(),
    };
    addMessage(discussionMsg);
    
    setHumanSubmitted(true);
    console.log('Set humanSubmitted to true');
  };

  const handleSkip = () => {
    // Skip without submitting - AIs will find this very suspicious!
    setHumanSkipped(true);
  };

  const generateAISuspicions = async () => {
    console.log('=== AI SUSPICIONS GENERATION START ===');
    console.log('Active AIs:', activeAIs.map(ai => ai.name));
    
    setIsGenerating(true);

    // Shuffle AIs to randomize speaking order
    const shuffledAIs = [...activeAIs].sort(() => Math.random() - 0.5);

    if (shuffledAIs.length === 0) {
      console.log('No active AIs to generate suspicions');
      setIsGenerating(false);
      setAllComplete(true);
      return;
    }

    try {
      console.log('🚀 Generating all AI suspicions in PARALLEL...');
      const startTime = Date.now();
      
      // Generate all suspicions in parallel - based on actual message analysis!
      const suspicionPromises = shuffledAIs.map(async (ai) => {
        try {
          // Analyze all suspects based on their messages
          const suspects = activeParticipants.filter((p) => p.id !== ai.id);
          
          // Score each suspect based on human-like patterns
          const suspectScores = suspects.map((suspect) => {
            const suspectMessages = messages.filter(
              (m) => m.participantId === suspect.id && m.round === currentRound
            );
            
            let score = 0;
            const detectedFlags: string[] = [];
            
            // No participation = very suspicious
            if (suspectMessages.length === 0) {
              score += 20;
              detectedFlags.push('no messages');
            } else if (suspectMessages.length === 1) {
              score += 10;
              detectedFlags.push('only 1 message');
            }
            
            // Analyze messages for human patterns
            for (const msg of suspectMessages) {
              const text = msg.content.toLowerCase();
              const wordCount = msg.content.split(/\s+/).length;
              
              // Short messages (AI writes 20-30 words)
              if (wordCount < 18) {
                score += 8;
                detectedFlags.push(`${wordCount} words`);
              }
              
              // Informal language (strong indicator)
              const informalMatch = text.match(/\b(ur|u|idk|tbh|lol|omg|gonna|wanna|yeah|nah)\b/);
              if (informalMatch) {
                score += 10;
                detectedFlags.push(`used "${informalMatch[0]}"`);
              }
              
              // Grammar issues
              if (!/[.!?]$/.test(msg.content)) {
                score += 8;
                detectedFlags.push('no end punctuation');
              }
              if (/^[a-z]/.test(msg.content)) {
                score += 8;
                detectedFlags.push('lowercase start');
              }
              
              // Repeated letters (human typo pattern)
              if (/(.)\1{2,}/.test(msg.content)) {
                score += 7;
                detectedFlags.push('repeated letters');
              }
              
              // Ellipsis usage
              if (/\.{2,}/.test(msg.content)) {
                score += 6;
                detectedFlags.push('uses ...');
              }
              
              // Just agreeing/rephrasing (human pattern)
              const isJustAgreeing = text.match(/^(yeah|yep|yea|true|exactly|agreed|same|i agree|that's true|good point|makes sense)/i) && wordCount < 12;
              if (isJustAgreeing) {
                score += 9;
                detectedFlags.push('just agreeing');
              }
              
              // Check similarity to previous messages (rephrasing)
              const previousTexts = messages
                .filter((m) => m.participantId !== suspect.id && m.round === currentRound && m.timestamp < msg.timestamp)
                .map((m) => m.content.toLowerCase());
              
              const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
              for (const prevText of previousTexts) {
                const prevWords = prevText.split(/\s+/).filter(w => w.length > 3);
                const commonWords = words.filter(w => prevWords.includes(w));
                const similarity = commonWords.length / Math.max(words.length, 1);
                
                if (similarity > 0.6 && words.length > 5) {
                  score += 8;
                  detectedFlags.push('rephrasing others');
                  break;
                }
              }
              
              // AI indicators (reduce score) - proper length & grammar
              if (wordCount >= 20 && wordCount <= 35) score -= 5;
              if (text.match(/\b(furthermore|moreover|however|therefore)\b/)) {
                score -= 5;
              }
            }
            
            return { suspect, score, detectedFlags };
          });
          
          // Pick the highest scoring suspect
          suspectScores.sort((a, b) => b.score - a.score);
          const { suspect, score, detectedFlags } = suspectScores[0];
          
          // Generate SPECIFIC reasoning based on actual detected patterns
          let reasoning = '';
          if (detectedFlags.length > 0) {
            // Build specific reasoning from detected flags
            const topFlags = detectedFlags.slice(0, 2); // Use top 2 most notable
            reasoning = `${suspect.name}: ${topFlags.join(', ')}`;
          } else if (score > 5) {
            reasoning = `${suspect.name} shows subtle patterns worth noting`;
          } else {
            reasoning = `${suspect.name}'s style is consistent but something feels slightly off`;
          }

          const suspicion: SuspicionMessage = {
            participantId: ai.id,
            participantName: ai.name,
            suspectId: suspect.id,
            suspectName: suspect.name,
            reasoning,
          };

          // Store as discussion message for voting analysis
          const discussionMsg: Message = {
            id: `discussion-${Date.now()}-${ai.id}-${Math.random()}`,
            participantId: ai.id,
            participantName: ai.name,
            content: `I suspect ${suspect.name}. ${reasoning}`,
            round: currentRound,
            timestamp: Date.now(),
          };
          addMessage(discussionMsg);

          return suspicion;
        } catch (error) {
          console.error(`Error generating suspicion for ${ai.name}:`, error);
          return null;
        }
      });

      // Wait for all to complete in parallel
      const results = await Promise.all(suspicionPromises);
      const duration = Date.now() - startTime;
      console.log(`✅ All ${results.length} suspicions generated in ${duration}ms!`);
      
      const validSuspicions = results.filter((s) => s !== null) as SuspicionMessage[];
      
      // Add all at once (much faster than one-by-one)
      setSuspicions((prev) => [...prev, ...validSuspicions]);
      console.log('Added', validSuspicions.length, 'suspicions at once');

      setIsGenerating(false);
      setAllComplete(true);

      console.log('=== AI SUSPICIONS COMPLETE - Ready to move to voting ===');
    } catch (error) {
      console.error('Fatal error in generateAISuspicions:', error);
      // Mark as complete even on error so user can proceed
      setIsGenerating(false);
      setAllComplete(true);
    }
  };

  const handleProceedToVoting = () => {
    console.log('User clicked to proceed to voting');
    setPhase('voting');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Suspicion Time!</span>
          </h2>
          <p className="text-gray-300">
            Share who you think is human and why
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Round {currentRound} of {totalRounds}
          </p>
        </div>

        {/* Conversation History */}
        <div className="card mb-6 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 sticky top-0 bg-gray-800 py-2">
            📜 Chat History (Round {currentRound})
          </h3>
          <div className="space-y-2">
            {messages
              .filter((m) => m.round === currentRound)
              .map((msg) => {
                const participant = participants.find((p) => p.id === msg.participantId);
                return (
                  <div key={msg.id} className="flex gap-2 text-sm">
                    <span className="text-lg">{participant?.avatar}</span>
                    <div>
                      <span className="font-semibold text-white">{msg.participantName}:</span>
                      <span className="text-gray-300 ml-2">{msg.content}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Human Input (if not submitted) */}
        {!humanSubmitted && !humanSkipped && humanParticipant && (
          <div className="card mb-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                🧠 Your Turn - Share Your Suspicion
              </h3>
              <div className={`text-sm font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                ⏱️ {timeRemaining}s
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              💡 Tip: You can create false suspicions to mislead the AIs and protect yourself!
            </p>
            {timeRemaining <= 10 && (
              <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm font-semibold">
                  ⚠️ Warning: Not participating in discussion makes you look VERY suspicious!
                </p>
              </div>
            )}
            
            {/* Suspect Selection */}
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Who do you suspect?
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {otherParticipants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setHumanSuspectId(p.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    humanSuspectId === p.id
                      ? 'border-primary-500 bg-primary-500 bg-opacity-20'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="text-white font-semibold">{p.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Reasoning */}
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Why do you suspect them?
            </label>
            <textarea
              value={humanReasoning}
              onChange={(e) => setHumanReasoning(e.target.value)}
              placeholder="Explain your reasoning... Be convincing or create a false trail!"
              className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm mb-3"
              rows={3}
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <span className="text-xs text-gray-500">{humanReasoning.length}/200</span>
                <button
                  onClick={handleSkip}
                  className="text-xs text-gray-400 hover:text-white transition-colors underline"
                >
                  Skip (risky!)
                </button>
              </div>
              <button
                onClick={handleHumanSubmit}
                disabled={!humanSuspectId || !humanReasoning.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Share Suspicion
              </button>
            </div>
          </div>
        )}

        {/* Show warning if human skipped */}
        {humanSkipped && !isGenerating && (
          <div className="card mb-6 bg-red-900 bg-opacity-30 border-red-500 animate-fade-in">
            <div className="text-center">
              <div className="text-4xl mb-2">😶</div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                You remained silent...
              </h3>
              <p className="text-sm text-gray-300">
                The AIs will find your silence extremely suspicious!
              </p>
            </div>
          </div>
        )}

        {/* Suspicions List */}
        <div className="flex-1 space-y-4 mb-8">
          {suspicions.length > 0 && (
            <div className="text-sm text-gray-400 mb-2">
              Showing {suspicions.length} suspicion{suspicions.length !== 1 ? 's' : ''}
            </div>
          )}
          
          {/* Show loading indicator while AI is generating */}
          {isGenerating && (
            <div className="card text-center animate-fade-in">
              <div className="text-4xl mb-3 animate-bounce">🤖</div>
              <p className="text-gray-300">AI agents are analyzing the conversation...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          )}
          
          {suspicions.map((suspicion, index) => {
            const speaker = participants.find((p) => p.id === suspicion.participantId);
            const suspect = participants.find((p) => p.id === suspicion.suspectId);
            const isHuman = speaker?.isHuman;

            return (
              <div
                key={index}
                className={`card animate-fade-in ${isHuman ? 'border-2 border-primary-500' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Speaker */}
                  <div className="flex-shrink-0">
                    <div className="text-4xl mb-1">{speaker?.avatar}</div>
                    <div className="text-xs text-gray-400 text-center">
                      {speaker?.name}
                      {isHuman && <div className="text-primary-400">(You)</div>}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-400">suspects</span>
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-900 bg-opacity-30 border border-red-500 rounded-full">
                        <span className="text-2xl">{suspect?.avatar}</span>
                        <span className="text-white font-semibold">{suspect?.name}</span>
                        {suspect?.isHuman && (
                          <span className="text-xs text-gray-400">(You)</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300 italic">"{suspicion.reasoning}"</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer - Proceed Button */}
        {allComplete && (
          <div className="card bg-green-900 bg-opacity-30 border-green-500 text-center animate-fade-in">
            <p className="text-white font-medium mb-4">
              All suspicions shared! Read through them carefully.
            </p>
            <button
              onClick={handleProceedToVoting}
              className="btn-primary"
            >
              Proceed to Voting →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
