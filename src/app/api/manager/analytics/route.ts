import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Goal } from '@/models/Goal';
import { Checkin } from '@/models/Checkin';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../../_helpers/auth';


export async function GET(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');

    if (auth.role !== 'manager' && auth.role !== 'admin') {
      return json({ ok: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const manager = await User.findOne({ email: auth.email }).lean<{ employeeId: string } | null>();
    if (!manager) return unauthorized('Manager not found');

    const filter = auth.role === 'admin' ? {} : { managerId: manager.employeeId };
    const teamMembers = await User.find(filter).lean();
    const teamIds = teamMembers.map(m => m.employeeId);

    const [goals, checkins] = await Promise.all([
      Goal.find({ employeeId: { $in: teamIds } }).lean(),
      Checkin.find({ goalId: { $in: (await Goal.find({ employeeId: { $in: teamIds } }).select('_id').lean()).map(g => String(g._id)) } }).lean()
    ]);

    // Calculate team-wide metrics
    const totalTeamGoals = goals.length;
    const approvedTeamGoals = goals.filter(g => g.approvalStatus === 'Approved').length;
    const pendingApprovals = goals.filter(g => g.approvalStatus === 'Submitted').length;

    // Manager review breakdown (requested): how many goals each manager reviewed/approved/pending.
    // In this data model, manager review maps to the goal's approvalStatus.
    const approvedGoalsByManager = approvedTeamGoals;
    const pendingGoalsByManager = pendingApprovals;
    const reviewedGoalsByManager = approvedGoalsByManager + pendingGoalsByManager;

    // Completion distribution
    const statusDistribution = [
      { name: 'Completed', value: checkins.filter(c => c.progressStatus === 'Completed').length },
      { name: 'On Track', value: checkins.filter(c => c.progressStatus === 'On Track').length },
      { name: 'Behind', value: checkins.filter(c => c.progressStatus === 'Behind').length },
      { name: 'Not Started', value: checkins.filter(c => c.progressStatus === 'Not Started').length },
    ].filter(d => d.value > 0);

    // Individual member progress
    const memberProgress = teamMembers.map(member => {
      const memberGoals = goals.filter(g => g.employeeId === member.employeeId);
      const memberGoalIds = memberGoals.map(g => String(g._id));
      const memberCheckins = checkins.filter(c => memberGoalIds.includes(c.goalId));
      
      const completionRate = memberGoals.length > 0 
        ? (memberCheckins.filter(c => c.progressStatus === 'Completed').length / memberGoals.length) * 100 
        : 0;

      return {
        name: member.name,
        employeeId: member.employeeId,
        goalsCount: memberGoals.length,
        completionRate: Math.round(completionRate)
      };
    });

    return json({
      ok: true,
      data: {
        metrics: {
          teamSize: teamMembers.length,
          totalGoals: totalTeamGoals,
          approvedGoals: approvedTeamGoals,
          pendingApprovals,

          // Manager review breakdown (requested)
          reviewedGoalsByManager,
          approvedGoalsByManager,
          pendingGoalsByManager,
        },
        statusDistribution,
        memberProgress
      }
    });
  } catch (e: any) {
    return serverError('Failed to fetch team analytics', e?.message);
  }
}
