import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import RoleReveal from '../components/RoleReveal';
import NightPhase from '../components/NightPhase';
import DayPhase from '../components/DayPhase';
import EndGame from '../components/EndGame';
import PlayerBar from '../components/PlayerBar';

export default function GamePage() {
  const navigate = useNavigate();
  const { gameState, playerInfo, dispatch, joinRoom, winResult } = useGame();
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [showRole, setShowRole] = useState(false);

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

  // Show role reveal when role is first assigned
  useEffect(() => {
    if (playerInfo?.role && !roleRevealed) {
      const wasRevealed = localStorage.getItem(`role_revealed_${playerInfo.playerId}`);
      if (!wasRevealed) {
        setShowRole(true);
      } else {
        setRoleRevealed(true);
      }
    }
  }, [playerInfo?.role]);

  const handleRoleRevealed = () => {
    if (playerInfo?.playerId) {
      localStorage.setItem(`role_revealed_${playerInfo.playerId}`, '1');
    }
    setShowRole(false);
    setRoleRevealed(true);
  };

  if (!gameState || !playerInfo) {
    return (
      <div className="min-h-screen night-overlay flex items-center justify-center">
        <div className="text-amber-400 animate-pulse text-center">
          <div className="text-4xl mb-3">🌙</div>
          <p>Connexion en cours...</p>
        </div>
      </div>
    );
  }

  // Show role reveal screen first
  if (showRole && playerInfo.role) {
    return <RoleReveal role={playerInfo.role} onContinue={handleRoleRevealed} />;
  }

  // Game ended
  if (gameState.phase === 'ENDED' || winResult) {
    return <EndGame />;
  }

  const myPlayer = gameState.players.find((p) => p.id === playerInfo.playerId);
  const isAlive = myPlayer?.isAlive ?? true;

  return (
    <div className="min-h-screen night-overlay flex flex-col">
      <PlayerBar
        player={myPlayer}
        playerInfo={playerInfo}
        gameState={gameState}
        onShowRole={() => setShowRole(true)}
      />

      <main className="flex-1 p-4 pt-2">
        {gameState.phase === 'NIGHT' && (
          <NightPhase isAlive={isAlive} />
        )}
        {gameState.phase === 'DAY' && (
          <DayPhase isAlive={isAlive} />
        )}
      </main>
    </div>
  );
}
