import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { Goal } from '@/models/Goal';
import { User } from '@/models/User';
import { json, badRequest, unauthorized, notFound, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../_helpers/auth';
import { isNonEmptyString, toDate, toNumber } from '../_helpers/validate';
import { validateGoalWeightageRules } from '../_helpers/weightage';
import { getCurrentCyclePhase } from '../_helpers/schedule';
import { CycleWindow } from '@/models/CycleWindow';

function normalizeStatus(v: unknown) {
  return typeof v === 'string' ? v.trim() : v;
}

export async function POST(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    // Enforce schedule for non-admins (admin bypasses automatically)
    if (auth.role !== 'admin') {
      const override = await CycleWindow.findOne({ phase: 'GOAL_SETTING', override: true }).lean<{ isOpen?: boolean } | null>();
      const isOpen = override?.isOpen ?? (getCurrentCyclePhase() === 'GOAL_SETTING');

      if (!isOpen) {
        return json({ ok: false, error: { message: 'Goal setting window is closed. (Opens in May)' } }, { status: 403 });
      }
    }

    const body = await req.json();

    const currentUser = await User.findOne({ uid: auth.uid }).select('employeeId').lean<{ employeeId: string } | null>();

    // employeeId required for scoping weight validations
    let employeeId = body?.employeeId;

    if (employeeId === 'me' || !employeeId) {
      employeeId = currentUser?.employeeId || auth.uid;
    }

    if (typeof employeeId !== 'string') return badRequest('employeeId must be a string');

    const title = body?.title;
    const description = body?.description;
    const thrustArea = body?.thrustArea;
    let uomType = body?.uomType;

    // Normalize UOM Type
    if (typeof uomType === 'string') {
      const lower = uomType.toLowerCase().trim();
      if (lower === 'percentage' || lower === '%') {
        uomType = '%';
      } else if (lower === 'numeric') {
        uomType = 'Numeric';
      } else if (lower === 'timeline') {
        uomType = 'Timeline';
      } else if (lower === 'zero-based') {
        uomType = 'Zero-based';
      }
    }

    const target = toNumber(body?.target);
    const weightage = toNumber(body?.weightage);
    const deadline = toDate(body?.deadline);
    const status = normalizeStatus(body?.status) as string | undefined;
    const approvalStatus = normalizeStatus(body?.approvalStatus) as string | undefined;
    const locked = body?.locked;

    const allowedRoleToCreate = ['employee', 'manager', 'admin'];
    if (!allowedRoleToCreate.includes(auth.role)) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    // Scope: employees create for themselves. Managers/Admin can create for any employeeId.
    if (auth.role === 'employee' && employeeId !== (currentUser?.employeeId || auth.uid)) {
      return json({ ok: false, error: { message: 'Forbidden: can only create goals for self' } }, { status: 403 });
    }

    if (!isNonEmptyString(title) || !isNonEmptyString(thrustArea) || !isNonEmptyString(uomType) || !isNonEmptyString(description)) {
      console.log('400: Missing fields', { title, thrustArea, uomType, description });
      return badRequest('Missing required fields: title, thrustArea, uomType, or description');
    }
    const normalizedDesc = description.trim();

    if (target === null) {
      console.log('400: Invalid target', { target: body?.target });
      return badRequest('Invalid target');
    }
    if (weightage === null) {
      console.log('400: Invalid weightage', { weightage: body?.weightage });
      return badRequest('Invalid weightage');
    }
    if (!deadline) {
      console.log('400: Invalid deadline', { deadline: body?.deadline });
      return badRequest('Invalid deadline');
    }

    // Check if employee goals are already locked
    const existingGoals = await Goal.find({ employeeId }).select({ weightage: 1, locked: 1 }).lean();
    const isLocked = existingGoals.some((g: any) => g.locked);
    if (isLocked && auth.role !== 'admin') {
      console.log('400: Plan locked', { employeeId });
      return json({ ok: false, error: { message: 'Goal plan is locked and cannot be modified.' } }, { status: 400 });
    }

    const existingWeightSum = existingGoals.reduce((acc, g: any) => acc + (Number(g.weightage) || 0), 0);

    // Max 8 goals per employee
    const countAfter = existingGoals.length + 1;

    // total weightage must equal 100
    const rules = validateGoalWeightageRules({
      incomingTotalWeightage: 100,
      incomingWeightage: weightage,
      existingGoalsWeightageSum: existingWeightSum,
      incomingEmployeeGoalsCountAfter: countAfter,
    });

    if (!rules.ok) {
      console.log('400: Weightage rules failed', rules.message);
      return json({ ok: false, error: { message: rules.message } }, { status: 400 });
    }

    // Minimum individual weightage
    if (weightage < 10) {
      console.log('400: Min weightage failed', { weightage });
      return json({ ok: false, error: { message: 'Each goal weightage must be at least 10' } }, { status: 400 });
    }

    const goal = await Goal.create({
      employeeId,
      createdBy: auth.uid,
      title: title.trim(),
      description: normalizedDesc,
      thrustArea: thrustArea.trim(),
      uomType: uomType.trim(),
      target,
      weightage,
      deadline,
      status: status ?? 'Active',
      approvalStatus: approvalStatus ?? 'Pending',
      managerComment: '', // Ensure default value is set
      locked: locked ?? false,
    });

    return json({
      ok: true,
      data: goal,
    }, 201);
  } catch (e: any) {
    if (e.name === 'ValidationError') {
      const messages = Object.values(e.errors).map((err: any) => err.message).join(', ');
      return json({ ok: false, error: { message: `Validation Error: ${messages}`, detail: e.message } }, { status: 400 });
    }
    console.error('POST /api/goals error:', e);
    return serverError('Failed to create goal', e?.message);
  }
}

export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    let filter: Record<string, unknown> = {};

    if (auth.role === 'employee') {
      const user = await User.findOne({ uid: auth.uid }).select('employeeId').lean<{ employeeId: string } | null>();
      filter = { employeeId: user?.employeeId || auth.uid };
    }

    const goals = await Goal.find(filter).sort({ createdAt: -1 }).lean();
    return json({ ok: true, data: goals });
  } catch (e: any) {
    return serverError('Failed to fetch goals', e?.message);
  }
}
