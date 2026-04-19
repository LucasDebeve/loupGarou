import { useState } from 'react';
import type { Role } from '../types';
import { ROLE_DESCRIPTION, ROLE_EMOJI, ROLE_LABELS } from '../types';

interface Props {
  role: Role;
  onContinue: () => void;
}

export default function RoleReveal({ role, onContinue }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="min-h-screen night-overlay flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <h2 className="text-title text-2xl text-center mb-8">Votre rôle cette partie</h2>

        <div
          className={`relative cursor-pointer select-none transition-all duration-700 ${
            flipped ? '' : 'hover:scale-105'
          }`}
          style={{ perspective: '1000px' }}
          onClick={() => !flipped && setFlipped(true)}
        >
          <div
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.7s',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              height: '340px',
            }}
          >
            {/* Front (card back) */}
            <div
              className="absolute inset-0 card flex flex-col items-center justify-center border-2 border-amber-700"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-8xl mb-4 animate-pulse-slow">🃏</div>
              <p className="text-amber-400 text-lg font-medieval">Touchez pour révéler</p>
              <p className="text-night-500 text-sm mt-2">Assurez-vous d'être seul</p>
            </div>

            {/* Back (role reveal) */}
            <div
              className="absolute inset-0 card flex flex-col items-center justify-center border-2 border-amber-500"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="text-8xl mb-3">{ROLE_EMOJI[role]}</div>
              <h3 className="text-title text-3xl mb-1 text-amber-300">{ROLE_LABELS[role]}</h3>
              <div className="w-12 h-0.5 bg-amber-600 my-3" />
              <p className="text-amber-200 text-sm text-center leading-relaxed px-2">
                {ROLE_DESCRIPTION[role]}
              </p>
            </div>
          </div>
        </div>

        {flipped && (
          <div className="mt-6 animate-slide-up">
            <button
              onClick={onContinue}
              className="btn-primary w-full"
            >
              ✅ J'ai compris mon rôle
            </button>
            <p className="text-night-500 text-xs text-center mt-2">
              Vous pourrez revoir votre rôle via le bouton en haut
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
