import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { Goal } from '@/models/Goal';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../../_helpers/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'manager')) {
      return unauthorized('Forbidden');
    }

    const filter: Record<string, unknown> = {
      isShared: true,
      parentGoalId: null,
    };

    if (auth.role === 'manager') {
      filter.createdBy = auth.uid;
    }

    const goals = await Goal.find(filter).sort({ createdAt: -1 }).lean();

    return json({ ok: true, data: goals });
  } catch (e: any) {
    console.error('Failed to fetch primary shared goals:', e);
    return serverError('Failed to fetch shared goals', e?.message);
  }
}
