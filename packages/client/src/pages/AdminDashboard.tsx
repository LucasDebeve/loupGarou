import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket } from '../utils/socket';
import type { Player, Role } from '../types';
import { ROLE_EMOJI, ROLE_LABELS } from '../types';

interface AdminData {
  session: {
    id: string;
    code: string;
    phase: string;
    nightNumber: number;
    roleConfig: Record<string, number>;
  };
  players: Player[];
  currentNightActions: NightActionData[];
  allNightActions: NightActionData[];
  gameLogs: GameLogData[];
}

interface NightActionData {
  id: string;
  playerId: string;
  nightNumber: number;
  actionType: string;
  targetId?: string | null;
  target2Id?: string | null;
}

interface GameLogData {
  id: string;
  nightNumber: number;
  phase: string;
  eventType: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface WolfConsensus {
  targetId: string;
  targetUsername: string;
  votes: number;
  totalWolves: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [wolfConsensus, setWolfConsensus] = useState<WolfConsensus | null>(null);
  const [killedPlayerId, setKilledPlayerId] = useState<string | null>(null);
  const [savedPlayerId, setSavedPlayerId] = useState<string | null>(null);
  const [dayEliminateId, setDayEliminateId] = useState<string | null>(null);
  const [hunterTarget, setHunterTarget] = useState<string | null>(null);
  const [hunterPlayerId, setHunterPlayerId] = useState<string | null>(null);
  const [showHunterPanel, setShowHunterPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'players' | 'log'>('actions');
  const [littleGirlEvents, setLittleGirlEvents] = useState<{ playerId: string; caught: boolean }[]>([]);

  const sessionId = localStorage.getItem('adminSessionId') || '';
  const password = localStorage.getItem('adminPassword') || '';

  const fetchData = useCallback(async () => {
    if (!sessionId || !password) {
      navigate('/admin');
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/night-actions/${sessionId}?adminPassword=${encodeURIComponent(password)}`
      );
      if (!res.ok) {
        if (res.status === 401) navigate('/admin');
        return;
      }
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [sessionId, password]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('admin:join', { sessionId });

    socket.on('wolves:consensus', (d: WolfConsensus) => {
      setWolfConsensus(d);
      setKilledPlayerId(d.targetId);
      toast(`🐺 Consensus des loups : ${d.targetUsername}`, { icon: '🩸' });
    });

    socket.on('admin:action:received', () => {
      fetchData();
    });

    socket.on('game:state', () => fetchData());

    socket.on('littlegirl:peeked', (d: { playerId: string; caught: boolean }) => {
      setLittleGirlEvents((prev) => [...prev, d]);
      const playerName = data?.players.find((p) => p.id === d.playerId)?.username ?? '?';
      if (d.caught) {
        toast.error(`👁️ La Petite Fille (${playerName}) a été DÉCOUVERTE !`);
      } else {
        toast(`👁️ La Petite Fille (${playerName}) a espionné sans être découverte`);
      }
    });

    socket.on('phase:changed', () => {
      fetchData();
      setWolfConsensus(null);
      setKilledPlayerId(null);
      setSavedPlayerId(null);
      setDayEliminateId(null);
      setLittleGirlEvents([]);
    });

    return () => {
      socket.off('wolves:consensus');
      socket.off('admin:action:received');
      socket.off('game:state');
      socket.off('littlegirl:peeked');
      socket.off('phase:changed');
    };
  }, [sessionId, data]);

  const handleAssignRoles = async () => {
    const res = await fetch('/api/admin/assign-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, adminPassword: password }),
    });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    toast.success('Rôles assignés ! La partie commence.');
    await fetchData();
  };

  const handleResolveNight = async () => {
    const res = await fetch('/api/admin/resolve-night', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, adminPassword: password, killedPlayerId, savedPlayerId }),
    });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    toast.success('Nuit résolue ! Le jour se lève.');
    if (d.deadPlayerIds?.length > 0 && data) {
      const deadNames = d.deadPlayerIds.map((id: string) =>
        data.players.find((p) => p.id === id)?.username ?? id
      ).join(', ');
      toast.error(`☠️ Morts cette nuit : ${deadNames}`, { duration: 6000 });
    }
    // Check if hunter died
    const hunterDied = data?.players.find(
      (p) => p.role === 'HUNTER' && d.deadPlayerIds?.includes(p.id)
    );
    if (hunterDied) {
      setHunterPlayerId(hunterDied.id);
      setShowHunterPanel(true);
    }
    await fetchData();
  };

  const handleEliminatePlayer = async () => {
    if (!dayEliminateId) return;
    const res = await fetch('/api/admin/eliminate-player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, adminPassword: password, playerId: dayEliminateId }),
    });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    const name = data?.players.find((p) => p.id === dayEliminateId)?.username;
    toast.success(`⚖️ ${name} a été éliminé par le village`);

    // Check if hunter
    const eliminated = data?.players.find((p) => p.id === dayEliminateId);
    if (eliminated?.role === 'HUNTER') {
      setHunterPlayerId(dayEliminateId);
      setShowHunterPanel(true);
    }
    setDayEliminateId(null);
    await fetchData();
  };

  const handleHunterShoot = async () => {
    if (!hunterTarget || !hunterPlayerId) return;
    const res = await fetch('/api/admin/hunter-shoot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, adminPassword: password, hunterId: hunterPlayerId, targetId: hunterTarget }),
    });
    const d = await res.json();
    if (!res.ok) { toast.error(d.error); return; }
    toast.success('🏹 Le chasseur a tiré !');
    setShowHunterPanel(false);
    setHunterTarget(null);
    setHunterPlayerId(null);
    await fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen night-overlay flex items-center justify-center">
        <div className="text-amber-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen night-overlay flex items-center justify-center p-4">
        <div className="card text-center">
          <p className="text-red-400">Session introuvable</p>
          <button onClick={() => navigate('/admin')} className="btn-secondary mt-4">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const { session, players, currentNightActions, gameLogs } = data;
  const alivePlayers = players.filter((p) => p.isAlive);
  const deadPlayers = players.filter((p) => !p.isAlive);

  const getPlayerName = (id?: string | null) =>
    players.find((p) => p.id === id)?.username ?? '?';

  const actionTypeLabel: Record<string, string> = {
    WOLF_VOTE: '🐺 Vote loup',
    SEER_INSPECT: '🔮 Inspection',
    WITCH_SAVE: '💊 Potion vie',
    WITCH_KILL: '☠️ Potion mort',
    WITCH_PASS: '😴 Passe',
    CUPID_LINK: '💘 Amoureux',
    LITTLE_GIRL_PEEK: '👁️ Espionnage',
    HUNTER_SHOOT: '🏹 Tir chasseur',
  };

  return (
    <div className="min-h-screen night-overlay pb-safe">
      {/* Header */}
      <div className="bg-night-800 border-b border-night-700 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-title text-lg text-amber-300">🐺 Admin</h1>
            <p className="text-xs text-amber-600">
              Code : <span className="font-mono font-bold text-amber-400">{session.code}</span>
              {' · '}
              {session.phase === 'NIGHT' ? `🌙 Nuit ${session.nightNumber}` : session.phase === 'DAY' ? '☀️ Jour' : session.phase}
            </p>
          </div>
          <div className="text-right text-xs text-night-500">
            <div>{alivePlayers.length} vivants</div>
            <div>{deadPlayers.length} morts</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Share link */}
        {session.phase === 'LOBBY' && (
          <div className="card mb-4 border-amber-800">
            <p className="text-amber-300 text-sm font-semibold mb-2">📲 Lien de partage</p>
            <div className="bg-night-700 rounded-lg p-3 font-mono text-amber-400 text-sm break-all">
              {window.location.origin}/join/{session.code}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${session.code}`);
                toast.success('Lien copié !');
              }}
              className="btn-secondary text-sm mt-2 w-full"
            >
              📋 Copier le lien
            </button>
          </div>
        )}

        {/* Lobby controls */}
        {session.phase === 'LOBBY' && (
          <div className="card mb-4">
            <h2 className="text-amber-300 font-semibold mb-3">
              👥 Joueurs dans le lobby ({players.length})
            </h2>
            <div className="space-y-2 mb-4">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-night-700 rounded-lg text-sm">
                  <div className={`w-2 h-2 rounded-full ${p.isConnected ? 'bg-green-400' : 'bg-night-500'}`} />
                  <span className="text-amber-200">{p.username}</span>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-night-500 text-sm text-center py-3">En attente de joueurs...</p>
              )}
            </div>
            <button
              onClick={handleAssignRoles}
              disabled={players.length < 4}
              className="btn-primary w-full"
            >
              🎭 Assigner les rôles et démarrer
            </button>
            {players.length < 4 && (
              <p className="text-night-500 text-xs text-center mt-2">
                Il faut au moins 4 joueurs (actuellement {players.length})
              </p>
            )}
          </div>
        )}

        {/* Hunter panel */}
        {showHunterPanel && (
          <div className="card mb-4 border-orange-700 animate-slide-up">
            <h2 className="text-orange-400 font-semibold mb-3">🏹 Le Chasseur doit tirer !</h2>
            <p className="text-amber-300 text-sm mb-3">Choisissez sa cible :</p>
            <div className="space-y-2 mb-4">
              {alivePlayers.filter((p) => p.id !== hunterPlayerId).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setHunterTarget(p.id)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    hunterTarget === p.id
                      ? 'border-orange-500 bg-orange-900/40 text-orange-200'
                      : 'border-night-600 bg-night-700 text-amber-200'
                  }`}
                >
                  🎯 {p.username}
                </button>
              ))}
            </div>
            <button onClick={handleHunterShoot} disabled={!hunterTarget} className="btn-danger w-full">
              🏹 Confirmer le tir
            </button>
          </div>
        )}

        {/* Tabs */}
        {session.phase !== 'LOBBY' && session.phase !== 'ENDED' && (
          <>
            <div className="flex gap-1 mb-4 bg-night-800 p-1 rounded-lg">
              {(['actions', 'players', 'log'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === tab
                      ? 'bg-amber-500 text-night-900'
                      : 'text-night-400 hover:text-amber-400'
                  }`}
                >
                  {tab === 'actions' ? '🎬 Actions' : tab === 'players' ? '👥 Joueurs' : '📜 Journal'}
                </button>
              ))}
            </div>

            {/* Night phase controls */}
            {activeTab === 'actions' && session.phase === 'NIGHT' && (
              <div className="space-y-4">
                {/* Night actions summary */}
                <div className="card">
                  <h2 className="text-amber-300 font-semibold mb-3">
                    🌙 Actions de la nuit {session.nightNumber}
                  </h2>

                  {wolfConsensus && (
                    <div className="mb-3 bg-red-900/30 border border-red-800 rounded-lg p-3">
                      <p className="text-red-400 text-xs font-semibold">🐺 CONSENSUS DES LOUPS</p>
                      <p className="text-amber-200 font-bold">{wolfConsensus.targetUsername}</p>
                      <p className="text-xs text-night-400">
                        {wolfConsensus.votes}/{wolfConsensus.totalWolves} votes
                      </p>
                    </div>
                  )}

                  {littleGirlEvents.length > 0 && (
                    <div className="mb-3 bg-blue-900/30 border border-blue-800 rounded-lg p-3">
                      <p className="text-blue-400 text-xs font-semibold">👁️ PETITE FILLE</p>
                      {littleGirlEvents.map((e, i) => (
                        <p key={i} className={`text-sm ${e.caught ? 'text-red-300' : 'text-blue-300'}`}>
                          {getPlayerName(e.playerId)}: {e.caught ? '❌ Découverte' : '✅ Non découverte'}
                        </p>
                      ))}
                    </div>
                  )}

                  {currentNightActions.length === 0 ? (
                    <p className="text-night-500 text-sm text-center py-3">
                      En attente des actions...
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {currentNightActions.map((action) => (
                        <div key={action.id} className="flex items-center gap-3 p-2 bg-night-700 rounded-lg text-sm">
                          <span className="text-amber-500 shrink-0">
                            {actionTypeLabel[action.actionType] ?? action.actionType}
                          </span>
                          <span className="text-night-400">→</span>
                          <span className="text-amber-200">
                            {getPlayerName(action.playerId)}
                            {action.targetId && ` → ${getPlayerName(action.targetId)}`}
                            {action.target2Id && ` & ${getPlayerName(action.target2Id)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Night resolution */}
                <div className="card">
                  <h2 className="text-amber-300 font-semibold mb-3">⚙️ Résolution de la nuit</h2>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-amber-400 mb-1">
                        ☠️ Victime des loups (laisser vide = personne)
                      </label>
                      <select
                        value={killedPlayerId || ''}
                        onChange={(e) => setKilledPlayerId(e.target.value || null)}
                        className="input-field"
                      >
                        <option value="">-- Aucune victime --</option>
                        {alivePlayers.map((p) => (
                          <option key={p.id} value={p.id}>{p.username}</option>
                        ))}
                      </select>
                    </div>

                    {killedPlayerId && (
                      <div>
                        <label className="block text-sm text-amber-400 mb-1">
                          💊 Sauvé par la sorcière ?
                        </label>
                        <select
                          value={savedPlayerId || ''}
                          onChange={(e) => setSavedPlayerId(e.target.value || null)}
                          className="input-field"
                        >
                          <option value="">-- Non sauvé --</option>
                          <option value={killedPlayerId}>
                            ✅ Oui, sauver {getPlayerName(killedPlayerId)}
                          </option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleResolveNight}
                    className="btn-primary w-full mt-4"
                  >
                    ☀️ Terminer la nuit → Passer au jour
                  </button>
                </div>
              </div>
            )}

            {/* Day phase controls */}
            {activeTab === 'actions' && session.phase === 'DAY' && (
              <div className="card">
                <h2 className="text-amber-300 font-semibold mb-3">☀️ Vote du village</h2>
                <p className="text-amber-500 text-sm mb-4">
                  Après le débat en présentiel, enregistrez le joueur éliminé :
                </p>

                <div className="space-y-2 mb-4">
                  {alivePlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setDayEliminateId(p.id === dayEliminateId ? null : p.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                        dayEliminateId === p.id
                          ? 'border-red-500 bg-red-900/40 text-red-200'
                          : 'border-night-600 bg-night-700 text-amber-200 hover:border-red-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {p.role && <span>{ROLE_EMOJI[p.role as Role]}</span>}
                          <span>{p.username}</span>
                        </div>
                        {p.role && (
                          <span className="text-xs text-night-400">{ROLE_LABELS[p.role as Role]}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleEliminatePlayer}
                  disabled={!dayEliminateId}
                  className="btn-danger w-full"
                >
                  ⚖️ Éliminer {dayEliminateId ? getPlayerName(dayEliminateId) : '...'} → Passer à la nuit
                </button>
              </div>
            )}

            {/* Players tab */}
            {activeTab === 'players' && (
              <div className="space-y-2">
                <h2 className="text-amber-300 font-semibold mb-2">👥 Tous les joueurs</h2>
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`card flex items-center gap-3 p-3 ${!p.isAlive ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.isAlive ? 'bg-green-400' : 'bg-red-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${p.isAlive ? 'text-amber-200' : 'text-night-500 line-through'}`}>
                          {p.username}
                        </span>
                        {p.isConnected && <span className="text-xs text-green-500">● en ligne</span>}
                      </div>
                      {p.role && (
                        <span className="text-xs text-night-400">
                          {ROLE_EMOJI[p.role as Role]} {ROLE_LABELS[p.role as Role]}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.isAlive ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                      {p.isAlive ? 'Vivant' : 'Mort'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Log tab */}
            {activeTab === 'log' && (
              <div className="card">
                <h2 className="text-amber-300 font-semibold mb-3">📜 Journal de partie</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {gameLogs.length === 0 ? (
                    <p className="text-night-500 text-sm text-center py-3">Aucun événement</p>
                  ) : (
                    [...gameLogs].reverse().map((log) => (
                      <div key={log.id} className="text-sm flex gap-3 py-1.5 border-b border-night-700 last:border-0">
                        <span className="text-amber-700 shrink-0 text-xs pt-0.5">
                          N{log.nightNumber} {log.phase === 'NIGHT' ? '🌙' : '☀️'}
                        </span>
                        <div>
                          <span className="text-amber-200">
                            {formatAdminLog(log.eventType, log.data as LogData, players)}
                          </span>
                          <div className="text-xs text-night-500 mt-0.5">
                            {new Date(log.createdAt).toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Ended game */}
        {session.phase === 'ENDED' && (
          <div className="card text-center">
            <div className="text-5xl mb-3">🏁</div>
            <h2 className="text-title text-2xl mb-2">Partie terminée</h2>
            <button onClick={() => navigate('/admin')} className="btn-secondary mt-4">
              Nouvelle partie
            </button>
          </div>
        )}
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

function formatAdminLog(eventType: string, data: LogData, players: { id: string; username: string }[]) {
  const name = (id?: string) => players.find((p) => p.id === id)?.username ?? '?';
  switch (eventType) {
    case 'GAME_STARTED': return '🎮 Partie démarrée';
    case 'PLAYER_DIED': return `☠️ ${name(data.playerId)} est mort${data.cause === 'WITCH_KILL' ? ' (potion)' : ' (loups)'}`;
    case 'PLAYER_SAVED': return `💊 ${name(data.playerId)} sauvé par la sorcière`;
    case 'PLAYER_ELIMINATED': return `⚖️ ${name(data.playerId)} éliminé par vote`;
    case 'LOVERS_LINKED': return `💘 ${name(data.player1Id)} ❤️ ${name(data.player2Id)}`;
    case 'LOVER_DIED': return `💔 ${name(data.playerId)} mort de chagrin`;
    case 'HUNTER_SHOT': return `🏹 Chasseur ${name(data.hunterId)} → ${name(data.targetId)}`;
    case 'GAME_ENDED': return `🏁 FIN : ${data.reason}`;
    default: return eventType;
  }
}
