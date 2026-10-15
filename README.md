# Jack American Mode

Yuichi's advanced English-only voice coaching app, hosted on ChatGPT Sites.

## Backup status

Source imported from `jack-american-mode-source-backup-2026-10-12.zip` on October 15, 2026. The export identifies Site version 16 and source commit `2c3b41d7b2dca781d4b0ffdc6acbab3cacc0feab`. Today's deployed version has not been compared with this export.

## Files explained

| Path | Purpose |
| --- | --- |
| `worker/index.js` | Application, screens, API handlers and voice integration |
| `db/schema.ts` | Database structure |
| `drizzle/` | Database migrations |
| `scripts/` | Build, validation and smoke checks |
| `.env.example` | Configuration names; no real API keys |
| `.openai/hosting.json` | Sites hosting configuration |
| `BACKUP_README.md` | Original export provenance and instructions |

## Verify locally

With Node.js and Bash installed:

```sh
npm run build
npm run validate
node scripts/smoke.mjs
```

No third-party npm dependencies are declared. Keep real credentials in the hosting platform's secret store. A source backup does not restore API credits, runtime database contents, or hosting bindings. Sites and GitHub do not automatically synchronize.

## Other active apps

- [Yuichi AI Terminal](https://github.com/braveoneu1-dot/yuichi-ai-terminal)
- [Household Finance / Harbor](https://github.com/braveoneu1-dot/household-finance-app)
- [Jackの英語ジャッジ](https://github.com/braveoneu1-dot/jack-english-judge)
