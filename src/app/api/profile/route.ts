import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../_helpers/auth';

export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    const user = await User.findOne({ uid: auth.uid }).lean();
    if (!user) return unauthorized('User profile not found');

    return json({ ok: true, data: user });
  } catch (e: any) {
    return serverError('Failed to fetch profile', e?.message);
  }
}
