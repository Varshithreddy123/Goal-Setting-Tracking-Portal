import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { Goal } from '@/models/Goal';
import { User } from '@/models/User';
import { json, badRequest, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';

import { isNonEmptyString, toDate, toNumber } from '../../_helpers/validate';
import { validateGoalWeightageRules } from '../../_helpers/weightage';

export async function POST(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'manager')) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const body = await req.json();
    const { employeeIds, title, description, thrustArea, uomType, target, weightage, deadline } = body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return badRequest('employeeIds must be a non-empty array');
    }

    if (!isNonEmptyString(title) || !isNonEmptyString(thrustArea) || !isNonEmptyString(uomType)) {
      return badRequest('Missing required fields: title, thrustArea, or uomType');
    }

    const normalizedDescription = typeof description === 'string' ? description.trim() : '';

    const t = toNumber(target);
    const w = toNumber(weightage);
    const d = toDate(deadline);

    if (t === null || w === null || !d) {
      return badRequest('Invalid target, weightage or deadline');
    }

    if (w < 10) {
      return json({ ok: false, error: { message: 'Each goal weightage must be at least 10' } }, { status: 400 });
    }

    const recipients = await User.find({ employeeId: { $in: employeeIds } })
      .select('employeeId managerId')
      .lean<{ employeeId: string; managerId?: string | null }[]>();

    if (recipients.length !== employeeIds.length) {
      return badRequest('One or more employeeIds are invalid');
    }

    if (auth.role === 'manager') {
      const manager = await User.findOne({ uid: auth.uid }).select('employeeId').lean<{ employeeId: string } | null>();
      if (!manager) return unauthorized('Manager profile not found');

      const outsideTeam = recipients.find((u) => u.managerId !== manager.employeeId);
      if (outsideTeam) {
        return json({ ok: false, error: { message: 'Managers can only push shared goals to their own team' } }, { status: 403 });
      }
    }

    for (const empId of employeeIds) {
      const existingGoals = await Goal.find({ employeeId: empId }).select({ weightage: 1 }).lean<{ weightage: number }[]>();
      const existingWeightSum = existingGoals.reduce((acc, g) => acc + (Number(g.weightage) || 0), 0);
      const rules = validateGoalWeightageRules({
        incomingTotalWeightage: 100,
        incomingWeightage: w,
        existingGoalsWeightageSum: existingWeightSum,
        incomingEmployeeGoalsCountAfter: existingGoals.length + 1,
      });

      if (!rules.ok) {
        return json({ ok: false, error: { message: `${empId}: ${rules.message}` } }, { status: 400 });
      }
    }

    // Create the parent goal first
    const parentGoal = await Goal.create({
      employeeId: 'SHARED', // Special ID for parent
      createdBy: auth.uid,
      title: title.trim(),
      description: normalizedDescription,
      thrustArea: thrustArea.trim(),
      uomType: uomType.trim(),
      target: t,
      weightage: w,
      deadline: d,
      status: 'Active',
      approvalStatus: 'Approved',
      managerComment: '',
      locked: true,
      isShared: true,
      parentGoalId: null,
    });

    const sharedGoals = [];
    for (const empId of employeeIds) {
      const g = await Goal.create({
        employeeId: empId,
        createdBy: auth.uid,
        title: title.trim(),
        description: normalizedDescription,
        thrustArea: thrustArea.trim(),
        uomType: uomType.trim(),
        target: t,
        weightage: w,
        deadline: d,
        status: 'Active',
        approvalStatus: 'Approved', // Shared goals are usually pre-approved
        managerComment: '',
        locked: false, // Allow employee to adjust weightage
        isShared: true,
        parentGoalId: String(parentGoal._id),
      });
      sharedGoals.push(g);
    }

    return json({ ok: true, data: { parentGoal, sharedGoals } }, 201);
  } catch (e: any) {
    console.error('CRITICAL: Shared Goal Creation Error:', e);
    return serverError('Failed to share goals', e?.message);
  }
}
