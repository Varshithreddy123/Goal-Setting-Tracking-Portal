import type { NextRequest } from 'next/server';
import { isValidObjectId } from 'mongoose';

import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { json, badRequest, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';


import { firebaseAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const ORG_EMAIL_DOMAIN = process.env.ORG_EMAIL_DOMAIN ?? 'atomberg.com';

function assertAdmin(auth: Awaited<ReturnType<typeof getAuthFromRequest>>) {
  if (!auth) return false;
  return auth.role === 'admin';
}

export async function POST(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!assertAdmin(auth)) {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Invalid JSON body');

    const employeeId = typeof body?.employeeId === 'string' ? body.employeeId.trim() : null;
    const name = typeof body?.name === 'string' ? body.name.trim() : null;
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : null;
    const role = body?.role;
    const department = typeof body?.department === 'string' ? body.department.trim() : null;
    const managerId = typeof body?.managerId === 'string' ? body.managerId.trim() : null;
    const isActive = typeof body?.isActive === 'boolean' ? body.isActive : true;
    const temporaryPassword = typeof body?.temporaryPassword === 'string' ? body.temporaryPassword : null;

    const allowedRoles = ['employee', 'manager', 'admin'] as const;
    if (!employeeId || !name || !email || !department || !temporaryPassword) {
      return badRequest('Missing/invalid fields: employeeId, name, email, department, temporaryPassword');
    }
    if (!allowedRoles.includes(role)) return badRequest('Invalid role');

    const allowedEmail = email.endsWith(`@${ORG_EMAIL_DOMAIN}`);
    if (!allowedEmail) return badRequest(`Email must be an organization email: @${ORG_EMAIL_DOMAIN}`);

    // Uniqueness checks (MongoDB)
    const existingByEmployeeId = await User.findOne({ employeeId }).lean();
    if (existingByEmployeeId) return badRequest('employeeId already exists');

    const existingByEmail = await User.findOne({ email }).lean();
    if (existingByEmail) return badRequest('email already exists');

    // Create Firebase user
    const adminAuth = getAuth(firebaseAdminApp);

    let fbUser;
    try {
      fbUser = await adminAuth.createUser({
        email,
        password: temporaryPassword,
        displayName: name,
        disabled: !isActive,
      });
    } catch (fbError: any) {
      // If user already exists in Firebase but not in Mongo, we might want to handle it.
      // For now, just return the error.
      console.error('Firebase createUser error:', fbError);
      return json({ ok: false, error: { message: fbError.message || 'Firebase user creation failed' } }, { status: 400 });
    }

    const uid = fbUser.uid;

    try {
      // Set Custom Claims for RBAC
      await adminAuth.setCustomUserClaims(uid, { role });

      const mongoUser = await User.create({
        uid,
        employeeId,
        name,
        email,
        role,
        department,
        managerId: managerId || null,
        isActive,
      });

      return json({ ok: true, data: mongoUser });
    } catch (mongoError: any) {
      console.error('MongoDB User.create error:', mongoError);
      // Rollback Firebase user creation if Mongo fails to keep them in sync
      await adminAuth.deleteUser(uid).catch((err) => console.error('Firebase rollback delete failed:', err));
      return serverError('Failed to create user record in database', mongoError?.message);
    }
  } catch (e: any) {
    console.error('CRITICAL: Failed to create user:', e);
    return serverError('Failed to create user', e?.message);
  }
}

