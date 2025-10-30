import { useGameStore } from '../store/gameStore';

export function RevealScreen() {
  const {
    humanWon,
    participants,
    messages,
    eliminations,
    totalRounds,
    resetGame,
  } = useGameStore();

  const humanParticipant = participants.find((p) => p.isHuman);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Result Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-6">
            {humanWon ? (
              <div className="text-8xl mb-4 animate-float">🎉</div>
            ) : (
              <div className="text-8xl mb-4 animate-float">💀</div>
            )}
          </div>

          <h2 className="text-5xl font-bold mb-4">
            {humanWon ? (
              <span className="gradient-text">Victory!</span>
            ) : (
              <span className="text-red-400">Defeated!</span>
            )}
          </h2>

          <p className="text-xl text-gray-300">
            {humanWon
              ? `${humanParticipant?.name} survived all ${totalRounds} rounds! The AIs couldn't detect you!`
              : `${humanParticipant?.name} was eliminated! The AIs detected you!`}
          </p>
        </div>

        {/* Human Detection Analysis (if eliminated) */}
        {!humanWon && eliminations.find((e) => e.wasHuman)?.humanAnalysis && (
          <div className="card mb-8 bg-red-900 bg-opacity-20 border-2 border-red-500 animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🔍</span> Why the AIs Caught You
            </h3>
            
            {(() => {
              const humanElim = eliminations.find((e) => e.wasHuman);
              const analysis = humanElim?.humanAnalysis;
              if (!analysis) return null;
              
              return (
                <>
                  {/* Detection Flags */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">What Gave You Away:</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.detectionFlags.map((flag, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-red-800 bg-opacity-50 rounded-full text-sm text-red-200 border border-red-600"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Example Messages */}
                  {analysis.exampleMessages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Your Messages in Round {humanElim?.round}:</h4>
                      <div className="space-y-2">
                        {analysis.exampleMessages.map((msg, i) => (
                          <div key={i} className="p-3 bg-gray-800 bg-opacity-50 rounded-lg border border-red-800">
                            <p className="text-gray-300 text-sm">"{msg}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips for Next Time */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Tips to Blend In Better:</h4>
                    <div className="space-y-2">
                      {analysis.tips.map((tip, i) => (
                        <div key={i} className="p-3 bg-green-900 bg-opacity-20 rounded-lg border border-green-700">
                          <p className="text-green-200 text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Elimination Timeline */}
        {eliminations.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📜</span> Elimination Timeline
            </h3>
            <div className="space-y-3">
              {eliminations.map((elim) => {
                const eliminatedPlayer = participants.find((p) => p.id === elim.eliminatedId);
                const voteCount: Record<string, number> = {};
                elim.votes.forEach((v) => {
                  voteCount[v.votedForId] = (voteCount[v.votedForId] || 0) + 1;
                });
                
                return (
                  <div
                    key={elim.eliminatedId}
                    className={`p-4 rounded-lg border-2 ${
                      elim.wasHuman
                        ? 'border-red-500 bg-red-900 bg-opacity-20'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{eliminatedPlayer?.avatar}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          Round {elim.round}: {eliminatedPlayer?.name} eliminated
                        </div>
                        <div className="text-sm text-gray-400">
                          {voteCount[elim.eliminatedId] || 0} votes • {elim.wasHuman ? '👤 HUMAN' : '🤖 AI'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Participants Reveal */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            🎭 All Players
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`p-4 rounded-lg border-2 ${
                  participant.isHuman
                    ? 'border-primary-500 bg-primary-900 bg-opacity-20'
                    : 'border-gray-600 bg-gray-800'
                } ${participant.isEliminated ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{participant.avatar}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white flex items-center gap-2">
                      {participant.name}
                      {participant.isEliminated && (
                        <span className="text-xs text-red-400">
                          (Round {participant.eliminatedInRound})
                        </span>
                      )}
                    </div>
                    {participant.personality && (
                      <div className="text-xs text-gray-400">
                        {participant.personality}
                      </div>
                    )}
                  </div>
                  <div className="text-xl">
                    {participant.isHuman ? '👤' : '🤖'}
                  </div>
                </div>
                {participant.bio && (
                  <div className="text-sm text-gray-400 mt-2">
                    {participant.bio}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Game Stats */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            📊 Game Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-primary-400">
                {totalRounds}
              </div>
              <div className="text-sm text-gray-400">Total Rounds</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-primary-400">
                {eliminations.length}
              </div>
              <div className="text-sm text-gray-400">Players Eliminated</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-primary-400">
                {messages.length}
              </div>
              <div className="text-sm text-gray-400">Total Messages</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-3xl font-bold text-primary-400">
                {messages.filter((m) => m.participantId === humanParticipant?.id).length}
              </div>
              <div className="text-sm text-gray-400">Your Messages</div>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            💬 Full Conversation
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {[1, 2, 3].map((round) => {
              const roundMessages = messages.filter((m) => m.round === round);
              if (roundMessages.length === 0) return null;
              
              return (
                <div key={round} className="border-l-2 border-primary-500 pl-4">
                  <div className="text-sm font-semibold text-primary-400 mb-2">
                    Round {round}
                  </div>
                  <div className="space-y-2">
                    {roundMessages.map((msg) => {
                      const participant = participants.find((p) => p.id === msg.participantId);
                      return (
                        <div key={msg.id} className="text-sm">
                          <span className="font-semibold text-white">
                            {participant?.avatar} {msg.participantName}:
                          </span>{' '}
                          <span className="text-gray-300">{msg.content}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={resetGame}
            className="btn-primary flex-1"
          >
            🎮 Play Again
          </button>
          <button
            onClick={() => {
              const text = humanWon
                ? `I survived all ${totalRounds} rounds in Who's Human! The AIs couldn't detect me! 🎉`
                : `I played Who's Human and got eliminated by AIs! This game is tough! 🤖`;
              
              if (navigator.share) {
                navigator.share({
                  title: "Who's Human?",
                  text,
                  url: window.location.href,
                }).catch(() => {
                  navigator.clipboard.writeText(`${text}\n${window.location.href}`);
                  alert('Results copied to clipboard!');
                });
              } else {
                navigator.clipboard.writeText(`${text}\n${window.location.href}`);
                alert('Results copied to clipboard!');
              }
            }}
            className="btn-secondary"
          >
            📤 Share
          </button>
        </div>

        {/* Powered By Notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Chrome Built-in AI (Gemini Nano)</p>
          <p className="mt-1">
            All AI processing happens locally in your browser 🔒
          </p>
        </div>
      </div>
    </div>
  );
}
