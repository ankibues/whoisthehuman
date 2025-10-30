import { chromeAI } from './chromeAI';
import type { Participant, GameTheme } from '../types/game';
import { getThemeById } from '../data/themes';

interface PersonaTemplate {
  name: string;
  trait: string;
  occupation: string;
  avatar: string;
}

const personaTemplates: PersonaTemplate[] = [
  { name: 'Alex', trait: 'analytical and logical', occupation: 'engineer', avatar: '👨‍💻' },
  { name: 'Sam', trait: 'creative and spontaneous', occupation: 'artist', avatar: '🎨' },
  { name: 'Jordan', trait: 'friendly and outgoing', occupation: 'teacher', avatar: '👩‍🏫' },
  { name: 'Taylor', trait: 'witty and sarcastic', occupation: 'comedian', avatar: '😄' },
  { name: 'Morgan', trait: 'thoughtful and empathetic', occupation: 'counselor', avatar: '🧘' },
  { name: 'Casey', trait: 'energetic and enthusiastic', occupation: 'fitness coach', avatar: '💪' },
  { name: 'Riley', trait: 'curious and intellectual', occupation: 'scientist', avatar: '🔬' },
  { name: 'Jamie', trait: 'calm and collected', occupation: 'meditation instructor', avatar: '🌸' },
];

/**
 * Generate AI personas based on theme
 */
export async function generatePersonas(
  theme: GameTheme,
  playerName: string,
  count: number = 4
): Promise<Participant[]> {
  const themeConfig = getThemeById(theme);
  if (!themeConfig) {
    throw new Error('Invalid theme');
  }

  // Shuffle and select personas
  const shuffled = [...personaTemplates].sort(() => Math.random() - 0.5);
  const selectedTemplates = shuffled.slice(0, count);

  const participants: Participant[] = [];

  // Create AI personas with quick bio generation (no API calls for speed)
  for (const template of selectedTemplates) {
    const bioPatterns = [
      `${template.name} is a ${template.trait} ${template.occupation} who loves connecting with others.`,
      `Hey everyone! I'm ${template.name}, ${template.occupation} by day, adventurer by night.`,
      `${template.name} here - ${template.trait} and always ready for a good conversation!`,
      `As a ${template.trait} ${template.occupation}, ${template.name} brings unique perspectives to every discussion.`,
    ];
    
    const bio = bioPatterns[Math.floor(Math.random() * bioPatterns.length)];

    participants.push({
      id: `ai-${template.name.toLowerCase()}`,
      name: template.name,
      isHuman: false,
      personality: `${template.trait} ${template.occupation}`,
      bio: bio,
      avatar: template.avatar,
      isEliminated: false,
    });
  }

  // Add human player
  participants.push({
    id: 'human',
    name: playerName,
    isHuman: true,
    avatar: '😊',
    isEliminated: false,
  });

  // Shuffle participants to randomize order
  return participants.sort(() => Math.random() - 0.5);
}

/**
 * Generate AI response for a specific persona
 */
export async function generateAIResponse(
  participant: Participant,
  prompt: string,
  theme: GameTheme,
  previousMessages: string[] = []
): Promise<string> {
  const themeConfig = getThemeById(theme);
  if (!themeConfig) {
    throw new Error('Invalid theme');
  }

  // Get last few messages from others for immediate context
  const recentOthersMessages = previousMessages.filter((msg) => 
    !msg.startsWith(`${participant.name}:`)
  ).slice(-5);
  
  // Get list of ALL participant names from previousMessages
  // This includes both AIs and the human player
  const participantNames = Array.from(new Set(
    previousMessages.map(msg => {
      const match = msg.match(/^([^:]+):/);
      return match ? match[1] : null;
    }).filter(name => name !== null && name !== participant.name) // Exclude self, include everyone else
  )) as string[];
  
  console.log(`${participant.name} can reference these players:`, participantNames);

  const systemPrompt = `You are ${participant.name}. Topic: "${prompt}"

${recentOthersMessages.length > 0 ? `Recent conversation:\n${recentOthersMessages.slice(-3).join('\n')}\n` : ''}

EVERYONE IN CHAT (reference ANY of them if needed):
${participantNames.join(', ')}

CRITICAL RULES:
- Write 1-2 sentences related to the topic (20-30 words total)
- ${recentOthersMessages.length > 0 ? 'Either: A) React to someone\'s point (agree/disagree), OR B) Add a NEW perspective/angle on the topic' : 'Share your thought on the topic'}
- You CAN mention OTHER people's names (${participantNames.join(', ')}), but don't refer to yourself
- DON'T say "${participant.name} thinks" - you ARE ${participant.name}, so just say "I think"
- Stay on topic: "${prompt}"
- Proper grammar and punctuation

GOOD examples (mix reactions with new angles):
"I see it differently - we should also consider the long-term consequences here."
"${participantNames[0] ? `${participantNames[0]}, ` : ''}that's valid, but what about the resource cost? That matters too."
"Here's another angle: the timing is crucial. We can't delay this decision much longer."
"I totally agree with that point. It's the most practical approach."

Your response (react OR add new perspective):`;

  try {
    let response = await chromeAI.prompt(systemPrompt);
    response = response.trim();
    
    // Remove the participant's name if the AI added it as a prefix
    const namePrefix = `${participant.name}:`;
    if (response.startsWith(namePrefix)) {
      response = response.substring(namePrefix.length).trim();
      console.log(`Stripped name prefix from ${participant.name}'s response`);
    }
    
    // Also check for lowercase or variations
    const namePrefixLower = `${participant.name.toLowerCase()}:`;
    if (response.toLowerCase().startsWith(namePrefixLower)) {
      response = response.substring(namePrefix.length).trim();
      console.log(`Stripped lowercase name prefix from ${participant.name}'s response`);
    }
    
    // Remove quotes if the AI wrapped the response
    response = response.replace(/^["']|["']$/g, '');
    
    // Remove self-references in third person (e.g., "Casey thinks" when the speaker IS Casey)
    const selfReferencePatterns = [
      new RegExp(`\\b${participant.name}\\s+(thinks?|says?|believes?|feels?)\\b`, 'gi'),
      new RegExp(`\\b${participant.name}'s\\s+(opinion|thought|view|perspective)\\b`, 'gi'),
      new RegExp(`,\\s*${participant.name}\\s+(thinks?|says?)\\.$`, 'gi') // trailing self-reference
    ];
    
    for (const pattern of selfReferencePatterns) {
      if (pattern.test(response)) {
        console.warn(`⚠️ ${participant.name} referred to themselves in third person - removing`);
        response = response.replace(pattern, '').trim();
        // Clean up any trailing punctuation issues
        if (!response.match(/[.!?]$/)) {
          response += '.';
        }
      }
    }
    
    // Validate: Check if AI mentioned any names that don't exist in the conversation
    const validNames = participantNames;
    const mentionedInvalidNames = response.match(/\b[A-Z][a-z]+\b/g) || [];
    
    for (const mentioned of mentionedInvalidNames) {
      if (!validNames.includes(mentioned) && mentioned !== participant.name) {
        console.warn(`⚠️ ${participant.name} mentioned invalid name "${mentioned}" - this may be a hallucination`);
      }
    }
    
    // ENFORCE LENGTH: Truncate at sentence boundaries if too long (max 35 words for 1-2 sentences)
    const words = response.split(/\s+/);
    if (words.length > 35) {
      console.log(`⚠️ ${participant.name}'s message was ${words.length} words - truncating to 35`);
      
      // Try to truncate at sentence boundary (., !, ?)
      const sentences = response.split(/([.!?]+\s+)/);
      let truncated = '';
      let wordCount = 0;
      
      for (let i = 0; i < sentences.length; i++) {
        const sentenceWords = sentences[i].split(/\s+/).length;
        if (wordCount + sentenceWords <= 35) {
          truncated += sentences[i];
          wordCount += sentenceWords;
        } else {
          break;
        }
      }
      
      response = truncated.trim() || words.slice(0, 35).join(' ') + '.';
    }
    
    // Enforce character limit (max 200 chars for 1-2 sentences)
    if (response.length > 200) {
      console.log(`⚠️ ${participant.name}'s message was ${response.length} chars - truncating to 200`);
      // Find last sentence boundary before 200
      const match = response.substring(0, 200).match(/^.*[.!?]/);
      response = match ? match[0] : response.substring(0, 197) + '...';
    }
    
    // 🎲 OCCASIONALLY ADD HUMAN-LIKE ELEMENTS (20% chance per AI message)
    // This makes AI players occasionally slip up, confusing other AIs in their detection
    const addHumanElement = Math.random() < 0.2;
    let appliedHumanElement = false;
    let humanElementType = -1;
    
    if (addHumanElement) {
      humanElementType = Math.floor(Math.random() * 6);
      
      switch (humanElementType) {
        case 0: // Make message brief (remove last sentence)
          const sentences = response.split(/[.!?]+\s+/);
          if (sentences.length > 1) {
            response = sentences[0] + (response.match(/[.!?]/) ? '.' : '');
            console.log(`🎭 ${participant.name} using brief message (human-like)`);
            appliedHumanElement = true;
          }
          break;
          
        case 1: // Add informal language
          const informalReplacements = [
            { from: /\byou are\b/i, to: "you're" },
            { from: /\bI am\b/i, to: "I'm" },
            { from: /\bcannot\b/i, to: "can't" },
            { from: /\bdo not\b/i, to: "don't" },
            { from: /\bthat is\b/i, to: "that's" }
          ];
          for (const replacement of informalReplacements) {
            if (replacement.from.test(response)) {
              response = response.replace(replacement.from, replacement.to);
              console.log(`🎭 ${participant.name} using informal language (human-like)`);
              appliedHumanElement = true;
              break;
            }
          }
          break;
          
        case 2: // Remove ending punctuation (grammar mistake)
          if (/[.!?]$/.test(response)) {
            response = response.replace(/[.!?]$/, '');
            console.log(`🎭 ${participant.name} removing punctuation (human-like)`);
            appliedHumanElement = true;
          }
          break;
          
        case 3: // Start with lowercase (grammar mistake)
          if (/^[A-Z]/.test(response)) {
            response = response.charAt(0).toLowerCase() + response.slice(1);
            console.log(`🎭 ${participant.name} using lowercase start (human-like)`);
            appliedHumanElement = true;
          }
          break;
          
        case 4: // Add repeated letter for emphasis
          const words = response.split(' ');
          const wordToModify = words.find(w => w.length > 3 && /^[a-z]+$/i.test(w));
          if (wordToModify) {
            const letterIndex = Math.floor(Math.random() * wordToModify.length);
            const letterToRepeat = wordToModify[letterIndex];
            const modified = wordToModify.slice(0, letterIndex) + letterToRepeat + letterToRepeat + wordToModify.slice(letterIndex + 1);
            response = response.replace(wordToModify, modified);
            console.log(`🎭 ${participant.name} using repeated letter (human-like): ${modified}`);
            appliedHumanElement = true;
          }
          break;
          
        case 5: // Add ellipsis
          if (/[.!?]$/.test(response)) {
            response = response.replace(/[.!?]$/, '...');
            console.log(`🎭 ${participant.name} using ellipsis (human-like)`);
            appliedHumanElement = true;
          }
          break;
      }
    }
    
    // Ensure proper capitalization for AI (unless we intentionally made it lowercase)
    if (!appliedHumanElement || humanElementType !== 3) {
      if (response.length > 0 && /^[a-z]/.test(response)) {
        response = response.charAt(0).toUpperCase() + response.slice(1);
      }
    }
    
    // Ensure ends with punctuation (unless we intentionally removed it or added ellipsis)
    if (!appliedHumanElement || (humanElementType !== 2 && humanElementType !== 5)) {
      if (response.length > 0 && !/[.!?]$/.test(response) && !response.endsWith('...')) {
        response += '.';
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Error generating response for ${participant.name}:`, error);
    // Fallback responses - conversational reactions
    const fallbacks = [
      "That's a really good point! I hadn't thought about it that way before.",
      "Oh interesting! I actually see it a bit differently based on my experience.",
      "Wait, that's fascinating. Can you explain more about what you mean?",
      "I totally agree with you on that. Anyone else feel the same way?",
      "Hmm, I'm not sure I agree but I see where you're coming from!",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

/**
 * Generate game summary using Summarizer API
 */
export async function generateGameSummary(
  _messages: string[],
  humanName: string,
  correctGuess: boolean
): Promise<string> {
  // Generate a quick summary without API calls for speed
  return correctGuess
    ? `Great job! You correctly identified ${humanName} as the human. The human's responses showed more emotional depth and personal experiences.`
    : `The human was actually ${humanName}. AI responses tend to be more structured, while humans often share more specific personal details.`;
}

