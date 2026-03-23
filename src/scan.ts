import { readFileSync } from 'node:fs';

interface McpServerEntry {
  type?: string;
  command?: string;
  args?: unknown[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

interface StrippedServer {
  command?: string;
  args?: string[];
}

interface ScanResponse {
  id: string;
  url: string;
  summary: {
    serversDetected: number;
    serversMatched: number;
    serversUnknown: number;
    totalTools: number;
    toolsBySeverity: Record<string, number>;
    dangerousTools: number;
  };
}

const TOKEN_PATTERNS = [
  /^sk-/,      // OpenAI, Stripe
  /^ghp_/,     // GitHub PAT
  /^gho_/,     // GitHub OAuth
  /^ghu_/,     // GitHub user token
  /^ghs_/,     // GitHub server token
  /^glpat-/,   // GitLab PAT
  /^xoxb-/,    // Slack bot
  /^xoxp-/,    // Slack user
  /^Bearer\s/, // Bearer tokens
  /^pk_/,      // Stripe publishable
  /^sk_live_/, // Stripe live
  /^sk_test_/, // Stripe test
  /^ict_/,     // Intercept tokens
  /^[a-z]{2,6}_[a-f0-9]{16,}$/i, // Generic prefix_hex tokens
  /^[a-f0-9]{32,}$/i,            // Long hex strings (API keys, hashes)
];

const PATH_PATTERNS = [
  /\/Users\//,
  /\/home\//,
  /\\Users\\/,
  /^[A-Z]:\\/,
  /^\//,       // Any absolute path
];

function looksLikeToken(s: string): boolean {
  return TOKEN_PATTERNS.some(p => p.test(s));
}

function looksLikePath(s: string): boolean {
  return PATH_PATTERNS.some(p => p.test(s));
}

function looksLikePackage(s: string): boolean {
  if (s.startsWith('@') && s.includes('/')) return true;
  if (/^[a-z][\w.-]*$/.test(s)) return true;
  return false;
}

function stripConfig(
  mcpServers: Record<string, McpServerEntry>
): Record<string, StrippedServer> {
  const stripped: Record<string, StrippedServer> = {};

  for (const [name, config] of Object.entries(mcpServers)) {
    const entry: StrippedServer = {};

    if (config.command) {
      const parts = config.command.split(/[/\\]/);
      entry.command = parts[parts.length - 1] || config.command;
    }

    if (Array.isArray(config.args)) {
      entry.args = config.args.filter((a): a is string => {
        if (typeof a !== 'string') return false;
        if (looksLikeToken(a)) return false;
        if (looksLikePath(a)) return false;
        if (a.startsWith('-')) return false;
        return looksLikePackage(a);
      });
    }

    stripped[name] = entry;
  }
  return stripped;
}

export async function postScan(
  configPath: string,
  apiUrl: string
): Promise<ScanResponse> {
  const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
  const mcpServers = raw.mcpServers || raw.servers || {};

  const stripped = stripConfig(mcpServers);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mcpServers: stripped }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Scan API error (${response.status}): ${(err as any).error || 'Unknown'}`);
  }

  return response.json() as Promise<ScanResponse>;
}
