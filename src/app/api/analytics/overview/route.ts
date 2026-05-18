import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Goal } from '@/models/Goal';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';


export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (auth.role !== 'admin') {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const [totalEmployees, totalGoals, goalsByStatus] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      Goal.countDocuments({}),
      Goal.aggregate([
        {
          $group: {
            _id: '$approvalStatus',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const statusCounts = {
      Pending: 0,
      Submitted: 0,
      Approved: 0,
      Rejected: 0
    };

    goalsByStatus.forEach(item => {
      if (item._id in statusCounts) {
        statusCounts[item._id as keyof typeof statusCounts] = item.count;
      }
    });

    return json({
      ok: true,
      data: {
        totalEmployees,
        totalGoals,
        ...statusCounts
      }
    });
  } catch (e: any) {
    return serverError('Failed to fetch overview analytics', e?.message);
  }
}
