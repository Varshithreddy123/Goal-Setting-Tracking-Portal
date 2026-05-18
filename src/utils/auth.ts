import { json } from './api';

export type AuthRole = 'employee' | 'manager' | 'admin';

export type AuthUser = {
  uid: string;
  email: string;
};

export type MockAuth = AuthUser & {
  role: AuthRole;
};

/**
 * Real auth helper.
 *
 * Server endpoints should rely on the cookie-based session (`src/lib/session.ts`).
 * This file previously contained mock/trust-based helpers.
 */
export function requireAuth(auth: AuthUser | null) {
  if (!auth) {
    return json({ ok: false, error: { message: 'Unauthorized' } }, 401);
  }
  return null;
}



