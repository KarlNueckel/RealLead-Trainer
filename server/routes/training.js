import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Simple flow mapping to support scalability
// More paths can be added later or moved to DB-config table
const stepFlow = {
  'Seller Lead - Referral': ['Initial Call', 'Listing Consultation', 'Follow-Up'],
};

// Ensure steps exist for a given path/user; create defaults if missing
async function ensureSteps(userId, path) {
  const flow = stepFlow[path];
  if (!flow) return [];

  const existing = await prisma.trainingStep.findMany({ where: { userId, path }, orderBy: { order: 'asc' } });
  if (existing.length === flow.length) return existing;

  // Seed steps: first unlocked, rest locked, preserve any existing where possible
  const toCreate = [];
  for (let i = 0; i < flow.length; i++) {
    const name = flow[i];
    const found = existing.find((s) => s.name === name);
    if (found) continue;
    toCreate.push({
      userId: userId || null,
      path,
      name,
      status: i === 0 ? 'unlocked' : 'locked',
      score: null,
      order: i,
    });
  }
  if (toCreate.length) {
    await prisma.trainingStep.createMany({ data: toCreate, skipDuplicates: true });
  }
  return prisma.trainingStep.findMany({ where: { userId, path }, orderBy: { order: 'asc' } });
}

// GET /api/training/steps?path=Seller%20Lead%20-%20Referral
router.get('/steps', async (req, res) => {
  try {
    const userId = (req.query.userId || null) as string | null;
    const path = String(req.query.path || '').trim();
    if (!path) return res.status(400).json({ error: 'Missing path' });
    const steps = await ensureSteps(userId, path);
    res.json({ path, steps });
  } catch (e) {
    console.error('GET /api/training/steps error:', e);
    res.status(500).json({ error: 'Failed to load steps' });
  }
});

// POST /api/training/progress
// { path: string, currentStep: string, score: number, passThreshold?: number }
router.post('/progress', async (req, res) => {
  try {
    const { path, currentStep, score, passThreshold } = req.body || {};
    const userId = req.body?.userId || null;
    if (!path || !currentStep || typeof score !== 'number') {
      return res.status(400).json({ error: 'path, currentStep, and score are required' });
    }
    const threshold = typeof passThreshold === 'number' ? passThreshold : 80;

    const steps = await ensureSteps(userId, path);
    const flow = stepFlow[path] || steps.sort((a,b)=>a.order-b.order).map(s=>s.name);
    const idx = flow.indexOf(currentStep);
    if (idx === -1) return res.status(400).json({ error: 'Unknown currentStep for path' });

    const didPass = score >= threshold;
    let unlockedStep = null;

    if (didPass) {
      // Mark current as completed + save score
      await prisma.trainingStep.updateMany({
        where: { userId, path, name: currentStep },
        data: { status: 'completed', score: Math.round(score) },
      });
      // Unlock next if exists and still locked
      const nextName = flow[idx + 1];
      if (nextName) {
        const next = await prisma.trainingStep.findFirst({ where: { userId, path, name: nextName } });
        if (next && next.status === 'locked') {
          await prisma.trainingStep.update({ where: { id: next.id }, data: { status: 'unlocked' } });
        }
        unlockedStep = nextName || null;
      }
    } else {
      // On fail, store score but keep status as-is (remain on same step)
      await prisma.trainingStep.updateMany({
        where: { userId, path, name: currentStep },
        data: { score: Math.round(score) },
      });
    }

    const updated = await prisma.trainingStep.findMany({ where: { userId, path }, orderBy: { order: 'asc' } });
    res.json({
      status: didPass ? 'passed' : 'failed',
      currentStep,
      nextStep: unlockedStep,
      steps: updated,
      threshold,
      score,
    });
  } catch (e) {
    console.error('POST /api/training/progress error:', e);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;

