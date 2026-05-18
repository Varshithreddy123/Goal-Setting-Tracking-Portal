import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { json, unauthorized, serverError } from '@/utils/api';
import { getSessionUser } from '@/lib/session';

export async function GET(_req: NextRequest) {
  await connectToMongo();

  try {
    const session = getSessionUser();
    if (!session) return unauthorized('Missing session');

    const user = await User.findOne({ uid: session.uid }).lean();
    if (!user) return unauthorized('User not found');
    if (!(user as any).isActive) return unauthorized('Account is inactive');

    return json({
      ok: true,
      data: {
        id: (user as any)._id,
        employeeId: (user as any).employeeId,
        uid: session.uid,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
        department: (user as any).department,
        managerId: (user as any).managerId,
        isActive: (user as any).isActive,

      },
    });
  } catch (e: any) {
    return serverError('Failed to fetch user', e?.message);
  }
}



