import { describe, it, expect, vi } from 'vitest';
import { upsertComment, formatComment } from './comment.js';

function mockOctokit(existingComments: Array<{ id: number; body?: string }> = []) {
  return {
    rest: {
      issues: {
        listComments: vi.fn().mockResolvedValue({ data: existingComments }),
        createComment: vi.fn().mockResolvedValue({}),
        updateComment: vi.fn().mockResolvedValue({}),
      },
    },
  } as any;
}

describe('upsertComment', () => {
  it('creates new comment when none exists with marker', async () => {
    const octokit = mockOctokit([]);
    await upsertComment(octokit, { owner: 'o', repo: 'r' }, 42, 'Test body');

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith({
      owner: 'o',
      repo: 'r',
      issue_number: 42,
      body: expect.stringContaining('<!-- policylayer-scan -->'),
    });
    expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled();
  });

  it('updates existing comment when marker found', async () => {
    const octokit = mockOctokit([
      { id: 100, body: '<!-- policylayer-scan -->\nOld content' },
    ]);
    await upsertComment(octokit, { owner: 'o', repo: 'r' }, 42, 'New body');

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith({
      owner: 'o',
      repo: 'r',
      comment_id: 100,
      body: expect.stringContaining('<!-- policylayer-scan -->'),
    });
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });
});

describe('formatComment', () => {
  const summary = {
    serversDetected: 3,
    serversMatched: 2,
    serversUnknown: 1,
    totalTools: 15,
    toolsBySeverity: { Low: 5, Medium: 4, High: 3, Critical: 2 } as Record<string, number>,
    dangerousTools: 5,
  };

  it('includes report URL, server count, tool count, severity breakdown', () => {
    const result = formatComment('https://policylayer.com/report/abc', summary);
    expect(result).toContain('https://policylayer.com/report/abc');
    expect(result).toContain('3'); // serversDetected
    expect(result).toContain('15'); // totalTools
    expect(result).toContain('Critical');
    expect(result).toContain('High');
  });

  it('does not duplicate marker (upsertComment adds it)', () => {
    const result = formatComment('https://policylayer.com/report/abc', summary);
    expect(result).not.toContain('<!-- policylayer-scan -->');
  });
});
