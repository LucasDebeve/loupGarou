import { useGame } from '../context/GameContext';
import WerewolfAction from './actions/WerewolfAction';
import SeerAction from './actions/SeerAction';
import WitchAction from './actions/WitchAction';
import CupidAction from './actions/CupidAction';
import LittleGirlAction from './actions/LittleGirlAction';
import HunterAction from './actions/HunterAction';

interface Props {
  isAlive: boolean;
}

export default function NightPhase({ isAlive }: Props) {
  const { playerInfo, nightActionDone, gameState } = useGame();

  if (!isAlive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-title text-2xl mb-2">Vous êtes mort</h2>
        <p className="text-night-500">Observez en silence...</p>
      </div>
    );
  }

  const role = playerInfo?.role;
  const nightNumber = gameState?.nightNumber ?? 1;

  // Seer keeps her screen visible after action to display the result
  if (role === 'SEER') {
    return <SeerAction />;
  }

  if (nightActionDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-title text-xl mb-2 text-amber-300">Action soumise</h2>
        <p className="text-amber-500 text-sm">En attente que la nuit se termine...</p>
        <div className="mt-8 text-4xl animate-pulse-slow">🌙</div>
      </div>
    );
  }

  // Cupid only acts on night 1
  if (role === 'CUPID' && nightNumber > 1) {
    return <WaitingScreen />;
  }

  switch (role) {
    case 'WEREWOLF':
      return <WerewolfAction />;
    case 'WITCH':
      return <WitchAction />;
    case 'CUPID':
      return <CupidAction />;
    case 'LITTLE_GIRL':
      return <LittleGirlAction />;
    case 'HUNTER':
      return <HunterAction />;
    default:
      return <WaitingScreen />;
  }
}

function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="text-7xl mb-6 animate-pulse-slow">🌙</div>
      <h2 className="text-title text-2xl mb-3">Le village dort...</h2>
      <p className="text-amber-600 text-sm leading-relaxed max-w-xs">
        Les forces de la nuit sont à l'œuvre.<br />
        Restez silencieux jusqu'à l'aube.
      </p>
      <div className="mt-8 flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-600 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
