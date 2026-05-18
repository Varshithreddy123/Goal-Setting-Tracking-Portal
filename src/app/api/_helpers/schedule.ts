export type CyclePhase = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'NONE';

export function getCurrentCyclePhase(): CyclePhase {
  const now = new Date();
  const month = now.getMonth(); // 0-11

  // 0: Jan, 1: Feb, 2: Mar, 3: Apr, 4: May, 5: Jun, 6: Jul, 7: Aug, 8: Sep, 9: Oct, 10: Nov, 11: Dec

  if (month === 4) return 'GOAL_SETTING'; // May
  if (month === 6) return 'Q1';           // July
  if (month === 9) return 'Q2';           // October
  if (month === 0) return 'Q3';           // January
  if (month === 2 || month === 3) return 'Q4'; // March or April

  return 'NONE';
}

export function isWindowOpen(phase: CyclePhase): boolean {
  return getCurrentCyclePhase() === phase;
}

export function getPhaseMessage(phase: CyclePhase): string {
  switch (phase) {
    case 'GOAL_SETTING': return 'Goal Setting window is open (May).';
    case 'Q1': return 'Q1 Check-in window is open (July).';
    case 'Q2': return 'Q2 Check-in window is open (October).';
    case 'Q3': return 'Q3 Check-in window is open (January).';
    case 'Q4': return 'Q4/Annual Check-in window is open (March/April).';
    default: return 'No active window at this time.';
  }
}
