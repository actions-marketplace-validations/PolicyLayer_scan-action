# PolicyLayer Scan Action

GitHub Action that scans your MCP config for security risks on every PR.

Finds your MCP server configuration, analyses it against 115+ known servers, and posts a comment on the PR with a hosted report URL.

## Usage

```yaml
name: MCP Scan
on: [pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: PolicyLayer/scan-action@v1
        with:
          fail-on: high
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `fail-on` | Fail the check if findings meet this severity (`low`, `medium`, `high`, `critical`) | No | (don't fail) |
| `config-path` | Path to MCP config file | No | `.mcp.json` |

## What it does

1. Reads your MCP config from the repo
2. Strips secrets (API keys, tokens, env vars, file paths are never sent)
3. Sends server identifiers to the PolicyLayer scan API
4. Posts a sticky comment on the PR with the report URL and summary stats
5. Optionally fails the check if findings exceed the severity threshold

The PR comment updates on each push (no duplicate comments).

## Example PR comment

> **PolicyLayer MCP Scan**
>
> [View Full Report](https://policylayer.com/scan/report/65545482-5d1d-472f-9fca-472ff1181d0d)
>
> | Metric | Value |
> |--------|-------|
> | Servers detected | 5 |
> | Total tools | 131 |
> | Dangerous tools | 42 |

## Privacy

Only server names and package identifiers are sent to the scan API. Raw config content, API keys, tokens, environment variables, and file paths are stripped before anything leaves the runner.

## Links

- [Scan your config online](https://policylayer.com/scan)
- [CLI: npx -y policylayer scan](https://www.npmjs.com/package/policylayer)
- [Intercept](https://github.com/PolicyLayer/Intercept) -- enforce limits on MCP tool calls
