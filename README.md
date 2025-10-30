# Who's the Human?

<div align="center">
  
**A reverse Turing test game powered by Chrome's Built-in AI**

*Can you fool AI into thinking you're one of them?*

[🎮 Play Demo](https://whos-human.vercel.app) | [📺 Watch Video](https://youtube.com/watch?v=YOUR_VIDEO_ID) | [🐛 Report Bug](https://github.com/YOUR_USERNAME/whos-human/issues)

**Built for the Google Chrome Built-in AI Challenge 2025**

</div>

---

## 🎯 Overview

Who's the Human? is a social deduction game where one human player chats with three AI-powered personas. The twist? The AI is trying to detect YOU! Using Chrome's Prompt API with Gemini Nano running entirely client-side, AI players analyze conversation patterns in real-time to identify human communication tells.

Think of it as a reverse Turing test - instead of humans detecting AI, the AI detects humans.

## ✨ Key Features

- 🤖 **100% Client-Side AI** - Uses Chrome's Prompt API with Gemini Nano (no servers!)
- 🎭 **10 Themed Scenarios** - From space missions to pizza debates
- 🎚️ **3 Difficulty Levels** - Adaptive AI detection (Easy, Medium, Hard)
- ⚡ **3 Game Paces** - Control conversation speed (Relaxed, Normal, Fast)
- 📊 **Educational Feedback** - Learn exactly how AI detected you with specific examples
- 🔒 **Complete Privacy** - All data stays on your device
- 🎨 **AI "Human-like" Elements** - AIs occasionally make mistakes to confuse each other (20% chance)
- 🎮 **Smart Detection System** - 15+ linguistic pattern analysis points

## 🚀 Chrome Built-in AI APIs Used

### Primary: Prompt API (Gemini Nano)

**1. Dynamic AI Persona Generation**
- Creates unique characters with distinct personalities and backstories
- Each AI has generated name, traits, and communication style

**2. Contextual Chat Response Generation**
- Analyzes recent conversation (last 3-5 messages)
- Generates natural responses that reference others or add new perspectives
- Maintains conversational flow with context awareness

**3. Real-time Human Pattern Detection**
- Analyzes 15+ linguistic patterns:
  - Message length (< 18 words = suspicious)
  - Informal language ("ur", "idk", "lol")
  - Grammar mistakes (no punctuation, lowercase start)
  - Repeated letters ("sooo", "hmmm")
  - Rephrasing vs. original thought
  - Just agreeing without adding value
- Weighted scoring system
- Adaptive difficulty (50% random to 100% pattern-based)

**4. AI Suspicion & Reasoning**
- Generates specific suspicion statements with cited patterns
- Example: "Abbey: used 'idk', only 15 words"

## 💡 Problem Statement

This project addresses three key challenges:

1. **Reverse Turing Test** - Understanding how AI perceives human communication
2. **AI-Human Interaction Education** - Making AI analysis transparent and educational
3. **Privacy-First AI Gaming** - Proving complex games can run entirely client-side

## 🎮 How to Play

1. Enter your name and select difficulty
2. Choose a themed scenario
3. Chat with AI personas during timed rounds
4. Try to blend in by writing like an AI
5. AIs analyze your patterns and vote on who's human
6. Learn from specific feedback if you're caught!

**Pro Tips:**
- Write 20-30 words per message (like AIs do)
- Use proper grammar and punctuation
- Add original thoughts, don't just agree
- Reference other players naturally
- Avoid shortcuts like "ur", "idk", "..."

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **AI**: Chrome Prompt API (Gemini Nano)
- **Deployment**: Vercel

## 📋 Prerequisites

To run this game, you need:

- **Chrome Dev** (v138+) or **Chrome Canary**
- **Gemini Nano** model downloaded
- **AI flags enabled**

### Setup Instructions

1. **Install Chrome Dev or Canary**
   ```
   Chrome Dev: https://www.google.com/chrome/dev/
   Chrome Canary: https://www.google.com/chrome/canary/
   ```

2. **Enable AI Flags**
   - Navigate to `chrome://flags`
   - Search and enable:
     - `Prompt API for Gemini Nano` → **Enabled**
     - `Enables optimization guide on device` → **Enabled BypassPerfRequirement**
   - **Restart Chrome**

3. **Download Gemini Nano**
   - Open DevTools Console (F12)
   - Run: `await LanguageModel.availability()`
   - If returns `"after-download"`, wait 5-10 minutes
   - Verify: `await LanguageModel.availability()` returns `"available"`

## 🚀 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/whos-human.git
   cd whos-human
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in Chrome Dev/Canary**
   ```
   http://localhost:5173
   ```

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🎯 Game Features Deep Dive

### AI Detection Patterns (15+ Indicators)

**Strong Human Indicators (+8 to +12 score):**
- Very brief messages (< 15 words)
- Informal language/shortcuts
- Grammar mistakes
- Repeated letters for emphasis
- Ellipsis usage (...)
- Multiple punctuation (!!!)
- Just agreeing without insight
- Rephrasing others (60%+ word overlap)

**AI-Like Indicators (-5 to -6 score):**
- Well-structured 20-30 word messages
- Perfect grammar and punctuation
- Formal language

### Difficulty Modes

- **Easy**: 50% random voting, 50% pattern-based
- **Medium**: 25% random, 75% pattern-based
- **Hard**: 0% random, 100% pattern-based (ruthless!)

### Game Paces

- **Relaxed**: 12-18 seconds between AI messages
- **Normal**: 8-12 seconds
- **Fast**: 5-8 seconds

## 🏆 What Makes This Unique

1. **Reverse Turing Test** - Novel concept: AI detecting humans
2. **Educational Value** - Detailed feedback helps players understand AI behavior
3. **Privacy-First** - Zero server costs, complete data privacy
4. **AI Imperfection** - AIs occasionally make "human" mistakes (20% chance) to confuse detection
5. **Client-Side Innovation** - Proves complex AI gaming works locally

## 🧠 Technical Highlights

- **Sophisticated Pattern Analysis**: 15+ weighted indicators
- **Parallel Processing**: All AI votes generated simultaneously
- **Context-Aware Prompts**: AIs maintain conversation history
- **Smart Message Scheduling**: Prevents AI self-responses
- **Name Validation**: Prevents AI hallucinations
- **Sentence-Boundary Truncation**: Ensures coherent messages

## 📊 Project Structure

```
whos-human/
├── src/
│   ├── components/        # React components
│   │   ├── ChatScreen.tsx
│   │   ├── DiscussionScreen.tsx
│   │   ├── VotingScreen.tsx
│   │   ├── RevealScreen.tsx
│   │   └── LobbyScreen.tsx
│   ├── utils/
│   │   ├── chromeAI.ts           # Chrome AI API integration
│   │   ├── aiPersonaGenerator.ts # AI persona & message generation
│   │   ├── aiVoting.ts           # Pattern detection & voting logic
│   │   └── audio.ts              # Game audio
│   ├── store/
│   │   └── gameStore.ts          # Zustand state management
│   ├── data/
│   │   └── themes.ts             # Game themes & prompts
│   └── types/
│       ├── game.ts               # TypeScript types
│       └── chrome-ai.d.ts        # Chrome AI type definitions
├── public/                # Static assets
├── README.md             # This file
├── LICENSE               # MIT License
└── package.json          # Dependencies
```

## 🤝 Contributing

This is a hackathon submission project. If you'd like to contribute improvements:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Chrome Team** - For the amazing Built-in AI APIs
- **Chrome Built-in AI Challenge 2025** - For the opportunity to innovate
- **Gemini Nano** - For powerful local AI capabilities

## 🐛 Troubleshooting

**Issue: AI not available**
- Solution: Verify Gemini Nano is downloaded with `await LanguageModel.availability()`

**Issue: Game freezes during chat**
- Solution: Refresh page and ensure Chrome flags are enabled

**Issue: "LanguageModel is not defined"**
- Solution: You're not using Chrome Dev/Canary v138+

**Issue: Voting phase stuck**
- Solution: This shouldn't happen anymore (fixed race condition), but refresh if it does

## 📧 Contact

For questions or feedback:
- GitHub Issues: [Create an issue](https://github.com/YOUR_USERNAME/whos-human/issues)
- Twitter: [@YOUR_HANDLE](https://twitter.com/YOUR_HANDLE)

---

<div align="center">

**Built with ❤️ using Chrome's Built-in AI**

*Demonstrating the future of privacy-first, client-side AI applications*

[⭐ Star this repo](https://github.com/YOUR_USERNAME/whos-human) if you found it interesting!

</div>
