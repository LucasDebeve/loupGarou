import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';
import { io } from '../index';
import { checkWinCondition, buildGameState } from '../socket/gameLogic';

export const adminRoutes = Router();

async function verifyAdmin(sessionId: string, password: string): Promise<boolean> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return false;
  return bcrypt.compare(password, session.adminHash);
}

// POST /api/admin/assign-roles — randomly or manually assign roles
adminRoutes.post('/assign-roles', async (req: Request, res: Response) => {
  const { sessionId, adminPassword, assignments } = req.body;
  if (!(await verifyAdmin(sessionId, adminPassword))) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { players: true },
  });
  if (!session || session.phase !== 'LOBBY') {
    return res.status(400).json({ error: 'Impossible d\'assigner les rôles maintenant' });
  }

  if (assignments) {
    // Manual assignments: { playerId: role }
    for (const [playerId, role] of Object.entries(assignments)) {
      await prisma.player.update({
        where: { id: playerId },
        data: { role: role as string },
      });
    }
  } else {
    // Random assignment based on roleConfig
    const roleConfig: Record<string, number> = JSON.parse(session.roleConfig);
    const rolePool: string[] = [];
    for (const [role, count] of Object.entries(roleConfig)) {
      for (let i = 0; i < count; i++) rolePool.push(role);
    }

    // Shuffle
    for (let i = rolePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
    }

    const players = session.players;
    if (players.length !== rolePool.length) {
      return res.status(400).json({
        error: `Nombre de joueurs (${players.length}) ne correspond pas aux rôles (${rolePool.length})`,
      });
    }

    for (let i = 0; i < players.length; i++) {
      await prisma.player.update({
        where: { id: players[i].id },
        data: { role: rolePool[i] },
      });
    }
  }

  // Start game: move to NIGHT phase
  await prisma.session.update({
    where: { id: sessionId },
    data: { phase: 'NIGHT', nightNumber: 1 },
  });

  await prisma.gameLog.create({
    data: {
      id: uuidv4(),
      sessionId,
      nightNumber: 1,
      phase: 'NIGHT',
      eventType: 'GAME_STARTED',
      data: JSON.stringify({ message: 'La partie a commencé' }),
    },
  });

  const gameState = await buildGameState(sessionId);
  io.to(sessionId).emit('game:state', gameState);
  io.to(sessionId).emit('phase:changed', { phase: 'NIGHT', nightNumber: 1 });

  return res.json({ ok: true });
});

// POST /api/admin/resolve-night — admin applies night results
adminRoutes.post('/resolve-night', async (req: Request, res: Response) => {
  const { sessionId, adminPassword, killedPlayerId, savedPlayerId } = req.body;
  if (!(await verifyAdmin(sessionId, adminPassword))) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { players: true },
  });
  if (!session || session.phase !== 'NIGHT') {
    return res.status(400).json({ error: 'Pas en phase nuit' });
  }

  const deadPlayerIds: string[] = [];

  // Apply kill (if not saved)
  if (killedPlayerId && killedPlayerId !== savedPlayerId) {
    await prisma.player.update({
      where: { id: killedPlayerId },
      data: { isAlive: false },
    });
    deadPlayerIds.push(killedPlayerId);

    await prisma.gameLog.create({
      data: {
        id: uuidv4(),
        sessionId,
        nightNumber: session.nightNumber,
        phase: 'NIGHT',
        eventType: 'PLAYER_DIED',
        data: JSON.stringify({ playerId: killedPlayerId }),
      },
    });

    // Check lover death
    const killedPlayer = session.players.find((p) => p.id === killedPlayerId);
    if (killedPlayer?.loverId) {
      const lover = session.players.find((p) => p.id === killedPlayer.loverId);
      if (lover?.isAlive) {
        await prisma.player.update({ where: { id: lover.id }, data: { isAlive: false } });
        deadPlayerIds.push(lover.id);
        await prisma.gameLog.create({
          data: {
            id: uuidv4(),
            sessionId,
            nightNumber: session.nightNumber,
            phase: 'NIGHT',
            eventType: 'LOVER_DIED',
            data: JSON.stringify({ playerId: lover.id, reason: 'LOVER_DIED' }),
          },
        });
      }
    }
  }

  // Apply witch kill potion
  const witchKill = await prisma.nightAction.findFirst({
    where: { sessionId, nightNumber: session.nightNumber, actionType: 'WITCH_KILL' },
  });
  if (witchKill?.targetId) {
    const target = session.players.find((p) => p.id === witchKill.targetId);
    if (target?.isAlive) {
      await prisma.player.update({ where: { id: target.id }, data: { isAlive: false } });
      deadPlayerIds.push(target.id);
      await prisma.gameLog.create({
        data: {
          id: uuidv4(),
          sessionId,
          nightNumber: session.nightNumber,
          phase: 'NIGHT',
          eventType: 'PLAYER_DIED',
          data: JSON.stringify({ playerId: target.id, cause: 'WITCH_KILL' }),
        },
      });

      // Check lover
      if (target.loverId) {
        const lover = session.players.find((p) => p.id === target.loverId);
        if (lover?.isAlive && !deadPlayerIds.includes(lover.id)) {
          await prisma.player.update({ where: { id: lover.id }, data: { isAlive: false } });
          deadPlayerIds.push(lover.id);
        }
      }
    }
  }

  if (savedPlayerId) {
    await prisma.gameLog.create({
      data: {
        id: uuidv4(),
        sessionId,
        nightNumber: session.nightNumber,
        phase: 'NIGHT',
        eventType: 'PLAYER_SAVED',
        data: JSON.stringify({ playerId: savedPlayerId }),
      },
    });
  }

  // Move to DAY
  await prisma.session.update({
    where: { id: sessionId },
    data: { phase: 'DAY' },
  });

  const winResult = await checkWinCondition(sessionId);

  if (winResult) {
    await prisma.session.update({ where: { id: sessionId }, data: { phase: 'ENDED' } });
    await prisma.gameLog.create({
      data: {
        id: uuidv4(),
        sessionId,
        nightNumber: session.nightNumber,
        phase: 'DAY',
        eventType: 'GAME_ENDED',
        data: JSON.stringify(winResult),
      },
    });
    const gameState = await buildGameState(sessionId);
    io.to(sessionId).emit('game:state', gameState);
    io.to(sessionId).emit('game:ended', winResult);
    return res.json({ ok: true, deadPlayerIds, gameEnded: true, winResult });
  }

  const gameState = await buildGameState(sessionId);
  io.to(sessionId).emit('game:state', gameState);
  io.to(sessionId).emit('phase:changed', { phase: 'DAY', nightNumber: session.nightNumber });
  if (deadPlayerIds.length > 0) {
    io.to(sessionId).emit('night:results', { deadPlayerIds });
  }

  return res.json({ ok: true, deadPlayerIds });
});

// POST /api/admin/eliminate-player — admin records day vote result
adminRoutes.post('/eliminate-player', async (req: Request, res: Response) => {
  const { sessionId, adminPassword, playerId } = req.body;
  if (!(await verifyAdmin(sessionId, adminPassword))) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { players: true },
  });
  if (!session || session.phase !== 'DAY') {
    return res.status(400).json({ error: 'Pas en phase jour' });
  }

  const deadPlayerIds: string[] = [playerId];

  await prisma.player.update({ where: { id: playerId }, data: { isAlive: false } });

  const eliminated = session.players.find((p) => p.id === playerId);

  await prisma.gameLog.create({
    data: {
      id: uuidv4(),
      sessionId,
      nightNumber: session.nightNumber,
      phase: 'DAY',
      eventType: 'PLAYER_ELIMINATED',
      data: JSON.stringify({ playerId, byVote: true }),
    },
  });

  // Hunter mechanic — handled separately via socket or another endpoint
  // Lover mechanic
  if (eliminated?.loverId) {
    const lover = session.players.find((p) => p.id === eliminated.loverId);
    if (lover?.isAlive) {
      await prisma.player.update({ where: { id: lover.id }, data: { isAlive: false } });
      deadPlayerIds.push(lover.id);
      await prisma.gameLog.create({
        data: {
          id: uuidv4(),
          sessionId,
          nightNumber: session.nightNumber,
          phase: 'DAY',
          eventType: 'LOVER_DIED',
          data: JSON.stringify({ playerId: lover.id }),
        },
      });
    }
  }

  const winResult = await checkWinCondition(sessionId);
  if (winResult) {
    await prisma.session.update({ where: { id: sessionId }, data: { phase: 'ENDED' } });
    await prisma.gameLog.create({
      data: {
        id: uuidv4(),
        sessionId,
        nightNumber: session.nightNumber,
        phase: 'DAY',
        eventType: 'GAME_ENDED',
        data: JSON.stringify(winResult),
      },
    });
    const gameState = await buildGameState(sessionId);
    io.to(sessionId).emit('game:state', gameState);
    io.to(sessionId).emit('game:ended', winResult);
    return res.json({ ok: true, deadPlayerIds, gameEnded: true, winResult });
  }

  // Move to next NIGHT
  const nextNight = session.nightNumber + 1;
  await prisma.session.update({
    where: { id: sessionId },
    data: { phase: 'NIGHT', nightNumber: nextNight },
  });

  const gameState = await buildGameState(sessionId);
  io.to(sessionId).emit('game:state', gameState);
  io.to(sessionId).emit('day:elimination', { deadPlayerIds });
  io.to(sessionId).emit('phase:changed', { phase: 'NIGHT', nightNumber: nextNight });

  return res.json({ ok: true, deadPlayerIds });
});

// POST /api/admin/hunter-shoot — trigger hunter's shot
adminRoutes.post('/hunter-shoot', async (req: Request, res: Response) => {
  const { sessionId, adminPassword, hunterId, targetId } = req.body;
  if (!(await verifyAdmin(sessionId, adminPassword))) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { players: true },
  });
  if (!session) return res.status(404).json({ error: 'Session introuvable' });

  const deadPlayerIds: string[] = [targetId];
  await prisma.player.update({ where: { id: targetId }, data: { isAlive: false } });

  await prisma.gameLog.create({
    data: {
      id: uuidv4(),
      sessionId,
      nightNumber: session.nightNumber,
      phase: session.phase,
      eventType: 'HUNTER_SHOT',
      data: JSON.stringify({ hunterId, targetId }),
    },
  });

  // Lover check
  const target = session.players.find((p) => p.id === targetId);
  if (target?.loverId) {
    const lover = session.players.find((p) => p.id === target.loverId);
    if (lover?.isAlive) {
      await prisma.player.update({ where: { id: lover.id }, data: { isAlive: false } });
      deadPlayerIds.push(lover.id);
    }
  }

  io.to(sessionId).emit('hunter:shot', { hunterId, deadPlayerIds });

  return res.json({ ok: true, deadPlayerIds });
});

// GET /api/admin/night-actions/:sessionId — get all night actions for current night
adminRoutes.get('/night-actions/:sessionId', async (req: Request, res: Response) => {
  const { adminPassword } = req.query;
  if (!adminPassword || !(await verifyAdmin(req.params.sessionId, adminPassword as string))) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const session = await prisma.session.findUnique({
    where: { id: req.params.sessionId },
    include: {
      players: true,
      nightActions: {
        where: { nightNumber: { gt: 0 } },
        orderBy: { createdAt: 'asc' },
      },
      gameLogs: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) return res.status(404).json({ error: 'Session introuvable' });

  const currentNightActions = session.nightActions.filter(
    (a) => a.nightNumber === session.nightNumber
  );

  return res.json({
    session: {
      id: session.id,
      code: session.code,
      phase: session.phase,
      nightNumber: session.nightNumber,
      roleConfig: JSON.parse(session.roleConfig),
    },
    players: session.players,
    currentNightActions,
    allNightActions: session.nightActions,
    gameLogs: session.gameLogs,
  });
});
