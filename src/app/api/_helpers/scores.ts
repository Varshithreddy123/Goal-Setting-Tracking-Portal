export type UoMType = 'Numeric' | '%' | 'Timeline' | 'Zero-based';

export function calculateProgressScore(params: {
  uomType: UoMType;
  target: number;
  achievement: number;
  deadline?: Date;
  completionDate?: Date;
}): number {
  const { uomType, target, achievement, deadline, completionDate } = params;

  switch (uomType) {
    case 'Numeric':
    case '%':
      // Higher is better (default assumption for numeric/%)
      //Achievement ÷ Target
      if (target === 0) return 0;
      return Math.min((achievement / target) * 100, 100);

    case 'Timeline':
      // Completion date vs Deadline
      if (!deadline || !completionDate) return 0;
      return completionDate <= deadline ? 100 : 0;

    case 'Zero-based':
      // Zero = Success
      return achievement === 0 ? 100 : 0;

    default:
      return 0;
  }
}

// Higher is better formula: Achievement ÷ Target
// Lower is better formula: Target ÷ Achievement (e.g. Cost, TAT)
export function calculateProgressScoreAdvanced(params: {
  uomType: UoMType;
  target: number;
  achievement: number;
  direction: 'up' | 'down';
  deadline?: Date;
  completionDate?: Date;
}): number {
  const { uomType, target, achievement, direction, deadline, completionDate } = params;

  if (uomType === 'Timeline') {
    if (!deadline || !completionDate) return 0;
    return completionDate <= deadline ? 100 : 0;
  }

  if (uomType === 'Zero-based') {
    return achievement === 0 ? 100 : 0;
  }

  if (target === 0) return achievement === 0 ? 100 : 0;

  if (direction === 'up') {
    // Higher is better
    return Math.min((achievement / target) * 100, 100);
  } else {
    // Lower is better
    if (achievement === 0) return 100;
    return Math.min((target / achievement) * 100, 100);
  }
}
