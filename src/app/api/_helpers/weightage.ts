export function validateGoalWeightageRules(params: {
  incomingTotalWeightage: number;
  incomingWeightage: number;
  existingGoalsWeightageSum: number;
  incomingEmployeeGoalsCountAfter?: number;
  incomingEmployeeGoalsCountBefore?: number;
}) {
  const { incomingTotalWeightage, incomingWeightage, existingGoalsWeightageSum, incomingEmployeeGoalsCountAfter } = params;

  // total weightage must not exceed 100
  const total = existingGoalsWeightageSum + incomingWeightage;
  if (total > incomingTotalWeightage) {
    return { ok: false as const, message: `Total weightage cannot exceed ${incomingTotalWeightage}. Current+incoming = ${total}` };
  }

  if (incomingWeightage < 10) {
    return { ok: false as const, message: 'Each goal weightage must be at least 10' };
  }

  // max 8 goals per employee
  if (typeof incomingEmployeeGoalsCountAfter === 'number' && incomingEmployeeGoalsCountAfter > 8) {
    return { ok: false as const, message: 'Maximum 8 goals per employee' };
  }

  return { ok: true as const };
}

