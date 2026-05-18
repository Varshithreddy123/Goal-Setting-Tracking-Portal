import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { CycleWindow } from '@/models/CycleWindow';
import { json, badRequest, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';

const allowedPhases = new Set(['GOAL_SETTING', 'Q1', 'Q2', 'Q3', 'Q4']);

export async function GET(req: NextRequest) {
  await connectToMongo();
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');
    if (auth.role !== 'admin') return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });

    const windows = await CycleWindow.find({ override: true }).sort({ phase: 1 }).lean();
    return json({ ok: true, data: windows });
  } catch (e: any) {
    return serverError('Failed to fetch cycle overrides', e?.message);
  }
}

export async function PATCH(req: NextRequest) {
  await connectToMongo();
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');
    if (auth.role !== 'admin') return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });

    const body = await req.json();

    const phase = typeof body?.phase === 'string' ? body.phase.trim() : '';
    const isOpen = body?.isOpen;

    if (!allowedPhases.has(phase)) return badRequest('Invalid phase');
    if (typeof isOpen !== 'boolean') return badRequest('isOpen must be boolean');

    const updated = await CycleWindow.findOneAndUpdate(
      { phase },
      {
        phase,
        isOpen,
        override: true,
        updatedBy: auth.uid,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return json({ ok: true, data: updated });
  } catch (e: any) {
    return serverError('Failed to update cycle override', e?.message);
  }
}

// Optional endpoint to clear overrides for a phase
export async function DELETE(req: NextRequest) {
  await connectToMongo();
  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');
    if (auth.role !== 'admin') return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });

    const body = await req.json();
    const phase = typeof body?.phase === 'string' ? body.phase.trim() : '';

    if (!allowedPhases.has(phase)) return badRequest('Invalid phase');

    await CycleWindow.findOneAndUpdate(
      { phase },
      { override: false },
      { upsert: false }
    );

    return json({ ok: true, data: { message: 'Cycle override cleared' } });
  } catch (e: any) {
    return serverError('Failed to clear cycle override', e?.message);
  }
}

