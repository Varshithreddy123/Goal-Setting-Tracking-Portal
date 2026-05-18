import type { NextRequest } from 'next/server';
import { connectToMongo } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Goal } from '@/models/Goal';
import { Checkin } from '@/models/Checkin';
import { json, unauthorized, serverError } from '@/utils/api';
import { getAuthFromRequest } from '../_helpers/auth';

export async function POST(req: NextRequest) {
  await connectToMongo();

  try {
    const auth = await getAuthFromRequest(req);
    if (!auth) return unauthorized('Missing mock auth');
    if (auth.role !== 'admin') return json({ ok: false, error: { message: 'Only admin can seed data' } }, { status: 403 });

    // 1. Create Managers
    const managers = [
      { uid: 'mock-mgr-001', employeeId: 'MGR-001', name: 'John Manager', email: 'john@atomberg.com', role: 'manager', department: 'Engineering' },
      { uid: 'mock-mgr-002', employeeId: 'MGR-002', name: 'Sarah Lead', email: 'sarah@atomberg.com', role: 'manager', department: 'Product' },
    ];

    for (const m of managers) {
      await User.findOneAndUpdate({ employeeId: m.employeeId }, m, { upsert: true });
    }

    // 2. Create Employees
    const employees = [
      { uid: 'mock-emp-001', employeeId: 'EMP-001', name: 'Alice Dev', email: 'alice@atomberg.com', role: 'employee', department: 'Engineering', managerId: 'MGR-001' },
      { uid: 'mock-emp-002', employeeId: 'EMP-002', name: 'Bob Engineer', email: 'bob@atomberg.com', role: 'employee', department: 'Engineering', managerId: 'MGR-001' },
      { uid: 'mock-emp-003', employeeId: 'EMP-003', name: 'Charlie Designer', email: 'charlie@atomberg.com', role: 'employee', department: 'Product', managerId: 'MGR-002' },
    ];

    for (const e of employees) {
      await User.findOneAndUpdate({ employeeId: e.employeeId }, e, { upsert: true });
    }

    // 3. Create Goals for Alice
    const aliceGoals = [
      {
        employeeId: 'EMP-001',
        createdBy: 'EMP-001',
        title: 'Complete Project Alpha',
        description: 'Finish all core modules of Project Alpha',
        thrustArea: 'Development',
        uomType: 'Modules',
        target: 10,
        weightage: 50,
        deadline: new Date('2024-12-31'),
        status: 'Active',
        approvalStatus: 'Approved',
        locked: true
      },
      {
        employeeId: 'EMP-001',
        createdBy: 'EMP-001',
        title: 'Mentorship',
        description: 'Mentor 2 junior developers',
        thrustArea: 'Culture',
        uomType: 'Sessions',
        target: 20,
        weightage: 50,
        deadline: new Date('2024-12-31'),
        status: 'Active',
        approvalStatus: 'Approved',
        locked: true
      }
    ];

    for (const g of aliceGoals) {
      const goal = await Goal.findOneAndUpdate(
        { employeeId: g.employeeId, title: g.title },
        g,
        { upsert: true, new: true }
      );

      // Add a check-in for Alice
      await Checkin.findOneAndUpdate(
        { goalId: String(goal._id), quarter: 'Q2 2024' },
        {
          goalId: String(goal._id),
          quarter: 'Q2 2024',
          plannedTarget: 5,
          actualAchievement: 6,
          progressStatus: 'Completed',
          employeeComment: 'Ahead of schedule',
          managerComment: 'Great job!'
        },
        { upsert: true }
      );
    }

    return json({ ok: true, message: 'Demo data seeded successfully' });
  } catch (e: any) {
    return serverError('Failed to seed data', e?.message);
  }
}
