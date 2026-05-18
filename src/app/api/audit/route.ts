import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../_helpers/auth';

export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth || auth.role !== 'admin') {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    return json({ ok: true, data: logs });
  } catch (e: any) {
    return serverError('Failed to fetch audit logs', e?.message);
  }
}
