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

    const topEmployees = await Goal.aggregate([
      {
        $match: { approvalStatus: 'Approved' }
      },
      {
        $group: {
          _id: '$employeeId',
          approvedCount: { $sum: 1 },
          totalWeightage: { $sum: '$weightage' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'employeeId',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          employeeId: '$_id',
          name: '$user.name',
          approvedCount: 1,
          totalWeightage: 1
        }
      },
      { $sort: { approvedCount: -1 } },
      { $limit: 10 }
    ]);

    return json({
      ok: true,
      data: {
        topEmployees
      }
    });
  } catch (e: any) {
    return serverError('Failed to fetch goal analytics', e?.message);
  }
}
