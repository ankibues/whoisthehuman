import { useGameStore } from './store/gameStore';
import { LobbyScreen } from './components/LobbyScreen';
import { ChatScreen } from './components/ChatScreen';
import { DiscussionScreen } from './components/DiscussionScreen';
import { VotingScreen } from './components/VotingScreen';
import { RevealScreen } from './components/RevealScreen';

function App() {
  const phase = useGameStore((state) => state.phase);

  return (
    <>
      {phase === 'lobby' && <LobbyScreen />}
      {phase === 'chat' && <ChatScreen />}
      {phase === 'discussion' && <DiscussionScreen />}
      {phase === 'voting' && <VotingScreen />}
      {phase === 'reveal' && <RevealScreen />}
    </>
  );
}

export default App;

