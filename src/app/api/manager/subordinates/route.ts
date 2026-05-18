import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Goal } from '@/models/Goal';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';


export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (auth.role !== 'manager' && auth.role !== 'admin') {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    // Get current manager's business employeeId, which team members store in managerId.
    const manager = await User.findOne({ uid: auth.uid }).lean<{ employeeId: string } | null>();
    if (!manager) return unauthorized('Manager user not found in database');

    const filter = auth.role === 'admin' ? {} : { managerId: manager.employeeId };
    const subordinates = await User.find(filter).sort({ name: 1 }).lean();

    // Get goals for these subordinates
    const subordinateIds = subordinates.map(s => s.employeeId);
    const goals = await Goal.find({ employeeId: { $in: subordinateIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Group goals by employee
    const result = subordinates.map(s => ({
      ...s,
      goals: goals.filter(g => g.employeeId === s.employeeId)
    }));

    return json({ ok: true, data: result });
  } catch (e: any) {
    return serverError('Failed to fetch subordinates', e?.message);
  }
}
