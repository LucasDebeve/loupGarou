import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { getSocket } from '../../utils/socket';

export default function WitchAction() {
  const { gameState, playerInfo, sendNightAction } = useGame();
  const [wolfTarget, setWolfTarget] = useState<{ id: string; username: string } | null>(null);
  const [killTarget, setKillTarget] = useState<string | null>(null);
  const [decision, setDecision] = useState<'save' | 'kill' | 'pass' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showKillSelect, setShowKillSelect] = useState(false);

  const hasSavePotion = !playerInfo?.hasUsedSavePotion;
  const hasKillPotion = !playerInfo?.hasUsedKillPotion;

  const alivePlayers = gameState?.players.filter(
    (p) => p.isAlive && p.id !== playerInfo?.playerId
  ) ?? [];

  // Listen for wolf consensus to know the night's target
  useEffect(() => {
    const socket = getSocket();
    const handler = (data: { targetId: string; targetUsername: string }) => {
      setWolfTarget({ id: data.targetId, username: data.targetUsername });
    };
    socket.on('wolves:consensus', handler);

    // Also fetch from the admin endpoint or store it in context
    // For now, we show a hint that witch doesn't always know the target
    return () => { socket.off('wolves:consensus', handler); };
  }, []);

  const handleSubmit = () => {
    if (decision === 'save' && wolfTarget) {
      sendNightAction('WITCH_SAVE', wolfTarget.id);
    } else if (decision === 'kill' && killTarget) {
      sendNightAction('WITCH_KILL', killTarget);
    } else {
      sendNightAction('WITCH_PASS');
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="text-6xl mb-4">🧙‍♀️</div>
        <p className="text-green-400 font-semibold">Votre choix a été enregistré</p>
        <p className="text-night-500 text-sm mt-1">En attente de l'aube...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">🧙‍♀️</div>
        <h2 className="text-title text-2xl mb-1 text-green-400">La Sorcière</h2>
        <p className="text-green-300 text-sm">Utilisez vos potions ou passez</p>
      </div>

      {/* Wolf's target info */}
      <div className="card mb-4 border-red-900">
        <p className="text-red-400 text-xs font-semibold mb-1">🩸 VICTIME DES LOUPS CETTE NUIT</p>
        {wolfTarget ? (
          <p className="text-amber-200 font-semibold">{wolfTarget.username}</p>
        ) : (
          <p className="text-night-500 text-sm italic">En attente du vote des loups...</p>
        )}
      </div>

      {/* Potions */}
      <div className="space-y-3 mb-5">
        {hasSavePotion && wolfTarget && (
          <button
            onClick={() => setDecision(decision === 'save' ? null : 'save')}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              decision === 'save'
                ? 'border-green-500 bg-green-900/40'
                : 'border-night-600 bg-night-700 hover:border-green-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💊</span>
              <div>
                <p className="text-green-300 font-semibold">Potion de Vie</p>
                <p className="text-sm text-night-400">Sauver {wolfTarget.username}</p>
              </div>
            </div>
          </button>
        )}

        {!hasSavePotion && (
          <div className="p-4 rounded-lg border border-night-700 bg-night-800 opacity-40">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💊</span>
              <div>
                <p className="text-night-500 font-semibold line-through">Potion de Vie</p>
                <p className="text-xs text-night-600">Déjà utilisée</p>
              </div>
            </div>
          </div>
        )}

        {hasKillPotion && (
          <div>
            <button
              onClick={() => {
                setDecision(decision === 'kill' ? null : 'kill');
                setShowKillSelect(decision !== 'kill');
              }}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                decision === 'kill'
                  ? 'border-red-500 bg-red-900/40'
                  : 'border-night-600 bg-night-700 hover:border-red-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">☠️</span>
                <div>
                  <p className="text-red-300 font-semibold">Potion de Mort</p>
                  <p className="text-sm text-night-400">Éliminer n'importe qui</p>
                </div>
              </div>
            </button>

            {decision === 'kill' && (
              <div className="mt-2 space-y-1">
                {alivePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setKillTarget(p.id)}
                    className={`w-full text-left px-4 py-2 rounded border text-sm transition-all ${
                      killTarget === p.id
                        ? 'border-red-500 bg-red-900/40 text-red-200'
                        : 'border-night-600 bg-night-700 text-amber-200'
                    }`}
                  >
                    ☠️ {p.username}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasKillPotion && (
          <div className="p-4 rounded-lg border border-night-700 bg-night-800 opacity-40">
            <div className="flex items-center gap-3">
              <span className="text-2xl">☠️</span>
              <div>
                <p className="text-night-500 font-semibold line-through">Potion de Mort</p>
                <p className="text-xs text-night-600">Déjà utilisée</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setDecision('pass')}
          className={`w-full p-3 rounded-lg border text-left transition-all ${
            decision === 'pass'
              ? 'border-amber-500 bg-amber-900/20'
              : 'border-night-600 bg-night-700 hover:border-amber-700'
          }`}
        >
          <span className="text-amber-400">😴 Ne rien faire cette nuit</span>
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!decision || (decision === 'kill' && !killTarget)}
        className="btn-primary w-full"
      >
        ✅ Confirmer mon choix
      </button>
    </div>
  );
}
