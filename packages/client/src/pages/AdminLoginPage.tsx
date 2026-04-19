import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId.trim()}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur de connexion');
        return;
      }

      localStorage.setItem('adminSessionId', data.sessionId);
      localStorage.setItem('adminPassword', password);
      toast.success('Connecté en tant qu\'administrateur');
      navigate('/admin/dashboard');
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen night-overlay flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin')} className="text-night-500 hover:text-amber-400">
            ← Retour
          </button>
          <h1 className="text-title text-xl">Accès Admin</h1>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1.5">
                ID de session
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="UUID de la session..."
                required
              />
            </div>
            <div>
              <label className="block text-amber-400 text-sm font-medium mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Mot de passe admin..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
