import type { Participant, Message, Vote, GameDifficulty } from '../types/game';

/**
 * Generate AI votes based on conversation analysis
 */
export async function generateAIVotes(
  aiParticipants: Participant[],
  allActiveParticipants: Participant[],
  allMessages: Message[],
  currentRound: number,
  difficulty: GameDifficulty
): Promise<Vote[]> {
  console.log(`🚀 Generating ${aiParticipants.length} AI votes in PARALLEL for speed...`);
  const startTime = Date.now();
  
  // Generate all votes in PARALLEL with 3 second max timeout!
  const votePromises = aiParticipants.map(async (ai) => {
    try {
      const vote = await generateSingleAIVote(
        ai,
        allActiveParticipants,
        allMessages,
        currentRound,
        difficulty
      );
      return vote;
    } catch (error) {
      console.error(`Error generating vote for ${ai.name}:`, error);
      // Fallback: random vote from all active players (not voting for themselves)
      const otherPlayers = allActiveParticipants.filter((p) => p.id !== ai.id);
      const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
      return {
        voterId: ai.id,
        votedForId: randomTarget.id,
        round: currentRound,
        reasoning: 'Making a guess based on intuition.',
      };
    }
  });

  // Wait for all with 3 second max
  const votes = await Promise.all(votePromises);
  const duration = Date.now() - startTime;
  console.log(`✅ All ${votes.length} votes generated in ${duration}ms!`);
  return votes;
}

/**
 * Analyze a player's messages for human-like patterns
 * FOCUS: Language style, context, and conversational patterns
 */
function analyzeHumanPatterns(participant: Participant, messages: Message[], currentRound: number): {
  score: number;
  flags: string[];
} {
  const playerMessages = messages.filter((m) => m.participantId === participant.id && m.round === currentRound);
  let score = 0;
  const flags: string[] = [];
  
  // No participation is VERY suspicious for humans (they're hiding!)
  if (playerMessages.length === 0) {
    score += 25;
    flags.push('🔴 No participation');
    return { score, flags };
  }
  
  // Very low participation (1 message) is also suspicious
  if (playerMessages.length <= 1) {
    score += 15;
    flags.push('🔴 Minimal participation');
  }
  
  // Analyze each message
  for (const msg of playerMessages) {
    const text = msg.content;
    const lowerText = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    
    // ===== STRONG HUMAN INDICATORS =====
    
    // SHORT messages (humans are brief/lazy) - AI aims for 20-30 words
    if (wordCount < 15) {
      score += 10;
      flags.push(`🔴 Only ${wordCount} words (AIs write 20-30)`);
    } else if (wordCount < 18) {
      score += 5;
      flags.push(`${wordCount} words (slightly brief)`);
    }
    
    // Vague or minimal engagement
    const vagueMatch = lowerText.match(/\b(ok|okay|yeah|yea|sure|cool|nice|great|hmm|idk|maybe)\b/);
    if (vagueMatch && wordCount < 10) {
      score += 8;
      flags.push(`🔴 Vague response: "${vagueMatch[0]}"`);
    }
    
    // Typos and informal shortcuts (STRONG indicator)
    const informalMatch = lowerText.match(/\b(ur|u|ppl|r|y|idk|tbh|lol|omg|ngl|fr|bc|gonna|wanna|gotta|kinda|sorta)\b/);
    if (informalMatch) {
      score += 12;
      flags.push(`🔴 Used "${informalMatch[0]}" (informal)`);
    }
    
    // Missing punctuation or lowercase start (grammar mistakes)
    const missingPunctuation = text.length > 5 && !/[.!?]$/.test(text);
    const lowercaseStart = text.length > 0 && /^[a-z]/.test(text);
    
    if (missingPunctuation) {
      score += 12;
      flags.push('🔴 No ending punctuation');
    }
    if (lowercaseStart) {
      score += 12;
      flags.push('🔴 Started with lowercase');
    }
    
    // Repeated letters (sooo, hmmm) - human enthusiasm/thinking
    const repeatedMatch = text.match(/([a-z])\1{2,}/i);
    if (repeatedMatch) {
      score += 10;
      flags.push(`🔴 Repeated letters: "${repeatedMatch[0]}"`);
    }
    
    // Ellipsis usage (trailing thoughts)
    if (text.includes('...')) {
      score += 8;
      flags.push('🔴 Used "..."');
    }
    
    // Multiple punctuation (!!!, ???)
    const multiPunctMatch = text.match(/[!?]{2,}/);
    if (multiPunctMatch) {
      score += 7;
      flags.push(`🔴 Used "${multiPunctMatch[0]}"`);
    }
    
    // Just rephrasing/agreeing without adding value (human pattern)
    const isJustAgreeing = lowerText.match(/^(yeah|yep|yea|true|exactly|agreed|same|i agree|that's true|good point|makes sense|fair enough)/i) && wordCount < 12;
    if (isJustAgreeing) {
      score += 9;
      flags.push('🔴 Just agreeing, no new insight');
    }
    
    // Check if message is very similar to previous messages (rephrasing)
    const previousTexts = messages
      .filter((m) => m.participantId !== participant.id && m.round === currentRound && m.timestamp < msg.timestamp)
      .map((m) => m.content.toLowerCase());
    
    const words = lowerText.split(/\s+/).filter(w => w.length > 3); // Get meaningful words
    for (const prevText of previousTexts) {
      const prevWords = prevText.split(/\s+/).filter(w => w.length > 3);
      const commonWords = words.filter(w => prevWords.includes(w));
      const similarity = commonWords.length / Math.max(words.length, 1);
      
      if (similarity > 0.6 && words.length > 5) {
        score += 8;
        flags.push('🔴 Rephrasing previous message');
        break; // Only flag once
      }
    }
    
    // ===== MODERATE HUMAN INDICATORS =====
    
    // Personal/emotional language
    if (lowerText.match(/\b(i feel|i think|i dunno|i guess|honestly|personally|my opinion)\b/)) {
      score += 6;
      flags.push('Personal expression');
    }
    
    // Questions (but not too many - AIs also ask)
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount === 1) {
      score += 3;
    }
    
    // ===== AI-LIKE INDICATORS (NEGATIVE SCORE) =====
    
    // LONGER, well-structured messages (AI is thorough) - AI writes 20-30 words
    if (wordCount >= 20 && wordCount <= 35) {
      score -= 6;
      flags.push('⚪ Well-structured message');
    }
    
    // Perfect grammar and structure (moderate penalty)
    const hasGoodGrammar = /^[A-Z]/.test(text) && /[.!?]$/.test(text) && !missingPunctuation && !lowercaseStart;
    if (wordCount > 20 && hasGoodGrammar) {
      score -= 5;
      flags.push('⚪ Perfect grammar');
    }
    
    // Formal or sophisticated language (reduced penalty)
    if (lowerText.match(/\b(furthermore|moreover|indeed|however|therefore|consequently|nevertheless)\b/)) {
      score -= 6;
      flags.push('⚪ Very formal language');
    }
  }
  
  return { score, flags };
}

/**
 * Generate a single AI's vote
 */
async function generateSingleAIVote(
  voter: Participant,
  allParticipants: Participant[],
  messages: Message[],
  currentRound: number,
  difficulty: GameDifficulty
): Promise<Vote> {
  // Get active players (not eliminated)
  const activePlayers = allParticipants.filter((p) => !p.isEliminated && p.id !== voter.id);
  
  if (activePlayers.length === 0) {
    throw new Error('No active players to vote for');
  }

  // SMARTER ANALYSIS: Score each player based on human-like patterns
  const playerScores = activePlayers.map((p) => {
    const analysis = analyzeHumanPatterns(p, messages, currentRound);
    return {
      player: p,
      score: analysis.score,
      flags: analysis.flags,
    };
  });
  
  // Sort by score (highest = most likely human)
  playerScores.sort((a, b) => b.score - a.score);
  
  console.log(`${voter.name}'s analysis:`, playerScores.map(ps => `${ps.player.name}: ${ps.score} (${ps.flags.join(', ')})`));
  
  // Difficulty affects how accurate the AI is
  let targetPlayer;
  let reasoning = '';
  
  if (difficulty === 'easy') {
    // Easy: 50% chance of random vote (coin flip)
    if (Math.random() < 0.5) {
      targetPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
      reasoning = 'Just a hunch.';
    } else {
      targetPlayer = playerScores[0].player;
      const topFlags = playerScores[0].flags.slice(0, 1).join(', ') || 'suspicious behavior';
      reasoning = `${topFlags}.`;
    }
  } else if (difficulty === 'medium') {
    // Medium: 25% chance of random vote
    if (Math.random() < 0.25) {
      targetPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
      reasoning = 'Going with my gut.';
    } else {
      targetPlayer = playerScores[0].player;
      const topFlags = playerScores[0].flags.slice(0, 2).join('; ') || 'behavioral patterns detected';
      reasoning = `${topFlags}.`;
    }
  } else {
    // Hard: ALWAYS picks highest score - ZERO mercy!
    // If there's a tie, pick randomly among top scorers
    const topScore = playerScores[0].score;
    const topScorers = playerScores.filter(ps => ps.score === topScore);
    const selected = topScorers[Math.floor(Math.random() * topScorers.length)];
    
    targetPlayer = selected.player;
    const topFlags = selected.flags.slice(0, 3).join('; ') || 'detected human patterns';
    reasoning = `${topFlags}.`;
  }

  return {
    voterId: voter.id,
    votedForId: targetPlayer.id,
    round: currentRound,
    reasoning,
  };
}


/**
 * Generate analysis for why the human was detected
 */
export function generateHumanAnalysis(
  humanParticipant: Participant,
  messages: Message[],
  currentRound: number
): { detectionFlags: string[]; exampleMessages: string[]; tips: string[] } {
  const analysis = analyzeHumanPatterns(humanParticipant, messages, currentRound);
  const humanMessages = messages.filter(
    (m) => m.participantId === humanParticipant.id && m.round === currentRound
  );
  
  // Get example messages that gave them away
  const exampleMessages = humanMessages.slice(0, 3).map((m) => m.content);
  
  // Generate tips based on what was detected
  const tips: string[] = [];
  
  if (analysis.flags.some(f => f.includes('brief'))) {
    tips.push('💡 Write longer messages (20-30 words). AIs write complete thoughts with context.');
  }
  
  if (analysis.flags.some(f => f.includes('informal') || f.includes('shortcuts'))) {
    tips.push('💡 Avoid shortcuts like "ur", "u", "idk". AIs use proper spelling.');
  }
  
  if (analysis.flags.some(f => f.includes('grammar') || f.includes('punctuation'))) {
    tips.push('💡 Use proper capitalization and punctuation. AIs always end with . ! or ?');
  }
  
  if (analysis.flags.some(f => f.includes('participation'))) {
    tips.push('💡 Participate more! Staying quiet makes you very suspicious.');
  }
  
  if (analysis.flags.some(f => f.includes('ellipsis') || f.includes('Multiple punctuation'))) {
    tips.push('💡 Avoid "..." and "!!!" - these are human tells. Keep it clean.');
  }
  
  if (analysis.flags.some(f => f.includes('agreeing') || f.includes('Just agreeing'))) {
    tips.push('💡 Don\'t just agree! Add NEW perspectives and insights to the discussion.');
  }
  
  if (analysis.flags.some(f => f.includes('ephrasing') || f.includes('Rephrasing'))) {
    tips.push('💡 Avoid repeating what others said. Bring original thoughts and new angles to the topic.');
  }
  
  if (tips.length === 0) {
    tips.push('💡 You played well! Try mimicking AI style: 20-30 words, proper grammar, mention names.');
  }
  
  return {
    detectionFlags: analysis.flags,
    exampleMessages,
    tips
  };
}

/**
 * Determine elimination based on votes
 * Returns the player ID with most votes, or null if tie
 */
export function determineElimination(
  votes: Vote[],
  _activePlayers: Participant[]
): string | null {
  const voteCounts: Record<string, number> = {};

  // Count votes
  for (const vote of votes) {
    voteCounts[vote.votedForId] = (voteCounts[vote.votedForId] || 0) + 1;
  }

  // Find max votes
  let maxVotes = 0;
  let playersWithMaxVotes: string[] = [];

  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      playersWithMaxVotes = [playerId];
    } else if (count === maxVotes) {
      playersWithMaxVotes.push(playerId);
    }
  }

  // If tie, return null
  if (playersWithMaxVotes.length > 1) {
    return null;
  }

  return playersWithMaxVotes[0] || null;
}

