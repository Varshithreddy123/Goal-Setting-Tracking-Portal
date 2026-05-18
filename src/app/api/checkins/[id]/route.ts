import type { NextRequest } from 'next/server';
import { isValidObjectId } from 'mongoose';

import { connectToMongo } from '@/lib/mongodb';
import { Checkin, type ProgressStatus } from '@/models/Checkin';
import { Goal } from '@/models/Goal';
import { json, badRequest, unauthorized, notFound, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';

import { isNonEmptyString, toNumber } from '../../_helpers/validate';

const allowed: ProgressStatus[] = ['Not Started', 'On Track', 'Completed'];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (!isValidObjectId(params.id)) return badRequest('Invalid id');

    const body = await req.json();

    const checkin = await Checkin.findById(params.id);
    if (!checkin) return notFound('Check-in not found');

    const progressStatus = body?.progressStatus;
    const managerComment = body?.managerComment;

    // Role-based field restrictions:
    // - employee: can update plannedTarget/actualAchievement/progressStatus; cannot edit managerComment
    // - manager: can update managerComment and progressStatus; cannot change planned/actual numbers
    // - admin: can edit everything
    const isEmployee = auth.role === 'employee';
    const isManager = auth.role === 'manager';
    const isAdmin = auth.role === 'admin';

    const updates: any = {};

    const forbiddenForEmployee = new Set(['managerComment']);
    const forbiddenForManager = new Set(['plannedTarget', 'actualAchievement']);

    if (body?.plannedTarget !== undefined) {
      const v = toNumber(body.plannedTarget);
      if (v === null) return badRequest('Invalid plannedTarget');
      updates.plannedTarget = v;
    }
    if (body?.actualAchievement !== undefined) {
      const v = toNumber(body.actualAchievement);
      if (v === null) return badRequest('Invalid actualAchievement');
      updates.actualAchievement = v;
    }

    if (progressStatus !== undefined) {
      if (!allowed.includes(progressStatus)) return badRequest('Invalid progressStatus');
      updates.progressStatus = progressStatus;
    }

    if (managerComment !== undefined) {
      if (!isNonEmptyString(managerComment)) return badRequest('Invalid managerComment');
      updates.managerComment = managerComment.trim();
    }

    // Score will be recomputed after saving if plannedTarget/actualAchievement changed.

    if (!Object.keys(updates).length) return badRequest('No valid fields provided');

    // Enforce field-level RBAC based on which fields the caller attempted to update.
    if (isEmployee) {
      for (const k of Object.keys(updates)) {
        if (forbiddenForEmployee.has(k)) {
          return json({ ok: false, error: { message: `Forbidden field for employee: ${k}` } }, { status: 403 });
        }
      }
    }

    if (isManager) {
      for (const k of Object.keys(updates)) {
        if (forbiddenForManager.has(k)) {
          return json({ ok: false, error: { message: `Forbidden field for manager: ${k}` } }, { status: 403 });
        }
      }
    }

    if (!isAdmin) {
      // Admin bypasses the checks above; for others ensure we didn't attempt to change forbidden fields.
    }


    checkin.set(updates);

    // Persist first so checkin has updated plannedTarget/actualAchievement
    await checkin.save();

    // Load metricDirection + deadline to compute score
    const goalDoc = await Goal.findById(checkin.goalId)
      .select('deadline metricDirection')
      .lean<any>();


    const { calculateScore } = await import('@/utils/scoring');

    const computedScore = calculateScore({
      direction: goalDoc?.metricDirection ?? 'Min',
      target: checkin.plannedTarget,
      achievement: checkin.actualAchievement,
      deadline: goalDoc?.deadline,
      completionDate: undefined,
    });

    checkin.computedScore = computedScore;
    await checkin.save();

    // Sync shared goal achievements if this is the primary owner
    const goal = (await Goal.findById(checkin.goalId)
      .select('isShared parentGoalId')
      .lean<{ isShared?: boolean; parentGoalId?: string | null }>());

    if (goal?.isShared && !goal.parentGoalId) {
      const parentId = (goal as any)._id ? String((goal as any)._id) : String(checkin.goalId);
      const children = await Goal.find({ parentGoalId: parentId }).select('_id').lean();
      for (const child of children) {
        await Checkin.findOneAndUpdate(
          { goalId: String(child._id), quarter: checkin.quarter },
          {
            plannedTarget: checkin.plannedTarget,
            actualAchievement: checkin.actualAchievement,
            progressStatus: checkin.progressStatus,
            managerComment: 'Synced from shared goal primary owner',
          },
          { upsert: true }
        );
      }
    }

    return json({ ok: true, data: checkin });
  } catch (e: any) {
    return serverError('Failed to update check-in', e?.message);
  }
}

