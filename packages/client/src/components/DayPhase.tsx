import { useGame } from '../context/GameContext';
import type { Role } from '../types';
import { ROLE_EMOJI, ROLE_LABELS } from '../types';

interface Props {
  isAlive: boolean;
}

export default function DayPhase({ isAlive }: Props) {
  const { gameState, playerInfo } = useGame();

  const deadPlayers = gameState?.players.filter((p) => !p.isAlive) ?? [];

  if (!isAlive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="text-6xl mb-4">👻</div>
        <h2 className="text-title text-2xl mb-2 text-amber-300">Vous avez été éliminé</h2>
        <p className="text-amber-600 text-sm mb-4">
          Votre rôle était : {playerInfo?.role ? `${ROLE_EMOJI[playerInfo.role]} ${ROLE_LABELS[playerInfo.role]}` : '?'}
        </p>
        <p className="text-night-500 text-sm">Observez la suite en silence...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">☀️</div>
        <h2 className="text-title text-2xl mb-1">Le jour se lève</h2>
        <p className="text-amber-500 text-sm">Débat et vote en présentiel</p>
      </div>

      <div className="card mb-4">
        <h3 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
          📢 Débat du village
        </h3>
        <p className="text-amber-200 text-sm leading-relaxed">
          Discutez avec les autres joueurs pour identifier les loups-garous.
          L'administrateur enregistrera le résultat du vote une fois le débat terminé.
        </p>
        <div className="mt-3 bg-night-700 rounded-lg p-3 text-sm text-amber-500 border border-night-600">
          ⏳ En attente du résultat du vote administrateur...
        </div>
      </div>

      {deadPlayers.length > 0 && (
        <div className="card">
          <h3 className="text-amber-300 font-semibold mb-3">☠️ Joueurs éliminés</h3>
          <div className="space-y-2">
            {deadPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 bg-night-700 rounded-lg opacity-70"
              >
                <span className="text-xl">{p.role ? ROLE_EMOJI[p.role as Role] : '💀'}</span>
                <div>
                  <span className="text-amber-200 line-through">{p.username}</span>
                  {p.role && (
                    <span className="ml-2 text-xs text-night-400">
                      ({ROLE_LABELS[p.role as Role]})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game log */}
      {gameState && gameState.gameLogs.length > 0 && (
        <div className="mt-4 card">
          <h3 className="text-amber-300 font-semibold mb-3">📜 Journal</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {[...gameState.gameLogs].reverse().map((log) => (
              <div key={log.id} className="text-xs text-night-400 flex items-start gap-2">
                <span className="text-amber-700 shrink-0">
                  N{log.nightNumber}·{log.phase === 'NIGHT' ? '🌙' : '☀️'}
                </span>
                <span>{formatLogEntry(log.eventType, log.data as LogData, gameState.players)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
}

function formatLogEntry(eventType: string, data: LogData, players: { id: string; username: string }[]) {
  const findPlayer = (id?: string) => players.find((p) => p.id === id)?.username ?? '?';
  switch (eventType) {
    case 'GAME_STARTED': return '🎮 La partie a commencé';
    case 'PLAYER_DIED': return `☠️ ${findPlayer(data.playerId)} est mort${data.cause === 'WITCH_KILL' ? ' (potion)' : ''}`;
    case 'PLAYER_SAVED': return `💊 ${findPlayer(data.playerId)} a été sauvé`;
    case 'PLAYER_ELIMINATED': return `⚖️ ${findPlayer(data.playerId)} a été éliminé par le village`;
    case 'LOVERS_LINKED': return `💘 Deux joueurs sont tombés amoureux`;
    case 'LOVER_DIED': return `💔 ${findPlayer(data.playerId)} est mort de chagrin`;
    case 'HUNTER_SHOT': return `🏹 Le chasseur a emporté quelqu'un`;
    case 'GAME_ENDED': return `🏁 Fin de partie : ${data.reason}`;
    default: return eventType;
  }
}
