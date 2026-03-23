const COMMENT_MARKER = '<!-- policylayer-scan -->';

interface ScanSummary {
  serversDetected: number;
  serversMatched: number;
  serversUnknown: number;
  totalTools: number;
  toolsBySeverity: Record<string, number>;
  dangerousTools: number;
}

export function formatComment(reportUrl: string, summary: ScanSummary): string {
  const lines = [
    '## PolicyLayer MCP Scan',
    '',
    `**[View Full Report](${reportUrl})**`,
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Servers detected | ${summary.serversDetected} |`,
    `| Servers matched | ${summary.serversMatched} |`,
    `| Unknown servers | ${summary.serversUnknown} |`,
    `| Total tools | ${summary.totalTools} |`,
    `| Dangerous tools | ${summary.dangerousTools} |`,
    '',
    '**Severity breakdown:**',
    '',
    '| Severity | Count |',
    '|----------|-------|',
    `| Critical | ${summary.toolsBySeverity.Critical || 0} |`,
    `| High | ${summary.toolsBySeverity.High || 0} |`,
    `| Medium | ${summary.toolsBySeverity.Medium || 0} |`,
    `| Low | ${summary.toolsBySeverity.Low || 0} |`,
  ];

  return lines.join('\n');
}

export async function upsertComment(
  octokit: any,
  repo: { owner: string; repo: string },
  prNumber: number,
  body: string
): Promise<void> {
  const markedBody = `${COMMENT_MARKER}\n${body}`;

  const { data: comments } = await octokit.rest.issues.listComments({
    owner: repo.owner,
    repo: repo.repo,
    issue_number: prNumber,
  });

  const existing = comments.find((c: any) => c.body?.includes(COMMENT_MARKER));

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner: repo.owner,
      repo: repo.repo,
      comment_id: existing.id,
      body: markedBody,
    });
  } else {
    await octokit.rest.issues.createComment({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: prNumber,
      body: markedBody,
    });
  }
}
