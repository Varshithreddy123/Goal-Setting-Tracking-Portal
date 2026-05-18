export type MetricDirection = 'Min' | 'Max' | 'Timeline' | 'Zero';

// Min: higher achievement is better => achievement/target
// Max: lower achievement is better => target/achievement
// Timeline: deadline-based success/failure (requires deadline + completionDate)
// Zero: zero achievement indicates success
export function calculateScore(params: {
  direction: MetricDirection;
  target: number;
  achievement: number;
  deadline?: Date;
  completionDate?: Date;
}): number {
  const { direction, target, achievement, deadline, completionDate } = params;

  switch (direction) {
    case 'Min': {
      if (target === 0) return 0;
      return Math.min((achievement / target) * 100, 100);
    }

    case 'Max': {
      if (achievement === 0) return 100;
      return Math.min((target / achievement) * 100, 100);
    }

    case 'Timeline': {
      if (!deadline || !completionDate) return 0;
      return completionDate <= deadline ? 100 : 0;
    }

    case 'Zero': {
      return achievement === 0 ? 100 : 0;
    }

    default:
      return 0;
  }
}

