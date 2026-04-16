import { useState } from 'react';
import type { GameState, Player } from '../types';
import { ROLE_EMOJI, ROLE_LABELS } from '../types';
import type { Role } from '../types';

interface Props {
  player: Player | undefined;
  playerInfo: { username: string; role?: Role };
  gameState: GameState;
  onShowRole: () => void;
}

export default function PlayerBar({ player, playerInfo, gameState, onShowRole }: Props) {
  const [showPlayers, setShowPlayers] = useState(false);

  const aliveCount = gameState.players.filter((p) => p.isAlive).length;
  const totalCount = gameState.players.length;

  return (
    <>
      <div className="bg-night-800 border-b border-night-700 px-4 py-3 safe-bottom">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${player?.isAlive ? 'bg-green-400' : 'bg-red-500'}`} />
            <span className="text-amber-200 font-semibold text-sm">{playerInfo.username}</span>
            {playerInfo.role && (
              <span className="text-lg">{ROLE_EMOJI[playerInfo.role]}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPlayers(!showPlayers)}
              className="text-night-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-1"
            >
              👥 {aliveCount}/{totalCount}
            </button>

            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
              gameState.phase === 'NIGHT'
                ? 'bg-night-700 text-amber-400'
                : 'bg-amber-900 text-amber-200'
            }`}>
              {gameState.phase === 'NIGHT' ? `🌙 Nuit ${gameState.nightNumber}` : '☀️ Jour'}
            </div>

            {playerInfo.role && (
              <button
                onClick={onShowRole}
                className="text-xs text-amber-600 hover:text-amber-400 transition-colors"
              >
                Mon rôle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Players panel */}
      {showPlayers && (
        <div className="bg-night-800 border-b border-night-700 px-4 py-3">
          <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 text-sm p-2 rounded ${
                  p.isAlive ? 'opacity-100' : 'opacity-40 line-through'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${p.isAlive ? 'bg-green-400' : 'bg-red-500'}`} />
                <span className="text-amber-200 truncate">{p.username}</span>
                {p.role && (
                  <span className="text-xs">{ROLE_EMOJI[p.role as Role]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
