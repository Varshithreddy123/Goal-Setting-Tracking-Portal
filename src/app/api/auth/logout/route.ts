import type { NextRequest } from 'next/server';
import { json } from '@/utils/api';
import { clearSessionUser } from '@/lib/session';

export async function POST(_req: NextRequest) {
  clearSessionUser();
  return json({ ok: true, data: { message: 'Logged out' } });
}


