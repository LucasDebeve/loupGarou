import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import toast from 'react-hot-toast';
import { getSocket } from '../utils/socket';
import type { GameState, Phase, Player, Role, WinResult } from '../types';
import { ROLE_LABELS } from '../types';

interface PlayerInfo {
  playerId: string;
  sessionId: string;
  username: string;
  sessionCode: string;
  role?: Role;
  isAlive?: boolean;
  loverId?: string | null;
  hasUsedSavePotion?: boolean;
  hasUsedKillPotion?: boolean;
}

interface GameContextState {
  gameState: GameState | null;
  playerInfo: PlayerInfo | null;
  wolves: { id: string; username: string }[];
  seerResult: { targetId: string; role: string; username: string } | null;
  witchNightTarget: string | null;
  loverInfo: { loverId: string; loverUsername: string } | null;
  nightActionDone: boolean;
  winResult: WinResult | null;
  isConnected: boolean;
}

type Action =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'SET_PLAYER_INFO'; payload: PlayerInfo }
  | { type: 'SET_WOLVES'; payload: { id: string; username: string }[] }
  | { type: 'SET_SEER_RESULT'; payload: { targetId: string; role: string; username: string } }
  | { type: 'SET_WITCH_TARGET'; payload: string | null }
  | { type: 'SET_LOVER_INFO'; payload: { loverId: string; loverUsername: string } }
  | { type: 'SET_NIGHT_ACTION_DONE'; payload: boolean }
  | { type: 'SET_WIN_RESULT'; payload: WinResult }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'UPDATE_PLAYER_ROLE'; payload: { role: Role; isAlive: boolean; loverId?: string | null; hasUsedSavePotion?: boolean; hasUsedKillPotion?: boolean } };

function reducer(state: GameContextState, action: Action): GameContextState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_PLAYER_INFO':
      return { ...state, playerInfo: action.payload };
    case 'SET_WOLVES':
      return { ...state, wolves: action.payload };
    case 'SET_SEER_RESULT':
      return { ...state, seerResult: action.payload };
    case 'SET_WITCH_TARGET':
      return { ...state, witchNightTarget: action.payload };
    case 'SET_LOVER_INFO':
      return { ...state, loverInfo: action.payload };
    case 'SET_NIGHT_ACTION_DONE':
      return { ...state, nightActionDone: action.payload };
    case 'SET_WIN_RESULT':
      return { ...state, winResult: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'UPDATE_PLAYER_ROLE':
      if (!state.playerInfo) return state;
      return {
        ...state,
        playerInfo: {
          ...state.playerInfo,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

const initialState: GameContextState = {
  gameState: null,
  playerInfo: null,
  wolves: [],
  seerResult: null,
  witchNightTarget: null,
  loverInfo: null,
  nightActionDone: false,
  winResult: null,
  isConnected: false,
};

interface GameContextValue extends GameContextState {
  dispatch: React.Dispatch<Action>;
  sendNightAction: (actionType: string, targetId?: string, target2Id?: string) => void;
  joinRoom: (sessionId: string, playerId: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => dispatch({ type: 'SET_CONNECTED', payload: true }));
    socket.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', payload: false }));

    socket.on('game:state', (gameState: GameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('player:role', (data: { role: Role; isAlive: boolean; loverId?: string | null; hasUsedSavePotion?: boolean; hasUsedKillPotion?: boolean }) => {
      dispatch({ type: 'UPDATE_PLAYER_ROLE', payload: data });
    });

    socket.on('wolves:list', (wolves: { id: string; username: string }[]) => {
      dispatch({ type: 'SET_WOLVES', payload: wolves });
    });

    socket.on('seer:result', (data: { targetId: string; role: string; username: string }) => {
      dispatch({ type: 'SET_SEER_RESULT', payload: data });
    });

    socket.on('player:lover', (data: { loverId: string; loverUsername: string }) => {
      dispatch({ type: 'SET_LOVER_INFO', payload: data });
      toast(`💘 Vous êtes amoureux de ${data.loverUsername} !`, { duration: 6000 });
    });

    socket.on('night:action:confirmed', () => {
      dispatch({ type: 'SET_NIGHT_ACTION_DONE', payload: true });
    });

    socket.on('phase:changed', (data: { phase: Phase; nightNumber: number }) => {
      dispatch({ type: 'SET_NIGHT_ACTION_DONE', payload: false });
      if (data.phase === 'NIGHT') {
        toast.custom((t) => (
          <div className={`card text-center ${t.visible ? 'animate-fade-in' : ''}`}>
            <span className="text-2xl">🌙</span>
            <p className="text-amber-300 font-medieval">La nuit tombe sur le village...</p>
            <p className="text-sm text-amber-500">Nuit {data.nightNumber}</p>
          </div>
        ), { duration: 5000 });
      } else if (data.phase === 'DAY') {
        toast.custom((t) => (
          <div className={`card text-center ${t.visible ? 'animate-fade-in' : ''}`}>
            <span className="text-2xl">☀️</span>
            <p className="text-amber-300 font-medieval">L'aube se lève sur le village</p>
          </div>
        ), { duration: 5000 });
      }
    });

    socket.on('night:results', (data: { deadPlayerIds: string[] }) => {
      if (data.deadPlayerIds.length > 0) {
        toast.error(`☠️ Un joueur a été éliminé cette nuit !`, { duration: 6000 });
      } else {
        toast.success(`🌟 Le village s'en sort sans victime cette nuit !`, { duration: 6000 });
      }
    });

    socket.on('day:elimination', (data: { deadPlayerIds: string[] }) => {
      toast.error(`⚖️ ${data.deadPlayerIds.length} joueur(s) éliminé(s) par le village !`, { duration: 6000 });
    });

    socket.on('game:ended', (winResult: WinResult) => {
      dispatch({ type: 'SET_WIN_RESULT', payload: winResult });
    });

    socket.on('hunter:shot', (data: { hunterId: string; deadPlayerIds: string[] }) => {
      toast.error(`🏹 Le chasseur emporte quelqu'un avec lui !`, { duration: 6000 });
    });

    socket.on('littlegirl:caught', () => {
      toast.error(`👧 Vous avez été découverte en train d'espionner !`, { duration: 6000 });
    });

    socket.on('lobby:updated', (data: { players: Player[] }) => {
      if (stateRef.current.gameState) {
        dispatch({
          type: 'SET_GAME_STATE',
          payload: { ...stateRef.current.gameState, players: data.players },
        });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game:state');
      socket.off('player:role');
      socket.off('wolves:list');
      socket.off('seer:result');
      socket.off('player:lover');
      socket.off('night:action:confirmed');
      socket.off('phase:changed');
      socket.off('night:results');
      socket.off('day:elimination');
      socket.off('game:ended');
      socket.off('hunter:shot');
      socket.off('littlegirl:caught');
      socket.off('lobby:updated');
    };
  }, []);

  const joinRoom = (sessionId: string, playerId: string) => {
    const socket = getSocket();
    socket.emit('player:join', { sessionId, playerId });
  };

  const sendNightAction = (actionType: string, targetId?: string, target2Id?: string) => {
    const socket = getSocket();
    const { playerInfo } = stateRef.current;
    if (!playerInfo) return;

    socket.emit('night:action', {
      playerId: playerInfo.playerId,
      sessionId: playerInfo.sessionId,
      actionType,
      targetId,
      target2Id,
    });
  };

  return (
    <GameContext.Provider value={{ ...state, dispatch, sendNightAction, joinRoom }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
