import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { Goal } from '@/models/Goal';
import { User } from '@/models/User';
import { CycleWindow } from '@/models/CycleWindow';
import { json, badRequest, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';
import { getCurrentCyclePhase } from '../../_helpers/schedule';


export async function POST(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    const body = await req.json();
    const currentUser = await User.findOne({ uid: auth.uid }).select('employeeId').lean<{ employeeId: string } | null>();
    const currentEmployeeId = currentUser?.employeeId || auth.uid;
    const employeeId = body?.employeeId || currentEmployeeId;

    // Only the employee themselves or admin can submit.
    // Managers can approve/reject but usually employee submits their own plan.
    if (auth.role === 'employee' && employeeId !== currentEmployeeId) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const goals = await Goal.find({ employeeId });

    if (goals.length === 0) {
      return badRequest('No goals found to submit');
    }

    if (goals.length > 8) {
      return badRequest('Maximum 8 goals allowed');
    }

    const totalWeightage = goals.reduce((acc, g) => acc + (g.weightage || 0), 0);
    if (totalWeightage !== 100) {
      return badRequest(`Total weightage must be exactly 100%. Current total: ${totalWeightage}%`);
    }

    for (const g of goals) {
      if (g.weightage < 10) {
        return badRequest(`Goal "${g.title}" weightage is below 10%`);
      }
    }

    // Only allow submit during Goal Setting window unless admin.
    if (auth.role !== 'admin') {
      const override = await CycleWindow.findOne({ phase: 'GOAL_SETTING', override: true }).lean<{ isOpen?: boolean } | null>();
      const isOpen = override?.isOpen ?? (getCurrentCyclePhase() === 'GOAL_SETTING');

      if (!isOpen) {
        return json({ ok: false, error: { message: 'Goal setting window is closed. (Opens in May)' } }, { status: 403 });
      }
    }

    const ownDraftGoals = goals.filter((g) => !(g.isShared && g.parentGoalId));
    if (ownDraftGoals.length === 0) {
      return badRequest('No personal goals found to submit');
    }

    // Update personal goals to be locked and submitted. Shared recipient goals stay approved
    // and unlocked enough for employees to adjust weightage only.
    await Goal.updateMany(
      { employeeId, $or: [{ isShared: false }, { isShared: { $ne: true } }, { parentGoalId: null }] },
      {
        $set: {
          locked: true,
          approvalStatus: 'Submitted'
        }
      }
    );

    return json({ 
      ok: true, 
      message: 'Goals submitted successfully and locked for review' 
    });
  } catch (e: any) {
    return serverError('Failed to submit goals', e?.message);
  }
}
