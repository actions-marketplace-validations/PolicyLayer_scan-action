const SEVERITY_ORDER = ['Low', 'Medium', 'High', 'Critical'] as const;

export function shouldFail(
  summary: { toolsBySeverity: Record<string, number> },
  threshold: string
): boolean {
  if (!threshold) return false;

  const thresholdIndex = SEVERITY_ORDER.indexOf(threshold as (typeof SEVERITY_ORDER)[number]);
  if (thresholdIndex === -1) return false;

  for (let i = thresholdIndex; i < SEVERITY_ORDER.length; i++) {
    if ((summary.toolsBySeverity[SEVERITY_ORDER[i]] || 0) > 0) {
      return true;
    }
  }
  return false;
}
