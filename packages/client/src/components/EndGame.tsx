import { useGame } from '../context/GameContext';
import type { Role } from '../types';
import { ROLE_EMOJI, ROLE_LABELS } from '../types';

export default function EndGame() {
  const { winResult, gameState, playerInfo } = useGame();

  if (!winResult || !gameState) {
    return (
      <div className="min-h-screen night-overlay flex items-center justify-center">
        <div className="text-amber-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  const myPlayer = gameState.players.find((p) => p.id === playerInfo?.playerId);
  const isWinner =
    (winResult.winner === 'VILLAGE' && myPlayer?.role !== 'WEREWOLF') ||
    (winResult.winner === 'WEREWOLVES' && myPlayer?.role === 'WEREWOLF') ||
    (winResult.winner === 'LOVERS' && myPlayer?.loverId);

  const winnerConfig = {
    VILLAGE: { emoji: '🏘️', label: 'Le Village gagne !', color: 'text-green-400', bg: 'from-green-950 to-night-900' },
    WEREWOLVES: { emoji: '🐺', label: 'Les Loups-Garous gagnent !', color: 'text-red-400', bg: 'from-red-950 to-night-900' },
    LOVERS: { emoji: '💘', label: 'Les Amoureux gagnent !', color: 'text-pink-400', bg: 'from-pink-950 to-night-900' },
  }[winResult.winner];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${winnerConfig.bg} flex flex-col items-center p-4 pt-10 animate-fade-in`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce">{winnerConfig.emoji}</div>
          <h1 className={`text-title text-3xl mb-2 ${winnerConfig.color}`}>
            {winnerConfig.label}
          </h1>
          <p className="text-amber-400 text-sm">{winResult.reason}</p>

          <div className={`mt-4 inline-block px-6 py-2 rounded-full text-lg font-bold ${
            isWinner
              ? 'bg-amber-500 text-night-900'
              : 'bg-night-700 text-night-400'
          }`}>
            {isWinner ? '🎉 Vous avez gagné !' : '💀 Vous avez perdu'}
          </div>
        </div>

        {/* All roles reveal */}
        <div className="card mb-4">
          <h2 className="text-amber-300 font-semibold mb-4 text-center">Révélation des rôles</h2>
          <div className="space-y-2">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  p.isAlive
                    ? 'bg-night-700 border border-night-600'
                    : 'bg-night-800 border border-night-700 opacity-60'
                }`}
              >
                <span className="text-2xl">
                  {p.role ? ROLE_EMOJI[p.role as Role] : '❓'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${p.isAlive ? 'text-amber-200' : 'text-night-400 line-through'}`}>
                      {p.username}
                    </span>
                    {p.id === playerInfo?.playerId && (
                      <span className="text-xs text-amber-600">(vous)</span>
                    )}
                    {p.loverId && <span className="text-sm">💘</span>}
                  </div>
                  <span className="text-xs text-night-400">
                    {p.role ? ROLE_LABELS[p.role as Role] : 'Inconnu'}
                  </span>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${
                  p.isAlive
                    ? 'bg-green-900 text-green-400'
                    : 'bg-red-900 text-red-400'
                }`}>
                  {p.isAlive ? 'Vivant' : 'Mort'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game log */}
        <div className="card">
          <h2 className="text-amber-300 font-semibold mb-3">📜 Chronique de la partie</h2>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {gameState.gameLogs.map((log) => (
              <div key={log.id} className="text-xs text-night-400 flex items-start gap-2">
                <span className="text-amber-700 shrink-0">
                  N{log.nightNumber}·{log.phase === 'NIGHT' ? '🌙' : '☀️'}
                </span>
                <span>{formatLog(log.eventType, log.data as LogData, gameState.players)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="btn-secondary"
          >
            🏠 Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}

interface LogData {
  playerId?: string;
  player1Id?: string;
  player2Id?: string;
  message?: string;
  cause?: string;
  byVote?: boolean;
  reason?: string;
  hunterId?: string;
  targetId?: string;
}

function formatLog(eventType: string, data: LogData, players: { id: string; username: string }[]) {
  const name = (id?: string) => players.find((p) => p.id === id)?.username ?? '?';
  switch (eventType) {
    case 'GAME_STARTED': return '🎮 La partie a commencé';
    case 'PLAYER_DIED': return `☠️ ${name(data.playerId)} est mort${data.cause === 'WITCH_KILL' ? ' (potion de la sorcière)' : ' (loups-garous)'}`;
    case 'PLAYER_SAVED': return `💊 ${name(data.playerId)} a été sauvé par la sorcière`;
    case 'PLAYER_ELIMINATED': return `⚖️ ${name(data.playerId)} a été éliminé par le village`;
    case 'LOVERS_LINKED': return `💘 ${name(data.player1Id)} et ${name(data.player2Id)} sont tombés amoureux`;
    case 'LOVER_DIED': return `💔 ${name(data.playerId)} est mort de chagrin`;
    case 'HUNTER_SHOT': return `🏹 Le chasseur a emporté ${name(data.targetId)}`;
    case 'GAME_ENDED': return `🏁 ${data.reason}`;
    default: return eventType;
  }
}
