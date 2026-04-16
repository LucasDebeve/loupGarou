import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { gameState, playerInfo, dispatch, joinRoom } = useGame();

  // Restore session from localStorage if needed
  useEffect(() => {
    if (!playerInfo) {
      const playerId = localStorage.getItem('playerId');
      const sessionId = localStorage.getItem('sessionId');
      const username = localStorage.getItem('username');
      const sessionCode = localStorage.getItem('sessionCode');

      if (playerId && sessionId && username && sessionCode) {
        dispatch({
          type: 'SET_PLAYER_INFO',
          payload: { playerId, sessionId, username, sessionCode },
        });
        joinRoom(sessionId, playerId);
      } else {
        navigate('/');
      }
    } else {
      joinRoom(playerInfo.sessionId, playerInfo.playerId);
    }
  }, []);

  // Navigate when game starts
  useEffect(() => {
    if (gameState?.phase === 'NIGHT' || gameState?.phase === 'DAY') {
      navigate('/game');
    }
    if (gameState?.phase === 'ENDED') {
      navigate('/game');
    }
  }, [gameState?.phase]);

  const players = gameState?.players || [];
  const totalRoles = gameState
    ? Object.values(JSON.parse(localStorage.getItem('roleConfig') || '{}')).reduce(
        (a: number, b) => a + (b as number),
        0
      )
    : '?';

  return (
    <div className="min-h-screen night-overlay flex flex-col items-center p-4 pt-safe">
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mt-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-pulse-slow">🌙</div>
          <h1 className="text-title text-2xl mb-1">Salle d'attente</h1>
          {gameState && (
            <p className="text-amber-500 font-mono text-lg tracking-widest">
              Code : <span className="text-amber-300 font-bold">{gameState.code}</span>
            </p>
          )}
        </div>

        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-amber-300 font-semibold">
              Joueurs connectés
            </h2>
            <span className="bg-amber-500 text-night-900 text-sm font-bold px-3 py-1 rounded-full">
              {players.length}
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {players.length === 0 ? (
              <p className="text-night-500 text-sm text-center py-4">
                En attente de joueurs...
              </p>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-night-700 border transition-all ${
                    player.id === playerInfo?.playerId
                      ? 'border-amber-500'
                      : 'border-night-600'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      player.isConnected ? 'bg-green-400' : 'bg-night-500'
                    }`}
                  />
                  <span className="text-amber-100 flex-1">{player.username}</span>
                  {player.id === playerInfo?.playerId && (
                    <span className="text-amber-500 text-xs">(vous)</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card text-center">
          <div className="text-amber-500 text-sm animate-pulse">
            ⏳ En attente que l'administrateur lance la partie...
          </div>
          <p className="text-night-500 text-xs mt-2">
            Les rôles seront révélés au début de la partie
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-night-600 text-xs">
            Connecté en tant que{' '}
            <span className="text-amber-600">{playerInfo?.username}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
