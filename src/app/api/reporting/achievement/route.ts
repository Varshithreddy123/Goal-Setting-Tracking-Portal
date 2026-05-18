import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { Goal } from '@/models/Goal';
import { Checkin } from '@/models/Checkin';
import { User } from '@/models/User';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';


export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (auth.role !== 'admin' && auth.role !== 'manager') {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const goals = await Goal.find().lean();
    const checkins = await Checkin.find().lean();
    const users = await User.find().lean();

    const userMap = new Map(users.map(u => [u.employeeId, u]));

    let csv = 'Employee Name,Employee ID,Goal Title,Thrust Area,UoM,Target,Weightage,Actual Achievement,Quarter,Progress Status\n';

    for (const goal of goals) {
      const user = userMap.get(goal.employeeId);
      const goalCheckins = checkins.filter(c => c.goalId === String(goal._id));

      if (goalCheckins.length === 0) {
        csv += `"${user?.name || 'N/A'}","${goal.employeeId}","${goal.title}","${goal.thrustArea}","${goal.uomType}",${goal.target},${goal.weightage},0,N/A,N/A\n`;
      } else {
        for (const ci of goalCheckins) {
          csv += `"${user?.name || 'N/A'}","${goal.employeeId}","${goal.title}","${goal.thrustArea}","${goal.uomType}",${goal.target},${goal.weightage},${ci.actualAchievement},"${ci.quarter}","${ci.progressStatus}"\n`;
        }
      }
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="achievement_report.csv"',
      },
    });
  } catch (e: any) {
    return serverError('Failed to generate report', e?.message);
  }
}
