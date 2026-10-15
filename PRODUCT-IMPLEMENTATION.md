# Orbit production implementation

## Product contract

Keep the existing demo at `/` and implement the real workspace at `/product/`.
Mobile supports quick creator review, swipe decisions, in-place details and approvals;
desktop uses a sidebar, profile/evidence columns, comparison and campaign operations.
Use the existing blue Orbit mark. No fabricated performance, AI evidence, email status,
audience demographics, pricing, or time-saving claims in the real workspace.

## Required acceptance evidence

- Accounts: registration, sign-in/out, recovery, account isolation, session expiry.
- Campaigns: stored brief, objective, audience, budget, category, language, country,
  YouTube format/placement, channel and performance criteria, exclusions, guidelines.
- Discovery: YouTube API search and channel import, public avatars, recent uploads,
  real public metrics with freshness, explicit missing/unknown private metrics.
- Gemini: server-only key, actual video input, validated timestamp evidence and JSON,
  transparent per-video failures, progress and retry without invented fallback output.
- Decisions: durable pass/select/defer and undo, terminal queue, no selected/passed
  resurfacing. Selected page expands the correct creator and compares any 2+ picks.
- Activation: editable AI briefs, export, editable drafts, explicit send approval,
  verified provider send result, Gmail connection and reply sync.
- Workspace: real per-campaign state, tasks, notes, deliverables, attachments, progress,
  permissions, team invitations and activity history.
- Responsive UI: real mobile scrolling, no device frame in production, keyboard and
  touch parity, empty/loading/error states, accessible labels, no dead controls.
- Deployment: HTTPS, persistent storage, backups/restore, environment configuration,
  health check, CI and live end-to-end tests using configured providers.

## Current authoritative limitations

The original demo has no backend. Production work starts on `codex/product-launch`.
Google API keys, OAuth client registration and a backend hosting account have not
yet been supplied or connected. These cannot be replaced by test fixtures or Pages.
Do not declare the project complete until the live deployment and real providers
pass the acceptance checks above. Tests with injected providers prove application
behavior only; they do not prove external credentials, quota, or live delivery.

## Implemented in this branch

- Account registration/login/logout/recovery endpoints; encrypted Gmail credentials.
- Private workspaces with owner invitations and shared campaign access.
- Campaign storage/editing and TXT/PDF/DOCX text extraction. Scanned PDF OCR is not
  implemented; the UI asks the user to paste text if no text layer is present.
- Real YouTube adapter (channel search, @handle imports, recent uploads and public
  metrics). Gemini adapter uses video URLs, validates returned evidence against the
  actual video IDs and durations and marks partial failures for retry.
- DB-backed pass/select/defer/undo, comparison, private notes and creator stages.
- AI email drafts, explicit Gmail send approval, duplicate-send prevention, honest
  unknown-delivery state after interruption, Gmail thread reply checks.
- Campaign file attachments are saved with drafts, checked against campaign access,
  and encoded as Gmail MIME attachments (up to four files and 5 MB in total).
- Owners can remove editor access while retaining campaign records. Browser edit
  forms send revision tokens and retain unsaved text when a conflicting save fails.
- Late discovery, analysis and AI draft results are rejected if their campaign
  requirements changed while an external request was running.
- Editable briefs, server PDF export without truncating the brief, approval, draft
  script review; campaign changes invalidate old analysis and draft emails.
- Tasks, private campaign files, activity history, Docker/Render config and CI.
- API account-isolation, restart persistence, document and PDF tests. Desktop
  Chromium and actual WebKit mobile tests cover the main browser workflow.
- Optional first-run guidance uses real campaign inputs and actual controls, with
  native outlines instead of separately positioned highlight rectangles. It covers
  fit/evidence review, pass/undo/defer/select, comparison, draft review, brief editing,
  PDF export and explicit approval. Users can keep outreach as a draft throughout.
  Reloads return to the relevant view and reopen dialogs through their normal entry
  points; guide steps never send outreach automatically.

## Still to complete or verify

- Live host provisioning, real Google keys/OAuth and transactional mail integration;
  actual end-to-end delivery and video analysis cannot pass without these accounts.
- Review the real UI and first-run guidance with the user against the existing demo.
  Production guidance is separate from the original pitch tour, which remains in
  the demo. Automated provider fixtures do not verify a live first-run experience.
- Automatic scheduled follow-up, verified delivery/read
  receipts and automatic interest classification are not implemented. Gmail thread
  replies and manual creator stages are implemented; no extra statuses are invented.
- Improve discovery pagination, batch cost control and audit retention before
  broader agency rollout. Conditional revision checks are supported; a separate
  multi-instance database/locking design is still needed before horizontal scaling.
- Run the backup script and restore drill against persistent hosted infrastructure;
  establish off-host backup storage and monitoring.
- Actual iPhone Safari device verification (WebKit is stronger evidence than a Chrome
  user-agent string, but still does not prove behavior on the user's physical phone).

## Architecture

Browser → same-origin Node HTTP API → SQLite (persistent volume)
                                → YouTube Data API v3
                                → Gemini generateContent with public video URLs
                                → Gmail OAuth / Gmail API

Sessions are HttpOnly cookies. Passwords use scrypt with random salts. OAuth refresh
tokens are encrypted at rest. All workspace queries enforce membership. Mutations
reject cross-origin requests. SQLite uses WAL, foreign keys and transactions.
Start with one instance and persistent disk; multiple instances require a shared DB.
