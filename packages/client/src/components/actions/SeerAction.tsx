import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import type { Role } from '../../types';
import { ROLE_EMOJI, ROLE_LABELS } from '../../types';

export default function SeerAction() {
  const { gameState, playerInfo, seerResult, sendNightAction } = useGame();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const alivePlayers = gameState?.players.filter(
    (p) => p.isAlive && p.id !== playerInfo?.playerId
  ) ?? [];

  const handleInspect = () => {
    if (!selectedTarget) return;
    sendNightAction('SEER_INSPECT', selectedTarget);
    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">🔮</div>
        <h2 className="text-title text-2xl mb-1 text-purple-400">Vision nocturne</h2>
        <p className="text-purple-300 text-sm">Inspectez l'identité d'un joueur</p>
      </div>

      {seerResult ? (
        <div className="card border-purple-800 text-center animate-slide-up">
          <p className="text-purple-300 text-sm mb-3">Votre vision révèle...</p>
          <div className="text-5xl mb-2">{ROLE_EMOJI[seerResult.role as Role]}</div>
          <p className="text-amber-200 font-bold text-lg">{seerResult.username}</p>
          <p className="text-purple-400 text-sm mt-1">
            est : <span className="text-amber-300 font-semibold">
              {ROLE_LABELS[seerResult.role as Role]}
            </span>
          </p>
          {seerResult.role === 'WEREWOLF' && (
            <div className="mt-3 bg-red-900/50 rounded-lg p-2 text-red-300 text-sm">
              ⚠️ C'est un loup-garou ! Soyez prudente...
            </div>
          )}
        </div>
      ) : submitted ? (
        <div className="card text-center border-purple-900">
          <div className="animate-pulse text-4xl mb-2">🔮</div>
          <p className="text-purple-400">Vision en cours...</p>
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <p className="text-amber-400 text-sm mb-3">Qui voulez-vous inspecter ?</p>
            <div className="space-y-2">
              {alivePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedTarget(p.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTarget === p.id
                      ? 'bg-purple-900 border-purple-500 text-purple-200'
                      : 'bg-night-700 border-night-600 text-amber-200 hover:border-purple-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedTarget === p.id ? 'border-purple-400 bg-purple-600' : 'border-night-500'
                    }`}>
                      {selectedTarget === p.id && <span className="w-2 h-2 bg-white rounded-full" />}
                    </span>
                    {p.username}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleInspect}
            disabled={!selectedTarget}
            className="w-full py-3 px-6 bg-purple-800 hover:bg-purple-700 text-purple-100 font-bold rounded-lg transition-all disabled:opacity-50"
          >
            🔮 Inspecter
          </button>
        </>
      )}
    </div>
  );
}
