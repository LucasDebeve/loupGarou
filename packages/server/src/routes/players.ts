import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';

export const playerRoutes = Router();

// POST /api/players/join — join a session
playerRoutes.post('/join', async (req: Request, res: Response) => {
  const { sessionCode, username } = req.body;
  if (!sessionCode || !username) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  const session = await prisma.session.findUnique({
    where: { code: sessionCode.toUpperCase() },
    include: { players: true },
  });

  if (!session) return res.status(404).json({ error: 'Session introuvable' });
  if (session.phase !== 'LOBBY') {
    return res.status(400).json({ error: 'La partie a déjà commencé' });
  }

  const trimmed = username.trim();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 20) {
    return res.status(400).json({ error: 'Pseudo invalide (2-20 caractères)' });
  }

  const taken = session.players.find(
    (p) => p.username.toLowerCase() === trimmed.toLowerCase()
  );
  if (taken) {
    return res.status(409).json({ error: 'Ce pseudo est déjà pris' });
  }

  const player = await prisma.player.create({
    data: {
      id: uuidv4(),
      sessionId: session.id,
      username: trimmed,
    },
  });

  return res.json({
    playerId: player.id,
    sessionId: session.id,
    username: player.username,
    sessionCode: session.code,
  });
});

// GET /api/players/:id — get player info (for reconnect)
playerRoutes.get('/:id', async (req: Request, res: Response) => {
  const player = await prisma.player.findUnique({
    where: { id: req.params.id },
    include: { session: true },
  });
  if (!player) return res.status(404).json({ error: 'Joueur introuvable' });

  return res.json({
    id: player.id,
    username: player.username,
    sessionId: player.sessionId,
    sessionCode: player.session.code,
    role: player.role,
    isAlive: player.isAlive,
    loverId: player.loverId,
    hasUsedSavePotion: player.hasUsedSavePotion,
    hasUsedKillPotion: player.hasUsedKillPotion,
    sessionPhase: player.session.phase,
    nightNumber: player.session.nightNumber,
  });
});

// GET /api/players/:id/night-action — get current night action for a player
playerRoutes.get('/:id/night-action', async (req: Request, res: Response) => {
  const player = await prisma.player.findUnique({
    where: { id: req.params.id },
    include: { session: true },
  });
  if (!player) return res.status(404).json({ error: 'Joueur introuvable' });

  const action = await prisma.nightAction.findFirst({
    where: {
      playerId: player.id,
      nightNumber: player.session.nightNumber,
    },
  });

  return res.json({ action });
});
