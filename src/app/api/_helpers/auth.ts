import type { NextRequest } from 'next/server';
import { type MockAuth } from '../../../utils/auth';
import { getSessionUser } from '@/lib/session';

export async function getAuthFromRequest(_req: NextRequest): Promise<MockAuth | null> {
  const session = getSessionUser();
  if (!session) return null;
  return { uid: session.uid, email: session.email, role: session.role };
}



