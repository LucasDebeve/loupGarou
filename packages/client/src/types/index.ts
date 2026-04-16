export type Role =
  | 'VILLAGER'
  | 'WEREWOLF'
  | 'SEER'
  | 'WITCH'
  | 'HUNTER'
  | 'CUPID'
  | 'LITTLE_GIRL';

export type Phase = 'LOBBY' | 'NIGHT' | 'DAY' | 'ENDED';

export interface Player {
  id: string;
  username: string;
  isAlive: boolean;
  isConnected: boolean;
  role?: Role;
  loverId?: string | null;
}

export interface GameLog {
  id: string;
  nightNumber: number;
  phase: string;
  eventType: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface GameState {
  sessionId: string;
  code: string;
  phase: Phase;
  nightNumber: number;
  players: Player[];
  gameLogs: GameLog[];
}

export interface NightAction {
  id: string;
  playerId: string;
  nightNumber: number;
  actionType: string;
  targetId?: string | null;
  target2Id?: string | null;
}

export interface WinResult {
  winner: 'VILLAGE' | 'WEREWOLVES' | 'LOVERS';
  reason: string;
}

export interface RoleConfig {
  VILLAGER: number;
  WEREWOLF: number;
  SEER: number;
  WITCH: number;
  HUNTER: number;
  CUPID: number;
  LITTLE_GIRL: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  VILLAGER: 'Villageois',
  WEREWOLF: 'Loup-Garou',
  SEER: 'Voyante',
  WITCH: 'Sorcière',
  HUNTER: 'Chasseur',
  CUPID: 'Cupidon',
  LITTLE_GIRL: 'Petite Fille',
};

export const ROLE_EMOJI: Record<Role, string> = {
  VILLAGER: '👨‍🌾',
  WEREWOLF: '🐺',
  SEER: '🔮',
  WITCH: '🧙‍♀️',
  HUNTER: '🏹',
  CUPID: '💘',
  LITTLE_GIRL: '👧',
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  VILLAGER:
    'Vous êtes un simple villageois. Votre seul pouvoir est votre vote lors des débats du village. Débusquez les loups-garous !',
  WEREWOLF:
    'Chaque nuit, vous et vos complices désignez une victime. Pendant la journée, dissimulez votre identité et semez le doute !',
  SEER:
    'Chaque nuit, vous pouvez inspecter un joueur et découvrir son véritable rôle. Guidez le village... avec prudence.',
  WITCH:
    'Vous possédez deux potions à usage unique : une potion de vie pour sauver la victime des loups, une potion de mort pour éliminer n\'importe qui.',
  HUNTER:
    'Si vous êtes éliminé, vous pouvez emporter un joueur avec vous dans la mort. Choisissez bien votre cible !',
  CUPID:
    'La première nuit, vous choisissez deux joueurs qui tomberont amoureux. Si l\'un meurt, l\'autre mourra aussi.',
  LITTLE_GIRL:
    'Pendant la nuit des loups, vous pouvez espionner... mais attention, vous risquez d\'être découverte !',
};

export const ROLE_COLOR: Record<Role, string> = {
  VILLAGER: 'bg-forest-800 text-green-300',
  WEREWOLF: 'bg-red-900 text-red-300',
  SEER: 'bg-purple-900 text-purple-300',
  WITCH: 'bg-green-900 text-green-300',
  HUNTER: 'bg-orange-900 text-orange-300',
  CUPID: 'bg-pink-900 text-pink-300',
  LITTLE_GIRL: 'bg-blue-900 text-blue-300',
};
