# Jack: American Mode — source backup

This archive contains the complete tracked source from the current hosted Site,
plus safe configuration templates for a private Git repository.

- Site version: 16
- Source commit: `2c3b41d7b2dca781d4b0ffdc6acbab3cacc0feab`
- Export date: 2026-10-12 (UTC)

## Included

- Worker application source
- Database schema and migrations
- Build, validation, and smoke-test scripts
- Package manifest
- Sites hosting manifest
- Environment-variable template

## Intentionally excluded

- Git history and repository credentials
- Real API keys, tokens, and `.env` files
- Installed dependencies and generated build output
- Runtime database contents and personal financial records
- Logs and local development state

## Verify locally

```sh
npm run build
npm run validate
node scripts/smoke.mjs
```

The package currently has no third-party npm dependencies, so there is no lockfile
or `node_modules` directory to include.
