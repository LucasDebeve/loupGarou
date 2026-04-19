import prisma from '../prisma/client';

export interface WinResult {
  winner: 'VILLAGE' | 'WEREWOLVES' | 'LOVERS';
  reason: string;
}

export async function checkWinCondition(sessionId: string): Promise<WinResult | null> {
  const players = await prisma.player.findMany({ where: { sessionId } });
  const alive = players.filter((p) => p.isAlive);

  const aliveWolves = alive.filter((p) => p.role === 'WEREWOLF');
  const aliveVillagers = alive.filter((p) => p.role !== 'WEREWOLF');

  // Check lovers win: only the two lovers remain
  const loverPairs = alive.filter((p) => p.loverId !== null);
  if (loverPairs.length === 2 && alive.length === 2) {
    const [a, b] = loverPairs;
    if (a.loverId === b.id && b.loverId === a.id) {
      return { winner: 'LOVERS', reason: 'Les amoureux ont survécu seuls !' };
    }
  }

  if (aliveWolves.length === 0) {
    return { winner: 'VILLAGE', reason: 'Tous les loups-garous ont été éliminés !' };
  }

  if (aliveWolves.length >= aliveVillagers.length) {
    return { winner: 'WEREWOLVES', reason: 'Les loups-garous dominent le village !' };
  }

  return null;
}

export async function buildGameState(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      players: true,
      gameLogs: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) return null;

  const isEnded = session.phase === 'ENDED';

  return {
    sessionId: session.id,
    code: session.code,
    phase: session.phase,
    nightNumber: session.nightNumber,
    players: session.players.map((p) => ({
      id: p.id,
      username: p.username,
      isAlive: p.isAlive,
      isConnected: p.isConnected,
      loverId: p.loverId,
      // Reveal role only on death or game end
      role: isEnded || !p.isAlive ? p.role : undefined,
    })),
    gameLogs: session.gameLogs.map((l) => ({
      id: l.id,
      nightNumber: l.nightNumber,
      phase: l.phase,
      eventType: l.eventType,
      data: JSON.parse(l.data),
      createdAt: l.createdAt,
    })),
  };
}

export async function getWolvesForSession(sessionId: string) {
  return prisma.player.findMany({
    where: { sessionId, role: 'WEREWOLF', isAlive: true },
    select: { id: true, username: true },
  });
}
