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

    const deptPerformance = await User.aggregate([
      {
        $match: { role: 'employee' }
      },
      {
        $lookup: {
          from: 'goals',
          localField: 'employeeId',
          foreignField: 'employeeId',
          as: 'goals'
        }
      },
      {
        $group: {
          _id: '$department',
          employeeCount: { $sum: 1 },
          totalGoals: { $sum: { $size: '$goals' } },
          approvedGoals: {
            $sum: {
              $size: {
                $filter: {
                  input: '$goals',
                  as: 'goal',
                  cond: { $eq: ['$$goal.approvalStatus', 'Approved'] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          employeeCount: 1,
          totalGoals: 1,
          approvedGoals: 1,
          approvalRate: {
            $cond: [
              { $gt: ['$totalGoals', 0] },
              { $multiply: [{ $divide: ['$approvedGoals', '$totalGoals'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { department: 1 } }
    ]);

    return json({
      ok: true,
      data: deptPerformance
    });
  } catch (e: any) {
    return serverError('Failed to fetch department analytics', e?.message);
  }
}
