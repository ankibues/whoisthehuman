import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getThemeById } from '../data/themes';
import { generateAIResponse } from '../utils/aiPersonaGenerator';
import { gameAudio } from '../utils/audio';
import type { Message } from '../types/game';

export function ChatScreen() {
  const {
    theme,
    difficulty,
    pace,
    participants,
    messages,
    currentRound,
    totalRounds,
    addMessage,
    setPhase,
  } = useGameStore();

  const [currentPrompt, setCurrentPrompt] = useState('');
  const [playerResponse, setPlayerResponse] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [humanMessageCount, setHumanMessageCount] = useState(0);
  const [roundActive, setRoundActive] = useState(true);
  const [roundStarted, setRoundStarted] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  
  // Store the actual prompt in a ref to avoid state timing issues
  const currentPromptRef = useRef<string>('');
  // Track which AI is currently sending to prevent duplicates
  const aiCurrentlySending = useRef<Set<string>>(new Set());
  // Use refs for AI tracking to avoid closure issues
  const aiMessageCounts = useRef<Map<string, number>>(new Map());
  const lastMessageIndex = useRef<Map<string, number>>(new Map());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const themeConfig = theme ? getThemeById(theme) : null;
  const humanParticipant = participants.find((p) => p.isHuman);
  const activeParticipants = participants.filter((p) => !p.isEliminated);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start new round
  useEffect(() => {
    console.log('🔵 ChatScreen useEffect triggered - Round:', currentRound);
    
    if (themeConfig && currentRound > 0 && currentRound <= totalRounds) {
      console.log('✅ Starting Round', currentRound, 'setup...');
      
      // Reset state
      setPlayerResponse('');
      setShowTyping(false);
      setHumanMessageCount(0);
      lastMessageIndex.current = new Map();
      aiCurrentlySending.current.clear(); // Clear sending locks for new round
      
      const prompts = themeConfig.prompts;
      const roundPrompt = prompts[(currentRound - 1) % prompts.length];
      setCurrentPrompt(roundPrompt);
      currentPromptRef.current = roundPrompt; // Store in ref immediately
      
      // Set timer based on difficulty: 90 seconds for hard, 150 seconds for easy/medium
      const timeLimit = difficulty === 'hard' ? 90 : 150;
      setTimeRemaining(timeLimit);
      setTimerActive(true);
      setRoundActive(true);
      setRoundStarted(true); // Mark that round has actually started
      
      // Initialize AI message counts - get fresh list of active AIs
      const currentActiveAIs = participants.filter((p) => !p.isEliminated && !p.isHuman);
      const counts = new Map<string, number>();
      currentActiveAIs.forEach((ai) => {
        counts.set(ai.id, 0);
      });
      aiMessageCounts.current = counts;
      console.log('🔄 Round', currentRound, '- Initialized AI message counts for:', currentActiveAIs.map(ai => ai.name));
      console.log('📊 Counts:', Array.from(counts.entries()));
      
      // Clear any existing timers before starting new ones
      if (messageTimerRef.current) {
        console.log('🧹 Clearing old timer before starting new round');
        clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
      
      // Start the timed message system - first AI message after 3 seconds
      console.log('🚀 Starting timed messages for Round', currentRound);
      startTimedMessages();
    }

    // Cleanup function - but don't clear if we just started this round!
    return () => {
      console.log('🧹 Cleanup function called for Round', currentRound);
      // Don't clear the timer we just set - only clear when truly unmounting
    };
  }, [currentRound, themeConfig, totalRounds, difficulty, participants]);

  // Countdown timer
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Only end round if it has actually started and time is up
      if (timeRemaining <= 0 && roundActive && roundStarted) {
        // Time's up - end round
        endRound();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timeRemaining]);

  // Timed message system - each AI waits for 2 other players before responding again
  const startTimedMessages = () => {
    console.log('📱 startTimedMessages() called for Round', currentRound);
    console.log('   roundActive:', roundActive);
    
    const scheduleNextMessage = () => {
      console.log('⏱️  scheduleNextMessage() called');
      console.log('   roundActive:', roundActive);
      console.log('   currentRound:', currentRound);
      
      if (!roundActive) {
        console.log('❌ Round not active, stopping schedule');
        return;
      }

      // Get fresh data from store - use refs for counts to avoid closure issues
      const store = useGameStore.getState();
      const currentActiveAIs = store.participants.filter((p) => !p.isEliminated && !p.isHuman);
      const roundMessages = store.messages.filter((m) => m.round === currentRound);
      
      console.log('   Current active AIs:', currentActiveAIs.map(ai => ai.name));
      console.log('   Round messages count:', roundMessages.length);
      
      if (currentActiveAIs.length === 0) {
        console.log('❌ No active AIs found');
        return;
      }

      // Check if any AI still has messages to send
      const maxMessages = difficulty === 'hard' ? 4 : 3;
      
      // Find AIs that can send a message (have had 2+ responses since their last message OR haven't sent yet)
      const eligibleAIs = currentActiveAIs.filter((ai) => {
        const messageCount = aiMessageCounts.current.get(ai.id) || 0;
        
        // Can't send more than max messages
        if (messageCount >= maxMessages) return false;
        
        // If this AI hasn't sent a message yet, they're eligible
        if (messageCount === 0) return true;
        
        // Check how many OTHER players have sent messages since this AI's last message
        const lastIndex = lastMessageIndex.current.get(ai.id) || 0;
        const messagesSince = roundMessages.filter((msg, idx) => 
          idx > lastIndex && msg.participantId !== ai.id
        ).length;
        
        const isEligible = messagesSince >= 2;
        console.log(`${ai.name}: ${messagesSince} responses since last message (${isEligible ? 'eligible' : 'waiting'})`);
        
        return isEligible;
      });

      if (eligibleAIs.length === 0) {
        // No AI is eligible yet, check again in a bit
        console.log('No AIs eligible yet - waiting for more responses');
        messageTimerRef.current = setTimeout(() => scheduleNextMessage(), 3000);
        return;
      }

      // Prioritize AIs with fewer messages to ensure balanced participation
      const minMessages = Math.min(...eligibleAIs.map(ai => aiMessageCounts.current.get(ai.id) || 0));
      const aisWithMinMessages = eligibleAIs.filter(ai => 
        (aiMessageCounts.current.get(ai.id) || 0) === minMessages
      );
      
      // Pick a random AI from those with fewest messages
      const selectedAI = aisWithMinMessages[Math.floor(Math.random() * aisWithMinMessages.length)];
      
      console.log(`Selected ${selectedAI.name} to send next message (${aiMessageCounts.current.get(selectedAI.id) || 0} messages so far)`);
      
      // Random delay based on pace setting
      const paceDelays = {
        relaxed: { min: 12000, range: 6000 },  // 12-18 seconds
        normal: { min: 8000, range: 4000 },    // 8-12 seconds
        fast: { min: 5000, range: 3000 },      // 5-8 seconds
      };
      
      const { min, range } = paceDelays[pace] || paceDelays.normal;
      const delay = min + Math.random() * range;

      messageTimerRef.current = setTimeout(async () => {
        await generateAndSendAIMessage(selectedAI.id);
        scheduleNextMessage(); // Schedule next message
      }, delay);
    };

    // Get fresh list of active AIs for initial message
    const currentActiveAIs = participants.filter((p) => !p.isEliminated && !p.isHuman);
    
    console.log('🎬 Starting timed messages with', currentActiveAIs.length, 'active AIs:', currentActiveAIs.map(ai => ai.name));
    console.log('   All participants:', participants.map(p => `${p.name}(${p.isEliminated ? 'eliminated' : 'active'})`));
    
    if (currentActiveAIs.length === 0) {
      console.log('❌ ERROR: No active AIs to send messages!');
      return;
    }
    
    // Start with first message immediately (3 seconds)
    console.log('⏰ Setting 3-second timer for first AI message...');
    messageTimerRef.current = setTimeout(async () => {
      console.log('⏰ First message timer fired!');
      console.log('   roundActive at timer fire:', roundActive);
      console.log('   currentRound at timer fire:', currentRound);
      
      if (currentActiveAIs.length > 0) {
        const firstAI = currentActiveAIs[Math.floor(Math.random() * currentActiveAIs.length)];
        console.log(`🎯 Selected ${firstAI.name} for first message`);
        await generateAndSendAIMessage(firstAI.id);
        console.log(`✅ First message from ${firstAI.name} completed, scheduling next...`);
        scheduleNextMessage(); // Continue scheduling
      } else {
        console.log('❌ No AIs available when timer fired');
      }
    }, 3000);
    console.log('✅ Timer set successfully, timer ID:', messageTimerRef.current);
  };

  // Generate and send AI message
  const generateAndSendAIMessage = async (aiId: string) => {
    // Check if this AI is already sending a message (prevent duplicates)
    if (aiCurrentlySending.current.has(aiId)) {
      console.log(`${aiId} is already sending a message, skipping duplicate`);
      return;
    }
    
    // Get fresh participant data (not from closure)
    const currentParticipants = useGameStore.getState().participants;
    const ai = currentParticipants.find((a) => a.id === aiId && !a.isEliminated && !a.isHuman);
    
    if (!ai) {
      console.log(`AI ${aiId} not found or eliminated`);
      return;
    }
    
    if (!roundActive) {
      console.log('Round not active, skipping AI message');
      return;
    }

    // Mark this AI as currently sending
    aiCurrentlySending.current.add(aiId);
    console.log(`Generating message from ${ai.name}...`);
    setShowTyping(true);

    try {
      // Get conversation context - ALL messages from this round
      const allRoundMessages = messages
        .filter((m) => m.round === currentRound)
        .map((m) => `${m.participantName}: ${m.content}`);
      
      // Count this AI's previous messages
      const aiPreviousMessageCount = messages
        .filter((m) => m.round === currentRound && m.participantId === ai.id)
        .length;

      // Use ref to get current prompt value (avoids state timing issues)
      const promptToUse = currentPromptRef.current || currentPrompt;
      
      if (!promptToUse) {
        console.error('No prompt available!');
        setShowTyping(false);
        aiCurrentlySending.current.delete(ai.id);
        return;
      }
      
      console.log(`${ai.name} responding to prompt: "${promptToUse}"`);
      console.log(`${ai.name} has sent ${aiPreviousMessageCount} messages already (${allRoundMessages.length} total messages in round)`);
      if (allRoundMessages.length > 0) {
        console.log('Last 3 messages:', allRoundMessages.slice(-3).join(' | '));
      }

      const aiContent = await generateAIResponse(
        ai,
        promptToUse,
        theme!,
        allRoundMessages
      );
      
      console.log(`${ai.name} generated response:`, aiContent);

      const aiMessage: Message = {
        id: `msg-${Date.now()}-${ai.id}-${Math.random()}`,
        participantId: ai.id,
        participantName: ai.name,
        content: aiContent,
        round: currentRound,
        timestamp: Date.now(),
      };

      addMessage(aiMessage);
      gameAudio.playMessageReceived(); // Play sound when AI message arrives
      
      // IMMEDIATELY update AI message tracking to prevent race conditions
      // Get the updated message count from store right after adding
      const store = useGameStore.getState();
      const currentRoundMessages = store.messages.filter((m) => m.round === currentRound);
      const messageIndex = currentRoundMessages.length - 1;
      
      // Update counts using refs (no closure issues!)
      aiMessageCounts.current.set(ai.id, (aiMessageCounts.current.get(ai.id) || 0) + 1);
      console.log(`${ai.name} message count updated to ${aiMessageCounts.current.get(ai.id)}`);
      
      lastMessageIndex.current.set(ai.id, messageIndex);
      console.log(`${ai.name} sent message at index ${messageIndex}`);
      
      // Remove from currently sending set IMMEDIATELY
      aiCurrentlySending.current.delete(ai.id);
      
    } catch (error) {
      console.error(`Error generating AI message for ${ai.name}:`, error);
      // Make sure to remove from sending set on error
      aiCurrentlySending.current.delete(ai.id);
    } finally {
      setShowTyping(false);
    }
  };

  // Handle player message submission
  const handlePlayerSubmit = async () => {
    if (!playerResponse.trim() || !humanParticipant || !roundActive) return;

    const playerMessage: Message = {
      id: `msg-${Date.now()}-human-${Math.random()}`,
      participantId: humanParticipant.id,
      participantName: humanParticipant.name,
      content: playerResponse.trim(),
      round: currentRound,
      timestamp: Date.now(),
    };
    
    addMessage(playerMessage);
    setPlayerResponse('');
    setHumanMessageCount((prev) => prev + 1);
    gameAudio.playMessageSent(); // Play sound when player sends message
    
    console.log('Human responded - AI eligibility may change');
  };

  // End round and move to discussion phase
  const endRound = () => {
    setRoundActive(false);
    setTimerActive(false);
    
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    
    // Short delay before moving to discussion
    setTimeout(() => {
      setPhase('discussion');
    }, 2000);
  };

  const roundMessages = messages.filter((m) => m.round === currentRound);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine timer color
  const getTimerColor = () => {
    if (timeRemaining <= 10) return 'text-red-500';
    if (timeRemaining <= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden">
      {/* Chat Header - Like WhatsApp */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Group Info */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">{themeConfig?.icon}</div>
              <div>
                <div className="text-white font-semibold">{themeConfig?.name} Group</div>
                <div className="text-xs text-gray-400">
                  {activeParticipants.map(p => p.name).join(', ')}
                </div>
              </div>
            </div>
            
            {/* Round & Timer */}
            <div className="text-right">
              <div className="text-sm text-gray-300">Round {currentRound}/{totalRounds}</div>
              {timerActive && (
                <div className={`text-lg font-bold ${getTimerColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topic Banner */}
      <div className="flex-shrink-0 bg-gradient-to-r from-primary-900 to-primary-800 px-4 py-4 shadow-md">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs text-primary-200 uppercase tracking-wide mb-1">Today's Topic</div>
          <div className="text-white text-lg font-medium">{currentPrompt}</div>
          <div className="text-xs text-primary-300 mt-2">
            💡 Participate naturally! Send multiple messages like a real conversation.
          </div>
        </div>
      </div>

      {/* Messages Area - Chat Style */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-3">
          {roundMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500">Chat starting...</p>
            </div>
          ) : (
            roundMessages.map((msg, index) => {
              const participant = participants.find((p) => p.id === msg.participantId);
              const isHumanMessage = participant?.isHuman;
              const prevMsg = index > 0 ? roundMessages[index - 1] : null;
              const showAvatar = !prevMsg || prevMsg.participantId !== msg.participantId;
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 items-end message-enter ${isHumanMessage ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 flex-shrink-0">
                    {showAvatar && (
                      <div className="text-2xl">{participant?.avatar}</div>
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`max-w-md ${isHumanMessage ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <div className={`text-xs text-gray-400 mb-1 px-3 ${isHumanMessage ? 'text-right' : ''}`}>
                        {msg.participantName}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isHumanMessage
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing Indicator */}
          {showTyping && (
            <div className="flex gap-2 items-end">
              <div className="w-8 h-8 flex-shrink-0">
                <div className="text-2xl">🤖</div>
              </div>
              <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      {roundActive && !humanParticipant?.isEliminated && (
        <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            {/* Message counter with warning */}
            <div className="mb-2 px-2">
              <div className="text-xs text-gray-400">
                You've sent {humanMessageCount} {humanMessageCount === 1 ? 'message' : 'messages'} this round
              </div>
              {humanMessageCount === 0 && timeRemaining < 60 && (
                <div className="text-xs text-red-400 mt-1 font-semibold animate-pulse">
                  ⚠️ Warning: If you don't add messages, the AI agents will suspect you as human!
                </div>
              )}
            </div>
            
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  value={playerResponse}
                  onChange={(e) => setPlayerResponse(e.target.value)}
                  placeholder="Type your message... Join the discussion naturally!"
                  className="w-full bg-gray-900 text-white rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  maxLength={300}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePlayerSubmit();
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mt-1 px-2">
                  {playerResponse.length}/300
                </div>
              </div>
              <button
                onClick={handlePlayerSubmit}
                disabled={!playerResponse.trim()}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full p-3 transition-colors mb-6"
                title="Send (or press Enter)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Ending Overlay */}
      {!roundActive && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center animate-fade-in z-50">
          <div className="bg-gray-800 rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4">
            <div className="text-6xl mb-4">💭</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Discussion Time!
            </h3>
            <p className="text-gray-400">Everyone will now share their suspicions...</p>
          </div>
        </div>
      )}
    </div>
  );
}
