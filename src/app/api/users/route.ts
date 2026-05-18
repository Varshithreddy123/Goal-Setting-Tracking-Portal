import type { NextRequest } from 'next/server';

import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { json, unauthorized } from '@/utils/api';
import { getAuthFromRequest } from '../_helpers/auth';

export async function GET(req: NextRequest) {
  await connectToMongo();

  const auth = await getAuthFromRequest(req);

  if (!auth) return unauthorized('Missing session');
  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
  }

  const query: any = {};
  if (auth.role === 'manager') {
    // Managers can see all employees to potentially add them to their team
    query.role = 'employee';
  }

  const users = await User.find(query, { uid: 1, employeeId: 1, name: 1, email: 1, role: 1, department: 1, managerId: 1, isActive: 1 })
    .sort({ createdAt: -1 })
    .lean();

  return json({ ok: true, data: users });
}



