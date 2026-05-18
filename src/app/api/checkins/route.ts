import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { Checkin } from '@/models/Checkin';
import { Goal } from '@/models/Goal';
import { User } from '@/models/User';
import { json, badRequest, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../_helpers/auth';
import { CycleWindow } from '@/models/CycleWindow';
import { isNonEmptyString, toNumber } from '../_helpers/validate';

export async function POST(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req)
    const body = await req.json();
    const auth2 = await getAuthFromRequest(req);


    const finalAuth = auth2 ?? auth;
    if (!finalAuth) return unauthorized('Missing mock auth');

    const goalId = body?.goalId;
    const goalDoc = typeof goalId === 'string'
      ? await Goal.findById(goalId).select('deadline metricDirection isShared parentGoalId').lean<any>()
      : null;

    // Enforce check-in schedule for non-admins (admin bypasses automatically).
    // Current implementation uses the request's quarter to infer the phase.
    // BRD mapping (existing schedule helper):
    // - Q1 (July)
    // - Q2 (October)
    // - Q3 (January)
    // - Q4/Annual (March/April)
    const isPrimarySharedGoal = goalDoc?.isShared === true && !goalDoc.parentGoalId;
    const isSharedRecipient = goalDoc?.isShared === true && !!goalDoc.parentGoalId;

    // Shared KPI governance: recipients must NOT create check-ins.
    if (isSharedRecipient && finalAuth.role !== 'admin') {
      return json(
        { ok: false, error: { message: 'Shared KPI achievements are managed by the primary owner' } },
        { status: 403 }
      );
    }

    if (finalAuth.role !== 'admin' && !(finalAuth.role === 'manager' && isPrimarySharedGoal)) {
      const quarterStr = typeof body?.quarter === 'string' ? body.quarter.trim() : '';
      const quarterPhase =
        quarterStr.startsWith('Q1') ? 'Q1' :
        quarterStr.startsWith('Q2') ? 'Q2' :
        quarterStr.startsWith('Q3') ? 'Q3' :
        quarterStr.startsWith('Q4') ? 'Q4' :
        'NONE';
      const override = await CycleWindow.findOne({ phase: quarterPhase, override: true }).lean<{ isOpen?: boolean } | null>();
      const isOpen = override?.isOpen ?? false;

      if (!isOpen) {
        return json({ ok: false, error: { message: 'Check-in window is closed' } }, { status: 403 });
      }
    }


    const quarter = body?.quarter;
    const plannedTarget = toNumber(body?.plannedTarget);
    const actualAchievement = toNumber(body?.actualAchievement);
    const progressStatus = body?.progressStatus;
    const employeeComment = body?.employeeComment;
    const managerComment = body?.managerComment;

    const allowed = ['Not Started', 'On Track', 'Completed'];
    if (!allowed.includes(progressStatus)) return badRequest('Invalid progressStatus');

    if (typeof goalId !== 'string' || !isNonEmptyString(quarter) || plannedTarget === null || actualAchievement === null) {
      return badRequest('Missing/invalid fields for check-in');
    }

    // Role-based semantics for check-in creation:
    // - employee: managerComment must be empty string or omitted; they submit actuals/progress only
    // - manager/admin: can provide managerComment
    const isEmployee = finalAuth.role === 'employee';
    const isManager = finalAuth.role === 'manager';
    const isAdmin = finalAuth.role === 'admin';

    let normalizedManagerComment = '';
    let normalizedEmployeeComment = '';

    if (isEmployee) {
      normalizedEmployeeComment = (employeeComment || '').trim();
      // employee can't create with a managerComment payload
      if (managerComment !== undefined && managerComment !== null && String(managerComment).trim().length > 0) {
        return json({ ok: false, error: { message: 'Employees cannot set managerComment' } }, { status: 403 });
      }
    } else {
      normalizedManagerComment = (managerComment || '').trim();
      normalizedEmployeeComment = (employeeComment || '').trim();
    }

    // Compute Phase-2 progress score using Goal.metricDirection
    const metricDirection = goalDoc?.metricDirection ?? 'Min';

    // For score calculation:
    // - target comes from plannedTarget (check-in input)
    // - achievement comes from actualAchievement
    // - Timeline uses goal.deadline + (no completionDate in BRD; fallback to quarter end not available)
    //   => currently treat Timeline as 0 unless completionDate is provided.
    //   If you later add completionDate to check-in, wire it here.
    const { calculateScore } = await import('@/utils/scoring');

    const computedScore = calculateScore({
      direction: metricDirection,
      target: plannedTarget,
      achievement: actualAchievement,
      deadline: goalDoc?.deadline,
      completionDate: undefined,
    });

    const checkin = await Checkin.create({
      goalId,
      quarter: quarter.trim(),
      plannedTarget: plannedTarget,
      actualAchievement: actualAchievement,
      progressStatus,
      employeeComment: normalizedEmployeeComment,
      managerComment: normalizedManagerComment,
      computedScore,
    });

    // Shared Goals Sync: If this goal has a parentGoalId, we might want to sync.
    // However, the BRD says "Achievement updates by the primary owner sync across all linked goal sheets".
    // This implies that if the PARENT goal is updated, we sync to children.
    const goal = await Goal.findById(goalId).lean<any>();
    
    if (goal?.isShared && !goal.parentGoalId) {
      // This IS the primary owner (parent goal)
      const children = await Goal.find({ parentGoalId: String(goal._id) }).select('_id').lean();
      for (const child of children) {
        await Checkin.findOneAndUpdate(
          { goalId: String(child._id), quarter: quarter.trim() },
          {
            goalId: String(child._id),
            quarter: quarter.trim(),
            plannedTarget: plannedTarget,
            actualAchievement: actualAchievement,
            progressStatus,
            managerComment: 'Synced from shared goal primary owner',
          },
          { upsert: true }
        );
      }
    }

    return json({ ok: true, data: checkin }, 201);
  } catch (e: any) {
    return serverError('Failed to create check-in', e?.message);
  }
}

export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    // Role-based filtering for list.
    // Employee: only check-ins whose goal belongs to them.
    // Manager: only check-ins for team goals.
    // Admin: all check-ins.

    if (auth.role === 'employee') {
      const user = await User.findOne({ uid: auth.uid }).select('employeeId').lean<{ employeeId: string } | null>();
      const goals = await Goal.find({ employeeId: user?.employeeId || auth.uid }).select({ _id: 1 }).lean<{ _id: any }[]>();
      const goalIds = goals.map((g) => String(g._id));
      const checkins = await Checkin.find({ goalId: { $in: goalIds } }).sort({ createdAt: -1 }).lean();
      return json({ ok: true, data: checkins });
    }

    const checkins = await Checkin.find({}).sort({ createdAt: -1 }).lean();
    return json({ ok: true, data: checkins });
  } catch (e: any) {
    return serverError('Failed to fetch check-ins', e?.message);
  }
}

