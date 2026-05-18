import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { json, badRequest, unauthorized, serverError } from '@/utils/api';

import { setSessionUser } from '@/lib/session';
import { firebaseAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

const ORG_EMAIL_DOMAIN = process.env.ORG_EMAIL_DOMAIN ?? 'atomberg.com';

export async function POST(req: NextRequest) {
  await connectToMongo();

  try {
    const body = await req.json().catch(() => null);

    // Recommended path: backend verifies token with firebase-admin.
    // Frontend should send: { idToken }
    const idToken: unknown = body?.idToken;

    if (typeof idToken === 'string' && idToken.trim()) {
      const decoded = await getAuth(firebaseAdminApp).verifyIdToken(
        idToken.trim()
      );

      const uid = decoded.uid;
      const tokenEmail = (decoded.email ?? '').toLowerCase().trim();

      if (!uid || !tokenEmail) {
        return unauthorized('Unauthorized: token missing uid/email');
      }

      if (!tokenEmail.endsWith(`@${ORG_EMAIL_DOMAIN}`)) {
        return unauthorized('Unauthorized: outside organization email');
      }

      // Validate the Firebase uid exists in our system
      const user = await User.findOne({ uid }).lean();
      if (!user) return unauthorized('User not found');
      if (!(user as any).isActive) return unauthorized('Account is inactive');

      const role = (user as any).role as 'employee' | 'manager' | 'admin';
      if (!role) return unauthorized('User role missing/invalid');

      setSessionUser({ uid, email: tokenEmail, role });

      return json({
        ok: true,
        data: {
          uid,
          email: tokenEmail,
          role,
          redirect:
            role === 'employee'
              ? '/dashboard/employee'
              : role === 'manager'
                ? '/dashboard/manager'
                : '/dashboard/admin',
        },
      });
    }

    // Backward-compatible fallback for the current hackathon login form.
    // Frontend currently sends: { uid, email }.
    const uid: unknown = body?.uid;
    const email: unknown = body?.email;

    if (typeof uid !== 'string' || typeof email !== 'string') {
      return badRequest('Missing or invalid fields. Required: idToken (or uid+email for legacy login)');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith(`@${ORG_EMAIL_DOMAIN}`)) {
      return unauthorized('Unauthorized: outside organization email');
    }

    // IMPORTANT: trust uid for user lookup; email is only used for org-domain validation.
    const user = await User.findOne({ uid }).lean();
    if (!user) return unauthorized('User not found');
    if (!(user as any).isActive) return unauthorized('Account is inactive');

    const role = (user as any).role as 'employee' | 'manager' | 'admin';
    if (!role) return unauthorized('User role missing/invalid');

    setSessionUser({ uid, email: normalizedEmail, role });

    return json({
      ok: true,
      data: {
        uid,
        email: normalizedEmail,
        role,
        redirect:
          role === 'employee'
            ? '/dashboard/employee'
            : role === 'manager'
              ? '/dashboard/manager'
              : '/dashboard/admin',
      },
    });
  } catch (e: any) {
    console.error('Login verification error:', e);
    return serverError('Failed to login', e?.message);
  }
}

