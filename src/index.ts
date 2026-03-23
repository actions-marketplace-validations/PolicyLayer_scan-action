import * as core from '@actions/core';
import * as github from '@actions/github';
import { existsSync } from 'node:fs';
import { postScan } from './scan.js';
import { upsertComment, formatComment } from './comment.js';
import { shouldFail } from './threshold.js';

async function run(): Promise<void> {
  try {
    const configPath = core.getInput('config-path') || '.mcp.json';
    const apiUrl = core.getInput('api-url') || 'https://policylayer.com/api/scan';
    const failOn = core.getInput('fail-on') || '';
    const token = core.getInput('github-token');

    if (!existsSync(configPath)) {
      core.info(`No config file found at ${configPath}, skipping scan.`);
      return;
    }

    core.info(`Scanning ${configPath}...`);
    const result = await postScan(configPath, apiUrl);

    core.setOutput('report-url', result.url);
    core.setOutput('report-id', result.id);
    core.info(`Report: ${result.url}`);

    // Post PR comment if in PR context
    const prNumber = github.context.payload.pull_request?.number;
    if (prNumber && token) {
      const octokit = github.getOctokit(token);
      const body = formatComment(result.url, result.summary);
      await upsertComment(octokit, github.context.repo, prNumber, body);
      core.info('Posted scan results to PR comment.');
    }

    // Check severity threshold
    if (failOn && shouldFail(result.summary, failOn)) {
      core.setFailed(
        `Findings at or above "${failOn}" severity detected. See report: ${result.url}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
