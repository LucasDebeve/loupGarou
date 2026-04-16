import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { RoleConfig } from '../types';
import { ROLE_EMOJI, ROLE_LABELS } from '../types';

const DEFAULT_CONFIG: RoleConfig = {
  VILLAGER: 4,
  WEREWOLF: 2,
  SEER: 1,
  WITCH: 1,
  HUNTER: 1,
  CUPID: 0,
  LITTLE_GIRL: 0,
};

const ROLE_ORDER: (keyof RoleConfig)[] = [
  'VILLAGER', 'WEREWOLF', 'SEER', 'WITCH', 'HUNTER', 'CUPID', 'LITTLE_GIRL',
];

export default function AdminCreatePage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleConfig, setRoleConfig] = useState<RoleConfig>({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(false);

  const totalPlayers = Object.values(roleConfig).reduce((a, b) => a + b, 0);

  const adjustRole = (role: keyof RoleConfig, delta: number) => {
    const newVal = Math.max(0, roleConfig[role] + delta);
    // Max 1 for most special roles (except villager and werewolf)
    const maxVal = role === 'VILLAGER' ? 20 : role === 'WEREWOLF' ? 5 : 1;
    setRoleConfig({ ...roleConfig, [role]: Math.min(newVal, maxVal) });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 4) {
      toast.error('Mot de passe trop court (min 4 caractères)');
      return;
    }
    if (totalPlayers < 4) {
      toast.error('Il faut au moins 4 joueurs');
      return;
    }
    if (roleConfig.WEREWOLF === 0) {
      toast.error('Il faut au moins 1 loup-garou');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password, roleConfig }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la création');
        return;
      }

      localStorage.setItem('adminSessionId', data.sessionId);
      localStorage.setItem('adminPassword', password);
      localStorage.setItem('adminSessionCode', data.code);
      localStorage.setItem('roleConfig', JSON.stringify(roleConfig));

      toast.success(`Session créée ! Code : ${data.code}`);
      navigate('/admin/dashboard');
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen night-overlay p-4 pb-safe">
      <div className="max-w-md mx-auto pt-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-night-500 hover:text-amber-400">
            ← Retour
          </button>
          <h1 className="text-title text-2xl">Créer une partie</h1>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          {/* Admin password */}
          <div className="card">
            <h2 className="text-amber-300 font-semibold mb-4">🔐 Mot de passe administrateur</h2>
            <div className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Mot de passe admin..."
                minLength={4}
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirmer le mot de passe..."
                required
              />
            </div>
          </div>

          {/* Role config */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-amber-300 font-semibold">🎭 Composition des rôles</h2>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                totalPlayers >= 4 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
              }`}>
                {totalPlayers} joueurs
              </span>
            </div>

            <div className="space-y-3">
              {ROLE_ORDER.map((role) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{ROLE_EMOJI[role]}</span>
                  <span className="text-amber-200 flex-1 text-sm">{ROLE_LABELS[role]}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustRole(role, -1)}
                      className="w-8 h-8 rounded-lg bg-night-700 border border-night-600 text-amber-400 hover:bg-night-600 transition-colors flex items-center justify-center font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-amber-100 font-bold">
                      {roleConfig[role]}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustRole(role, 1)}
                      className="w-8 h-8 rounded-lg bg-night-700 border border-night-600 text-amber-400 hover:bg-night-600 transition-colors flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-night-600">
              <button
                type="button"
                onClick={() => setRoleConfig({ ...DEFAULT_CONFIG })}
                className="text-xs text-night-500 hover:text-amber-500 transition-colors"
              >
                ↺ Réinitialiser les rôles par défaut
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || totalPlayers < 4 || roleConfig.WEREWOLF === 0}
            className="btn-primary w-full text-lg"
          >
            {loading ? '⏳ Création...' : '🎮 Créer la session'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-night-500 hover:text-amber-500 text-sm transition-colors"
          >
            Rejoindre une session existante →
          </button>
        </div>
      </div>
    </div>
  );
}
