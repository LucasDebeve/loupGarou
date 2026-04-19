import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';

export const sessionRoutes = Router();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/sessions — create a new session
sessionRoutes.post('/', async (req: Request, res: Response) => {
  const { adminPassword, roleConfig } = req.body;
  if (!adminPassword || !roleConfig) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  const hash = await bcrypt.hash(adminPassword, 10);
  let code = generateCode();

  // Ensure unique code
  let existing = await prisma.session.findUnique({ where: { code } });
  while (existing) {
    code = generateCode();
    existing = await prisma.session.findUnique({ where: { code } });
  }

  const session = await prisma.session.create({
    data: {
      id: uuidv4(),
      code,
      adminHash: hash,
      roleConfig: JSON.stringify(roleConfig),
      phase: 'LOBBY',
    },
  });

  return res.json({ sessionId: session.id, code: session.code });
});

// GET /api/sessions/:code — get session info (for join page)
sessionRoutes.get('/:code', async (req: Request, res: Response) => {
  const session = await prisma.session.findUnique({
    where: { code: req.params.code.toUpperCase() },
    include: {
      players: {
        select: { id: true, username: true, isAlive: true, isConnected: true, role: true },
      },
    },
  });

  if (!session) {
    return res.status(404).json({ error: 'Session introuvable' });
  }

  return res.json({
    id: session.id,
    code: session.code,
    phase: session.phase,
    nightNumber: session.nightNumber,
    roleConfig: JSON.parse(session.roleConfig),
    players: session.players.map((p) => ({
      id: p.id,
      username: p.username,
      isAlive: p.isAlive,
      isConnected: p.isConnected,
      // Only reveal role if game ended
      role: session.phase === 'ENDED' ? p.role : undefined,
    })),
  });
});

// POST /api/sessions/:id/admin-login — admin auth
sessionRoutes.post('/:id/admin-login', async (req: Request, res: Response) => {
  const { password } = req.body;
  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session) return res.status(404).json({ error: 'Session introuvable' });

  const valid = await bcrypt.compare(password, session.adminHash);
  if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

  return res.json({ ok: true, sessionId: session.id });
});
