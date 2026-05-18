import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { Goal } from '@/models/Goal';
import { User } from '@/models/User';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../../_helpers/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing session');

    // Resolve business employeeId from Firebase uid
    const user = await User.findOne({ uid: auth.uid })
      .select({ employeeId: 1 })
      .lean<any | null>();

    const businessEmployeeId = user?.employeeId;
    if (!businessEmployeeId) {
      return json(
        { ok: false, error: { message: 'Employee profile not found' } },
        { status: 404 }
      );
    }

    // Shared goals assigned to this employee are created with:
    // - isShared: true
    // - parentGoalId: present
    // - employeeId: businessEmployeeId
    const goals = await Goal.find({
      isShared: true,
      parentGoalId: { $exists: true, $ne: null },
      employeeId: businessEmployeeId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return json({ ok: true, data: goals });
  } catch (e: any) {
    console.error('Failed to fetch employee shared goals:', e);
    return serverError('Failed to fetch shared goals', e?.message);
  }
}

