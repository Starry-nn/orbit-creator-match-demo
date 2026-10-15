# Orbit deployment

The public pitch demo remains at the repository's existing Pages URL. The real app
is served by the Node backend at `/product/`. GitHub Pages cannot run the API or DB.

## Local

1. Install Node 24 or later and run `npm ci`.
2. Copy `.env.example` to `.env` and configure only the integrations you have.
3. Run `npm start` and open `http://127.0.0.1:4180/product/`.
4. Register an account, create a real campaign and connect integrations in Settings.
   The optional guided setup uses your own campaign inputs; replay it from Settings.
   It requires configured YouTube/Gemini access to proceed through discovery. You
   can exit at any time and keep generated outreach as drafts without sending.

## Hosted instance

`render.yaml` defines one Docker web instance with a persistent SQLite disk. Import
this repository in Render Blueprints and choose the `codex/product-launch` branch
while this implementation is under review. A paid service/disk is required; no paid
resources have been provisioned from this chat. On Render, the app automatically
uses `RENDER_EXTERNAL_URL` for its public origin. For a custom domain, set `APP_URL`
to the final HTTPS origin instead. Set `ENCRYPTION_KEY` to a random 32-byte hex value.
Keep that key in the platform's secret settings and back it up securely: replacing
it makes stored Gmail tokens unreadable.

Set the API keys in the platform environment, never in the frontend or GitHub code:

- `YOUTUBE_API_KEY`: enable YouTube Data API v3 in the key's Google Cloud project.
  Restrict the key to that API. Search uses quota; imports are more economical.
- `GEMINI_API_KEY`: use a Google AI Studio project with access to a video-capable
  model; set `GEMINI_MODEL` to the available model ID. Analysis currently processes
  up to two public uploads per creator, each at most 40 minutes. Model access,
  public-video availability, quota and billing must be verified with real requests.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: create a Web OAuth client and add
  `https://YOUR_HOST/api/google/callback` as the exact redirect URI. Enable Gmail
  API. Request gmail.send and gmail.readonly; configure the consent screen and test
  users during development. Broader release can require Google verification.
  `gmail.readonly` is a restricted scope: server-side reply synchronization adds
  verification and security-assessment requirements for public release. Private
  testing is not evidence of public OAuth approval.
- `RESEND_API_KEY`, `EMAIL_FROM`: optional transactional email account and verified
  sender for password recovery and team invitations. No email delivery is simulated.

## Operations

One process owns this SQLite DB. Do not scale to multiple instances against separate
disks. Search/analysis jobs persist progress; interrupted requests are marked for
retry on restart. A send interrupted before provider confirmation becomes `unknown`,
not `sent`, and is not automatically retried to avoid duplicate outreach.

Use platform disk snapshots plus an off-host database backup. `npm run backup`
creates a consistent SQLite backup; configure its directory on separate backup
storage. Perform a restore drill before accepting real customer data. Keep the
Google keys and encryption key outside database snapshots.

## Release gates still requiring live infrastructure

- Provision hosting, HTTPS and persistent volume; confirm `/healthz` after restart.
- Real YouTube import/search, actual Gemini video request and timestamp verification.
- Google consent flow, token refresh, approved email to a controlled test inbox and
  a reply synchronized back to Orbit. Verify the names and contents of one attached
  test brief. Do not test with unsolicited creator outreach.
- Transactional password reset and invitation delivery.
- Backup, restore and account-isolation checks on the hosted instance.
- Real iPhone Safari manual verification, in addition to automated WebKit checks.

Until these gates pass, this is a working product implementation awaiting live
integration verification, not a fully deployed production service.

For a first-time account owner, follow [the setup checklist](SETUP-CHECKLIST.zh-CN.md).
