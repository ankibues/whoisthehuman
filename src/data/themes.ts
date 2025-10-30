import type { ThemeConfig } from '../types/game';

export const themes: ThemeConfig[] = [
  {
    id: 'space-crew',
    name: 'Space Crew',
    description: 'Astronauts on a deep space mission',
    icon: '🚀',
    prompts: [
      "Should we investigate that strange signal or stay on course? What do you all think?",
      "The food supply is limited. Which meals should we ration first?",
      "If we could only bring one item from Earth, what would be most useful?",
    ],
  },
  {
    id: 'cafe-talk',
    name: 'Café Talk',
    description: 'Friends meeting at a cozy coffee shop',
    icon: '☕',
    prompts: [
      "Okay debate time: Is coffee or tea actually better? Defend your choice!",
      "If you could only eat one type of cuisine forever, what would you pick?",
      "Hot take: Morning people vs night owls - which are you and why is your way better?",
    ],
  },
  {
    id: 'office-party',
    name: 'Office Party',
    description: 'Coworkers at a company celebration',
    icon: '🎉',
    prompts: [
      "Should we do remote work permanently or go back to the office? Thoughts?",
      "If you could swap jobs with anyone here for a day, who and why?",
      "Okay be honest: Which meetings could have been an email?",
    ],
  },
  {
    id: 'college-dorm',
    name: 'College Dorm',
    description: 'Students hanging out in the dorm',
    icon: '📚',
    prompts: [
      "Is studying in groups actually better or just more distracting? Be real.",
      "If you could drop one class with no consequences, which one would it be?",
      "Okay truth: Are 8am classes a crime against humanity or character building?",
    ],
  },
  {
    id: 'mystery-dinner',
    name: 'Mystery Dinner',
    description: 'Guests at an elegant dinner party',
    icon: '🍷',
    prompts: [
      "Someone here is not who they claim to be. Any theories on who?",
      "If you had to form an alliance with someone here, who would you trust?",
      "What's the most suspicious thing you've noticed tonight? Anyone acting strange?",
    ],
  },
  {
    id: 'pizza-debate',
    name: 'Pizza Night',
    description: 'Friends ordering pizza together',
    icon: '🍕',
    prompts: [
      "Pineapple on pizza - is it genius or a crime? Let's settle this!",
      "What's the most overrated pizza topping? Fight me on this.",
      "Delivery or homemade? Which is actually better and why?",
    ],
  },
  {
    id: 'road-trip',
    name: 'Road Trip',
    description: 'Friends planning an epic adventure',
    icon: '🚗',
    prompts: [
      "Beach, mountains, or city trip? Where should we actually go?",
      "Who's the worst person to be stuck in a car with for 8 hours?",
      "Road trip snacks: what's absolutely essential? No wrong answers... except there are.",
    ],
  },
  {
    id: 'movie-night',
    name: 'Movie Night',
    description: 'Picking what to watch together',
    icon: '🎬',
    prompts: [
      "Horror, comedy, or action? What are we watching tonight?",
      "Unpopular opinion time: which 'classic' movie is actually overrated?",
      "Theater popcorn prices - justified or highway robbery?",
    ],
  },
  {
    id: 'gym-buddies',
    name: 'Gym Squad',
    description: 'Workout friends at the gym',
    icon: '💪',
    prompts: [
      "Cardio or weights? Which one's actually more important?",
      "People who don't wipe down equipment after - thoughts?",
      "Rest days: essential for gains or just an excuse to be lazy?",
    ],
  },
  {
    id: 'gaming-session',
    name: 'Gaming Squad',
    description: 'Gamers in voice chat',
    icon: '🎮',
    prompts: [
      "PC or console? Defend your platform!",
      "Is rage quitting ever justified or are you just salty?",
      "Single player or multiplayer games - which are actually better?",
    ],
  },
];

export const getThemeById = (id: string): ThemeConfig | undefined => {
  return themes.find((theme) => theme.id === id);
};

