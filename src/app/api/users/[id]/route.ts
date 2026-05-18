import type { NextRequest } from 'next/server';
import { isValidObjectId } from 'mongoose';

import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { json, badRequest, notFound, serverError, unauthorized } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';

import { firebaseAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

function pickUserUpdateFields(body: any) {
  const allowed: Array<keyof Pick<any, 'name' | 'email' | 'role' | 'department' | 'managerId' | 'isActive' | 'employeeId'>> = [
    'employeeId',
    'name',
    'email',
    'role',
    'department',
    'managerId',
    'isActive',
  ];
  const out: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body?.[k] !== undefined) out[k as string] = body[k];
  }
  return out;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing session');

    if (!isValidObjectId(params.id)) return badRequest('Invalid id');

    const user = await User.findById(params.id)
      .select({ uid: 1, employeeId: 1, name: 1, email: 1, role: 1, department: 1, managerId: 1, isActive: 1 })
      .lean<any | null>();

    if (!user) return notFound('User not found');

    if (auth.role !== 'admin') {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    return json({ ok: true, data: user });
  } catch (e: any) {
    return serverError('Failed to fetch user', e?.message);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToMongo();

  const auth = await getAuthFromRequest(req);
  if (!auth) return unauthorized('Missing session');

  const isAdmin = auth.role === 'admin';
  const isManager = auth.role === 'manager';

  if (!isAdmin && !isManager) {
    return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
  }

  if (!isValidObjectId(params.id)) return badRequest('Invalid id');

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return badRequest('Invalid JSON body');

  const existing = await User.findById(params.id);
  if (!existing) return notFound('User not found');

  const updates = pickUserUpdateFields(body);
  if (!Object.keys(updates).length) return badRequest('No valid fields provided');

  // RBAC checks for updates
  if (isManager) {
    // Managers can ONLY update managerId
    const keys = Object.keys(updates);
    if (keys.length > 1 || keys[0] !== 'managerId') {
      return json({ ok: false, error: { message: 'Managers can only update managerId' } }, { status: 403 });
    }

    // Managers can ONLY assign to themselves or remove from their team
    const managerProfile = await User.findOne({ uid: auth.uid }).select('employeeId').lean<any>();
    if (!managerProfile) return unauthorized('Manager profile not found');

    const isAddingToSelf = updates.managerId === managerProfile.employeeId;
    const isRemovingFromSelf = updates.managerId === null && existing.managerId === managerProfile.employeeId;

    if (!isAddingToSelf && !isRemovingFromSelf) {
      return json({ ok: false, error: { message: 'Managers can only assign members to their own team or remove them' } }, { status: 403 });
    }
  }

  if (updates.role !== undefined && !isAdmin) {
    return json({ ok: false, error: { message: 'Only admin can change role' } }, { status: 403 });
  }

  if (typeof updates.employeeId === 'string') updates.employeeId = updates.employeeId.trim();
  if (typeof updates.name === 'string') updates.name = updates.name.trim();
  if (typeof updates.department === 'string') updates.department = updates.department.trim();
  if (typeof updates.email === 'string') updates.email = updates.email.toLowerCase().trim();
  if (typeof updates.managerId === 'string') updates.managerId = updates.managerId.trim();

  try {
    existing.set(updates);
    await existing.save();

    return json({
      ok: true,
      data: {
        id: existing._id,
        employeeId: existing.employeeId,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        department: existing.department,
        managerId: (existing as any).managerId,
        isActive: (existing as any).isActive,
      },
    });
  } catch (e: any) {
    return serverError('Failed to update user', e?.message);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing session');

    if (auth.role !== 'admin') {
      return json({ ok: false, error: { message: 'Only admin can delete users' } }, { status: 403 });
    }

    if (!isValidObjectId(params.id)) return badRequest('Invalid id');

    const res = await User.findById(params.id);
    if (!res) return notFound('User not found');

    const uid = (res as any).uid as string | undefined;

    // Delete from Firebase Auth first, then MongoDB.
    if (uid && !uid.startsWith('mock-')) {
      try {
        const adminAuth = getAuth(firebaseAdminApp);
        await adminAuth.deleteUser(uid);
      } catch (fbError: any) {
        // If user not found in Firebase, we still want to delete from Mongo
        if (fbError.code !== 'auth/user-not-found') {
          console.error('Firebase delete user error:', fbError);
          return serverError('Failed to delete user from Firebase', fbError.message);
        }
      }
    }

    await User.findByIdAndDelete(params.id);

    return json({ ok: true, data: { message: 'User deleted' } });
  } catch (e: any) {
    console.error('CRITICAL: Failed to delete user:', e);
    return serverError('Failed to delete user', e?.message);
  }
}
