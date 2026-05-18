import type { NextRequest } from 'next/server';
import { isValidObjectId } from 'mongoose';

import { connectToMongo } from '@/lib/mongodb';
import { Goal } from '@/models/Goal';
import { User } from '@/models/User';
import { json, badRequest, unauthorized, notFound, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';
import { isNonEmptyString, toDate, toNumber } from '../../_helpers/validate';
import { validateGoalWeightageRules } from '../../_helpers/weightage';

function normalizeStatus(v: unknown) {
  return typeof v === 'string' ? v.trim() : v;
}

function mapApprovalStatus(rawApprovalStatus: unknown) {
  const raw = normalizeStatus(rawApprovalStatus);
  const lower = typeof raw === 'string' ? raw.toLowerCase() : '';

  if (lower === 'approved') return 'Approved';
  if (lower === 'rejected') return 'Rejected';
  if (lower === 'pending') return 'Pending';

  return 'Pending';
}

async function getCurrentEmployeeId(authUid: string) {
  const user = await User.findOne({ uid: authUid }).select('employeeId').lean<{ employeeId: string } | null>();
  return user?.employeeId || authUid;
}

async function managerOwnsGoal(managerEmployeeId: string, goalEmployeeId: string) {
  const owner = await User.findOne({ employeeId: goalEmployeeId })
    .select('managerId')
    .lean<{ managerId?: string | null } | null>();
  return owner?.managerId === managerEmployeeId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (!isValidObjectId(params.id)) return badRequest('Invalid id');

    const goal = await Goal.findById(params.id).lean<{ employeeId: string } | null>();
    if (!goal) return notFound('Goal not found');

    const currentEmployeeId = await getCurrentEmployeeId(auth.uid);

    if (auth.role === 'employee' && (goal as any).employeeId !== currentEmployeeId) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    if (auth.role === 'manager' && !(await managerOwnsGoal(currentEmployeeId, (goal as any).employeeId))) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    return json({ ok: true, data: goal });
  } catch (e: any) {
    return serverError('Failed to fetch goal', e?.message);
  }
}

import { AuditLog } from '@/models/AuditLog';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (!isValidObjectId(params.id)) return badRequest('Invalid id');

    const body = await req.json();

    const goal = await Goal.findById(params.id);
    if (!goal) return notFound('Goal not found');

    const oldValues = goal.toObject();

    const currentEmployeeId = await getCurrentEmployeeId(auth.uid);

    if (auth.role === 'employee' && goal.employeeId !== currentEmployeeId) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    if (auth.role === 'manager' && !(await managerOwnsGoal(currentEmployeeId, goal.employeeId))) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const isEmployee = auth.role === 'employee';
    const isManager = auth.role === 'manager';
    const isAdmin = auth.role === 'admin';

    // Lock governance (BRD Fix A)
    // - Employees: cannot edit locked goals
    // - Managers: when locked, can update approval fields plus review adjustments shown in the approvals UI
    // - Admin: full access
    if (goal.locked && !isAdmin) {
      if (isEmployee) {
        return json({ ok: false, error: { message: 'Locked goals cannot be edited' } }, { status: 403 });
      }

      // Manager + locked: enforce allowed fields
      if (isManager) {
        const attemptedFields = new Set(Object.keys(body || {}));
        const managerAllowedFields = new Set(['approvalStatus', 'managerComment', 'target', 'weightage']);
        const invalidFields = Array.from(attemptedFields).filter((f) => !managerAllowedFields.has(f));

        if (invalidFields.length > 0) {
          return json(
            {
              ok: false,
              error: { message: `Forbidden field(s) for locked goal by manager: ${invalidFields.join(', ')}` },
            },
            { status: 403 }
          );
        }
      }
    }

    const updates: any = {};

    // Shared recipient restrictions (BRD Fix B)
    // If it's a shared recipient copy (isShared=true and parentGoalId exists), employee can update ONLY weightage.
    const isSharedRecipient = goal.isShared === true && !!goal.parentGoalId;
    const sharedRecipientAllowedFields = new Set(['weightage']);

    if (isEmployee && isSharedRecipient) {
      const attemptedFields = Object.keys(body || {});
      const invalidFields = attemptedFields.filter((f) => !sharedRecipientAllowedFields.has(f));
      if (invalidFields.length > 0) {
        return json(
          {
            ok: false,
            error: { message: `Forbidden field(s) for shared goal recipient: ${invalidFields.join(', ')}` },
          },
          { status: 403 }
        );
      }
    }

    // Parse/normalize allowed updates
    if (body?.title !== undefined) {
      if (!isNonEmptyString(body.title)) return badRequest('Invalid title');
      updates.title = body.title.trim();
    }
    if (body?.description !== undefined) {
      updates.description = typeof body.description === 'string' ? body.description.trim() : '';
    }
    if (body?.thrustArea !== undefined) {
      if (!isNonEmptyString(body.thrustArea)) return badRequest('Invalid thrustArea');
      updates.thrustArea = body.thrustArea.trim();
    }
    if (body?.uomType !== undefined) {
      if (!isNonEmptyString(body.uomType)) return badRequest('Invalid uomType');
      let uom = body.uomType.trim();
      const lower = uom.toLowerCase();
      if (lower === 'percentage' || lower === '%') {
        uom = '%';
      } else if (lower === 'numeric') {
        uom = 'Numeric';
      } else if (lower === 'timeline') {
        uom = 'Timeline';
      } else if (lower === 'zero-based') {
        uom = 'Zero-based';
      }
      updates.uomType = uom;
    }
    if (body?.target !== undefined) {
      const t = toNumber(body.target);
      if (t === null) return badRequest('Invalid target');
      updates.target = t;
    }
    if (body?.weightage !== undefined) {
      const incomingWeightage = toNumber(body.weightage);
      if (incomingWeightage === null) return badRequest('Invalid weightage');
      updates.weightage = incomingWeightage;

      if (incomingWeightage < 10) {
        return json({ ok: false, error: { message: 'Each goal weightage must be at least 10' } }, { status: 400 });
      }
    }
    if (body?.deadline !== undefined) {
      const incomingDeadline = toDate(body.deadline);
      if (!incomingDeadline) return badRequest('Invalid deadline');
      updates.deadline = incomingDeadline;
    }
    if (body?.status !== undefined) updates.status = normalizeStatus(body.status);

    if (body?.approvalStatus !== undefined) {
      const raw = normalizeStatus(body.approvalStatus);
      const lower = typeof raw === 'string' ? raw.toLowerCase() : '';
      const mappedApprovalStatus =
        lower === 'approved' ? 'Approved' : lower === 'rejected' ? 'Rejected' : 'Pending';
      updates.approvalStatus = mappedApprovalStatus;

      // Return for rework: auto-unlock
      if (mappedApprovalStatus === 'Rejected') {
        updates.locked = false;
      }
      if (mappedApprovalStatus === 'Approved') {
        updates.locked = true;
      }
    }

    if (body?.locked !== undefined) {
      if (typeof body.locked !== 'boolean') return badRequest('locked must be boolean');
      // Only admin can explicitly update locked
      if (!isAdmin) return json({ ok: false, error: { message: 'Only admin can set locked' } }, { status: 403 });
      updates.locked = body.locked;
    }

    // Additional RBAC field restrictions for unlocked goals
    // (keeps the prior design while ensuring BRD Fixes above still win)
    const forbiddenForEmployee = new Set(['approvalStatus', 'locked']);
    const forbiddenForManager = new Set([
      'title',
      'description',
      'thrustArea',
      'uomType',
      'deadline',
      'employeeId',
      'locked',
    ]);

    // If manager tries to unlock via locked field (non-rejected), forbid.
    if (isManager && body?.locked !== undefined) {
      if (!(updates.approvalStatus === 'Rejected' && updates.locked === false)) {
        return json({ ok: false, error: { message: 'Forbidden field for manager: locked' } }, { status: 403 });
      }
    }

    if (isEmployee) {
      for (const k of Object.keys(updates)) {
        if (forbiddenForEmployee.has(k)) {
          return json({ ok: false, error: { message: `Forbidden field for employee: ${k}` } }, { status: 403 });
        }
      }
    }

    if (isManager) {
      for (const k of Object.keys(updates)) {
        if (k === 'locked' && (updates.approvalStatus === 'Rejected' || updates.approvalStatus === 'Approved')) continue;
        if (forbiddenForManager.has(k)) {
          return json({ ok: false, error: { message: `Forbidden field for manager: ${k}` } }, { status: 403 });
        }
      }
    }

    // Validate weightage cross-sum when weightage is updated
    if (updates.weightage !== undefined) {
      const employeeId = goal.employeeId;
      const otherGoals = await Goal.find({ employeeId, _id: { $ne: goal._id } })
        .select({ weightage: 1 })
        .lean<{ weightage: number }[]>();

      const otherSum = otherGoals.reduce((acc, g) => acc + (Number(g.weightage) || 0), 0);

      const rules = validateGoalWeightageRules({
        incomingTotalWeightage: 100,
        incomingWeightage: updates.weightage,
        existingGoalsWeightageSum: otherSum,
        incomingEmployeeGoalsCountAfter: otherGoals.length + 1,
      });

      if (!rules.ok) return json({ ok: false, error: { message: rules.message } }, { status: 400 });
    }

    // Persist
    goal.set(updates);
    await goal.save();

    // Log changes if goal was locked
    if (oldValues.locked) {
      await AuditLog.create({
        goalId: params.id,
        changedBy: auth.uid,
        changeType: 'UPDATE',
        oldValues,
        newValues: goal.toObject(),
        reason: body.reason || 'Admin override after lock',
      });
    }

    return json({ ok: true, data: goal });
  } catch (e: any) {
    if (e.name === 'ValidationError') {
      const messages = Object.values(e.errors).map((err: any) => err.message).join(', ');
      return json({ ok: false, error: { message: `Validation Error: ${messages}`, detail: e.message } }, { status: 400 });
    }
    return serverError('Failed to update goal', e?.message);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (!isValidObjectId(params.id)) return badRequest('Invalid id');

    const goal = await Goal.findById(params.id).lean<{ employeeId: string; locked: boolean } | null>();
    if (!goal) return notFound('Goal not found');

    const currentEmployeeId = await getCurrentEmployeeId(auth.uid);

    if (auth.role === 'employee' && goal.employeeId !== currentEmployeeId) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    if (auth.role === 'manager' && !(await managerOwnsGoal(currentEmployeeId, goal.employeeId))) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    if (goal.locked && auth.role !== 'admin') {
      return json({ ok: false, error: { message: 'Goal is locked and cannot be deleted' } }, { status: 400 });
    }

    await Goal.findByIdAndDelete(params.id);
    return json({ ok: true, data: { message: 'Goal deleted' } });
  } catch (e: any) {
    return serverError('Failed to delete goal', e?.message);
  }
}

