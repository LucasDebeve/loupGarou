import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGame } from '../context/GameContext';

export default function JoinPage() {
  const { code: codeParam } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { dispatch, joinRoom } = useGame();

  const [sessionCode, setSessionCode] = useState(codeParam || '');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim() || !username.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/players/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: sessionCode.trim().toUpperCase(), username: username.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la connexion');
        return;
      }

      // Store player info
      localStorage.setItem('playerId', data.playerId);
      localStorage.setItem('sessionId', data.sessionId);
      localStorage.setItem('username', data.username);
      localStorage.setItem('sessionCode', data.sessionCode);

      dispatch({
        type: 'SET_PLAYER_INFO',
        payload: {
          playerId: data.playerId,
          sessionId: data.sessionId,
          username: data.username,
          sessionCode: data.sessionCode,
        },
      });

      joinRoom(data.sessionId, data.playerId);
      navigate('/lobby');
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen night-overlay flex flex-col items-center justify-center p-4">
      {/* Background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse-slow"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        {/* Moon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-200 rounded-full moon-effect flex items-center justify-center">
            <span className="text-4xl">🐺</span>
          </div>
        </div>

        <h1 className="text-title text-3xl text-center mb-2">Loup-Garou</h1>
        <p className="text-amber-500 text-center text-sm mb-8">Jeu de Formation</p>

        <div className="card">
          <h2 className="text-title text-xl mb-6 text-center">Rejoindre une partie</h2>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1.5">
                Code de session
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                className="input-field text-center text-2xl tracking-widest uppercase font-bold"
                placeholder="XXXXXX"
                maxLength={6}
                autoCapitalize="characters"
              />
            </div>

            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1.5">
                Votre pseudo
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Entrez votre prénom..."
                maxLength={20}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !sessionCode.trim() || !username.trim()}
              className="btn-primary w-full mt-2"
            >
              {loading ? '⏳ Connexion...' : '🚪 Rejoindre le village'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-night-600 hover:text-amber-600 text-sm transition-colors"
          >
            Créer une partie (Admin) →
          </button>
        </div>
      </div>
    </div>
  );
}
