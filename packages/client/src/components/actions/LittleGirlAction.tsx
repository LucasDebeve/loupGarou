import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getSocket } from '../../utils/socket';

export default function LittleGirlAction() {
  const { playerInfo, wolves, sendNightAction } = useGame();
  const [peeked, setPeeked] = useState(false);
  const [caught, setCaught] = useState(false);
  const [peekedWolves, setPeekedWolves] = useState<{ id: string; username: string }[]>([]);
  const [passed, setPassed] = useState(false);

  const handlePeek = () => {
    const socket = getSocket();

    socket.once('littlegirl:peek', (data: { wolves: { id: string; username: string }[] }) => {
      setPeekedWolves(data.wolves);
      setPeeked(true);
    });

    socket.once('littlegirl:caught', () => {
      setCaught(true);
      setPeeked(true);
    });

    sendNightAction('LITTLE_GIRL_PEEK');
  };

  const handlePass = () => {
    // Villager-like pass — no action submitted
    setPassed(true);
  };

  if (passed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="text-6xl mb-4">😴</div>
        <p className="text-amber-400 font-semibold">Vous dormez sagement...</p>
        <p className="text-night-500 text-sm mt-1">En attente de l'aube</p>
      </div>
    );
  }

  if (peeked) {
    if (caught) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
          <div className="text-6xl mb-4">😱</div>
          <h2 className="text-title text-xl mb-2 text-red-400">Découverte !</h2>
          <p className="text-red-300 text-sm mb-4">
            Un loup vous a vue épier ! <br />
            Les loups savent que vous les surveillez.
          </p>
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm max-w-xs">
            ⚠️ L'administrateur a été informé. Vous êtes potentiellement en danger...
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="text-6xl mb-4">👁️</div>
        <h2 className="text-title text-xl mb-2 text-blue-400">Ce que vous avez vu...</h2>
        {peekedWolves.length > 0 ? (
          <div className="card border-red-900 mt-3 text-left max-w-xs">
            <p className="text-red-400 text-xs font-semibold mb-2">🐺 LOUPS APERÇUS :</p>
            {peekedWolves.map((w) => (
              <p key={w.id} className="text-amber-200 font-semibold">{w.username}</p>
            ))}
          </div>
        ) : (
          <p className="text-night-500 text-sm">Vous n'avez rien distingué dans l'obscurité...</p>
        )}
        <p className="text-blue-400 text-xs mt-4">Gardez ces informations pour vous !</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <div className="text-6xl mb-3">👧</div>
        <h2 className="text-title text-2xl mb-1 text-blue-400">La Petite Fille</h2>
        <p className="text-blue-300 text-sm">Vous pouvez espionner les loups... à vos risques</p>
      </div>

      <div className="card mb-4">
        <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-3 text-sm text-yellow-300 mb-4">
          ⚠️ <strong>Risque :</strong> 30% de chance d'être découverte par les loups !
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handlePeek}
            className="w-full py-4 bg-blue-900 hover:bg-blue-800 border border-blue-700 text-blue-200 font-bold rounded-lg transition-all active:scale-95"
          >
            👁️ Espionner les loups (risqué !)
          </button>

          <button
            onClick={handlePass}
            className="btn-secondary w-full"
          >
            😴 Rester tranquille cette nuit
          </button>
        </div>
      </div>
    </div>
  );
}
