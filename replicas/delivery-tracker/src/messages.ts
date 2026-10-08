import { agency, PHASES, TODAY, type Project } from './data';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-08-04" → "4 Aug" */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export const STEP_COUNT = 7; // 0 = brief received, 1–5 = phases, 6 = launched

export function stepName(step: number): string {
  if (step <= 0) return 'Brief received';
  if (step >= 6) return 'Launched';
  return PHASES[step - 1];
}

export type StatusText = { major: string; minor: string };

/** The named-person line and the smaller line under it, for a tracker step. */
export function statusFor(p: Project, step: number): StatusText {
  if (step <= 0) {
    return {
      major: `${p.phases[0].lead} received your brief on ${shortDate(p.briefReceived)}`,
      minor: `Discovery starts ${shortDate(p.phases[0].start)}.`,
    };
  }
  if (step >= 6) {
    return {
      major: `We hope you enjoy your ${p.deliverable}!`,
      minor: `Thanks for choosing ${agency.name}.`,
    };
  }
  const phase = p.phases[step - 1];
  return {
    major: `${phase.lead} began ${phase.name} on ${shortDate(phase.start)}`,
    minor: phase.detail,
  };
}

/** Fraction of the studio→client route covered during Launch (0–1). */
export function launchProgress(p: Project, step: number): number {
  if (step >= 6) return 1;
  if (step < 5) return 0;
  const start = p.phases[4].start;
  const total = Math.max(1, daysBetween(start, p.dueDate));
  const elapsed = daysBetween(start, TODAY);
  // Demo steps beyond today's real progress land part-way along the route.
  if (elapsed <= 0) return 0.35;
  return Math.min(0.92, Math.max(0.15, elapsed / total));
}

/** Launch date: the completed launch milestone if there is one, else the due date. */
export function launchDate(p: Project): string {
  const done = [...p.milestones].reverse().find((m) => m.status === 'Done' && m.completedOn);
  return p.status === 'Done' && done?.completedOn ? done.completedOn : p.dueDate;
}

export function daysToLaunch(p: Project): number {
  return Math.max(0, daysBetween(TODAY, p.dueDate));
}
