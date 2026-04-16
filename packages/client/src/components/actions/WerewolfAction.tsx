import { useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function WerewolfAction() {
  const { gameState, playerInfo, wolves, sendNightAction } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const alivePlayers = gameState?.players.filter(
    (p) => p.isAlive && p.id !== playerInfo?.playerId && !wolves.some((w) => w.id === p.id)
  ) ?? [];

  const handleVote = () => {
    if (!selectedTarget) return;
    sendNightAction('WOLF_VOTE', selectedTarget);
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">🐺</div>
        <h2 className="text-title text-2xl mb-1 text-red-400">Nuit des Loups</h2>
        <p className="text-red-300 text-sm">Choisissez votre victime</p>
      </div>

      {/* Fellow wolves */}
      {wolves.length > 1 && (
        <div className="card mb-4 border-red-900">
          <p className="text-red-400 text-xs font-semibold mb-2">🐺 VOS COMPLICES</p>
          <div className="flex flex-wrap gap-2">
            {wolves.filter((w) => w.id !== playerInfo?.playerId).map((w) => (
              <span key={w.id} className="bg-red-900 text-red-300 text-sm px-3 py-1 rounded-full">
                {w.username}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-4">
        <p className="text-amber-400 text-sm mb-3">Victimes possibles :</p>
        <div className="space-y-2">
          {alivePlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedTarget(p.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedTarget === p.id
                  ? 'bg-red-900 border-red-500 text-red-200'
                  : 'bg-night-700 border-night-600 text-amber-200 hover:border-red-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedTarget === p.id ? 'border-red-400 bg-red-600' : 'border-night-500'
                }`}>
                  {selectedTarget === p.id && <span className="w-2 h-2 bg-white rounded-full" />}
                </span>
                {p.username}
              </span>
            </button>
          ))}
        </div>
      </div>

      {submitted ? (
        <div className="card text-center border-red-900">
          <p className="text-red-400">🗳️ Vote soumis</p>
          <p className="text-night-500 text-xs mt-1">En attente des autres loups...</p>
        </div>
      ) : (
        <button
          onClick={handleVote}
          disabled={!selectedTarget}
          className="btn-danger w-full"
        >
          🩸 Désigner la victime
        </button>
      )}
    </div>
  );
}
