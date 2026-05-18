import { cookies } from 'next/headers';

export type SessionUser = {
  uid: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
};

const SESSION_COOKIE = 'gt_session_v1';

export function getSessionUser(): SessionUser | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    if (!parsed?.uid || !parsed?.email || !parsed?.role) return null;
    if (!['employee', 'manager', 'admin'].includes(parsed.role)) return null;
    return { uid: parsed.uid, email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser) {
  cookies().set(SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionUser() {
  cookies().set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

