import { useGame } from '../../context/GameContext';

export default function HunterAction() {
  const { playerInfo } = useGame();

  // Hunter action is triggered by admin when the hunter is eliminated
  // Here we just show a waiting screen during night phase
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="text-6xl mb-4">🏹</div>
      <h2 className="text-title text-xl mb-2 text-orange-400">Le Chasseur</h2>
      <p className="text-orange-300 text-sm mb-4">
        La nuit vous appartient... mais votre pouvoir s'active à votre mort.
      </p>
      <div className="bg-night-700 border border-night-600 rounded-lg p-4 text-sm text-amber-500 max-w-xs">
        Si vous êtes éliminé, vous pourrez désigner quelqu'un pour vous accompagner.
      </div>
      <div className="mt-6 text-4xl animate-pulse-slow">🌙</div>
    </div>
  );
}
