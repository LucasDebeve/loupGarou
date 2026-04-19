import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';
import { buildGameState, getWolvesForSession } from './gameLogic';

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // Player joins a session room
    socket.on('player:join', async ({ sessionId, playerId }: { sessionId: string; playerId: string }) => {
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player || player.sessionId !== sessionId) return;

      await prisma.player.update({
        where: { id: playerId },
        data: { isConnected: true, socketId: socket.id },
      });

      socket.join(sessionId);
      socket.data.playerId = playerId;
      socket.data.sessionId = sessionId;

      const gameState = await buildGameState(sessionId);
      socket.emit('game:state', gameState);

      // Send role info privately
      const fullPlayer = await prisma.player.findUnique({ where: { id: playerId } });
      if (fullPlayer?.role) {
        socket.emit('player:role', {
          role: fullPlayer.role,
          isAlive: fullPlayer.isAlive,
          loverId: fullPlayer.loverId,
          hasUsedSavePotion: fullPlayer.hasUsedSavePotion,
          hasUsedKillPotion: fullPlayer.hasUsedKillPotion,
        });

        // If wolf, send fellow wolves list
        if (fullPlayer.role === 'WEREWOLF' && fullPlayer.isAlive) {
          const wolves = await getWolvesForSession(sessionId);
          socket.emit('wolves:list', wolves);
        }
      }

      io.to(sessionId).emit('lobby:updated', {
        players: (await prisma.player.findMany({
          where: { sessionId },
          select: { id: true, username: true, isAlive: true, isConnected: true },
        })),
      });
    });

    // Admin joins session room
    socket.on('admin:join', ({ sessionId }: { sessionId: string }) => {
      socket.join(`admin:${sessionId}`);
      socket.join(sessionId);
      socket.data.isAdmin = true;
      socket.data.sessionId = sessionId;
    });

    // Night action submission
    socket.on('night:action', async (data: {
      playerId: string;
      sessionId: string;
      actionType: string;
      targetId?: string;
      target2Id?: string;
    }) => {
      const { playerId, sessionId, actionType, targetId, target2Id } = data;

      const player = await prisma.player.findUnique({ where: { id: playerId } });
      const session = await prisma.session.findUnique({ where: { id: sessionId } });

      if (!player || !session || session.phase !== 'NIGHT') return;
      if (!player.isAlive) return;

      // Validate action is appropriate for role
      const validActions: Record<string, string[]> = {
        WEREWOLF: ['WOLF_VOTE'],
        SEER: ['SEER_INSPECT'],
        WITCH: ['WITCH_SAVE', 'WITCH_KILL', 'WITCH_PASS'],
        HUNTER: ['HUNTER_SHOOT'],
        CUPID: ['CUPID_LINK'],
        LITTLE_GIRL: ['LITTLE_GIRL_PEEK'],
      };

      if (player.role && validActions[player.role] && !validActions[player.role].includes(actionType)) {
        return;
      }

      // Check if action already submitted (prevent duplicate)
      const existing = await prisma.nightAction.findFirst({
        where: { playerId, nightNumber: session.nightNumber, actionType },
      });

      if (existing) {
        // Update vote for wolf
        if (actionType === 'WOLF_VOTE') {
          await prisma.nightAction.update({
            where: { id: existing.id },
            data: { targetId },
          });
        }
        return;
      }

      // Witch potion checks
      if (actionType === 'WITCH_SAVE' && player.hasUsedSavePotion) return;
      if (actionType === 'WITCH_KILL' && player.hasUsedKillPotion) return;

      // Mark potions used
      if (actionType === 'WITCH_SAVE') {
        await prisma.player.update({ where: { id: playerId }, data: { hasUsedSavePotion: true } });
      }
      if (actionType === 'WITCH_KILL') {
        await prisma.player.update({ where: { id: playerId }, data: { hasUsedKillPotion: true } });
      }

      // Handle Cupid linking
      if (actionType === 'CUPID_LINK' && targetId && target2Id) {
        await prisma.player.update({ where: { id: targetId }, data: { loverId: target2Id } });
        await prisma.player.update({ where: { id: target2Id }, data: { loverId: targetId } });

        await prisma.gameLog.create({
          data: {
            id: uuidv4(),
            sessionId,
            nightNumber: session.nightNumber,
            phase: 'NIGHT',
            eventType: 'LOVERS_LINKED',
            data: JSON.stringify({ player1Id: targetId, player2Id: target2Id }),
          },
        });

        // Notify the two lovers privately
        const lover1 = await prisma.player.findUnique({ where: { id: targetId } });
        const lover2 = await prisma.player.findUnique({ where: { id: target2Id } });

        if (lover1?.socketId) {
          io.to(lover1.socketId).emit('player:lover', { loverId: target2Id, loverUsername: lover2?.username });
        }
        if (lover2?.socketId) {
          io.to(lover2.socketId).emit('player:lover', { loverId: targetId, loverUsername: lover1?.username });
        }
      }

      // Handle Seer inspect — send result privately
      if (actionType === 'SEER_INSPECT' && targetId) {
        const target = await prisma.player.findUnique({ where: { id: targetId } });
        if (target) {
          socket.emit('seer:result', { targetId, role: target.role, username: target.username });
        }
      }

      // Little Girl peek
      if (actionType === 'LITTLE_GIRL_PEEK') {
        const caught = Math.random() < 0.3; // 30% chance of being caught
        if (caught) {
          socket.emit('littlegirl:caught', {});
          io.to(`admin:${sessionId}`).emit('littlegirl:peeked', { playerId, caught: true });
        } else {
          const wolves = await getWolvesForSession(sessionId);
          socket.emit('littlegirl:peek', { wolves });
          io.to(`admin:${sessionId}`).emit('littlegirl:peeked', { playerId, caught: false });
        }
      }

      await prisma.nightAction.create({
        data: {
          id: uuidv4(),
          sessionId,
          playerId,
          nightNumber: session.nightNumber,
          actionType,
          targetId,
          target2Id,
        },
      });

      socket.emit('night:action:confirmed', { actionType });

      // Notify admin
      io.to(`admin:${sessionId}`).emit('admin:action:received', {
        playerId,
        actionType,
        targetId,
        target2Id,
      });

      // Check if all wolves have voted consistently
      if (actionType === 'WOLF_VOTE') {
        await checkWolfConsensus(io, sessionId, session.nightNumber);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.data.playerId) {
        await prisma.player.update({
          where: { id: socket.data.playerId },
          data: { isConnected: false, socketId: null },
        });

        if (socket.data.sessionId) {
          io.to(socket.data.sessionId).emit('lobby:updated', {
            players: await prisma.player.findMany({
              where: { sessionId: socket.data.sessionId },
              select: { id: true, username: true, isAlive: true, isConnected: true },
            }),
          });
        }
      }
    });
  });
}

async function checkWolfConsensus(io: Server, sessionId: string, nightNumber: number) {
  const aliveWolves = await prisma.player.findMany({
    where: { sessionId, role: 'WEREWOLF', isAlive: true },
  });

  const wolfVotes = await prisma.nightAction.findMany({
    where: { sessionId, nightNumber, actionType: 'WOLF_VOTE' },
  });

  if (wolfVotes.length < aliveWolves.length) return;

  // Check if all vote for same target
  const targetCounts: Record<string, number> = {};
  for (const vote of wolfVotes) {
    if (vote.targetId) {
      targetCounts[vote.targetId] = (targetCounts[vote.targetId] || 0) + 1;
    }
  }

  const maxVotes = Math.max(...Object.values(targetCounts));
  const consensusTarget = Object.entries(targetCounts).find(([, count]) => count === maxVotes)?.[0];

  if (consensusTarget) {
    const target = await prisma.player.findUnique({ where: { id: consensusTarget } });
    io.to(`admin:${sessionId}`).emit('wolves:consensus', {
      targetId: consensusTarget,
      targetUsername: target?.username,
      votes: wolfVotes.length,
      totalWolves: aliveWolves.length,
    });
  }
}
