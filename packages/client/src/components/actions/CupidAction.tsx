import { useState } from 'react';
import { useGame } from '../../context/GameContext';

export default function CupidAction() {
  const { gameState, playerInfo, sendNightAction } = useGame();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const alivePlayers = gameState?.players.filter((p) => p.isAlive) ?? [];

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < 2) {
      setSelected([...selected, id]);
    }
  };

  const handleLink = () => {
    if (selected.length !== 2) return;
    sendNightAction('CUPID_LINK', selected[0], selected[1]);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="text-6xl mb-4">💘</div>
        <p className="text-pink-400 font-semibold">Les amoureux sont liés !</p>
        <p className="text-night-500 text-sm mt-1">Le destin est scellé...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">💘</div>
        <h2 className="text-title text-2xl mb-1 text-pink-400">Cupidon</h2>
        <p className="text-pink-300 text-sm">Choisissez deux joueurs à lier par l'amour</p>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-amber-400 text-sm">Sélectionnez 2 joueurs :</p>
          <span className="text-pink-400 text-sm">{selected.length}/2</span>
        </div>
        <div className="space-y-2">
          {alivePlayers.map((p) => {
            const isSelected = selected.includes(p.id);
            const isMe = p.id === playerInfo?.playerId;
            return (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                disabled={!isSelected && selected.length >= 2}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-pink-900/40 border-pink-500 text-pink-200'
                    : 'bg-night-700 border-night-600 text-amber-200 hover:border-pink-700 disabled:opacity-40'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs shrink-0 ${
                    isSelected ? 'border-pink-400 bg-pink-600' : 'border-night-500'
                  }`}>
                    {isSelected && '♥'}
                  </span>
                  {p.username}
                  {isMe && <span className="text-xs text-amber-600">(vous)</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected.length === 2 && (
        <div className="card mb-4 border-pink-900 text-center animate-slide-up">
          <p className="text-pink-300 text-sm">
            💘 {alivePlayers.find((p) => p.id === selected[0])?.username}
            {' & '}
            {alivePlayers.find((p) => p.id === selected[1])?.username}
          </p>
          <p className="text-night-500 text-xs mt-1">seront liés par l'amour pour toujours</p>
        </div>
      )}

      <button
        onClick={handleLink}
        disabled={selected.length !== 2}
        className="w-full py-3 px-6 bg-pink-800 hover:bg-pink-700 text-pink-100 font-bold rounded-lg transition-all disabled:opacity-50"
      >
        💘 Unir les amoureux
      </button>
    </div>
  );
}
