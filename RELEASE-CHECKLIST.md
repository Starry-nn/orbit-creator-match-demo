# Orbit release acceptance

This is an acceptance audit, not a declaration that the product is deployed or
bug-free. The existing pitch demo at `/` and the real workspace at `/product/`
remain separate. Tests use isolated databases and injected provider responses;
they do not establish real Google access, delivery, hosting or physical-phone behavior.

## Evidence and remaining gates

| Requirement | Current evidence | Still required for acceptance |
| --- | --- | --- |
| Accounts and isolation | API tests cover registration, sign-in/out, workspace membership, invitations/revocation and persisted data; recovery tests restore actual sign-in and enforce isolation | Real reset/invitation delivery; hosted session and isolation checks |
| Campaign inputs and document import | Campaign APIs and browser flows persist real inputs; TXT/PDF/DOCX extraction has validation tests | User review of advanced criteria and imported real briefs; scanned-PDF OCR is not implemented |
| YouTube discovery/import | Server adapter, cursor/exclusion parameter tests, durable pagination, criteria reset and batch limits | Real key, quota and live channel/video/metric verification |
| Gemini multimodal matching | Server passes eligible public video URLs; output/video ID/score/timestamp checks and stale-result protection are tested | Actual video-capable model access and human verification of live visual/audio evidence |
| Analysis failures | Job progress, per-creator failures and explicit retry are implemented; no fabricated fallback output | Individual per-video success/failure reporting is not implemented: up to two videos currently share a creator-level request |
| Pass/select/defer/undo | Durable API workflow, terminal queue and preserved decisions are tested | User confirmation on real campaign data |
| Swipe and keyboard behavior | Browser tests exercise portrait drag feedback, shared profile/evidence motion, threshold/cancellation handling, Undo, arrows and exact decision counts; Chromium mobile uses native touch injection | Physical iPhone Safari, real browser chrome, touch cancellation, large text and virtual-keyboard verification |
| Selected details and comparison | Correct creator dialogs, any 2+ checkbox picks, comparison and truthful empty-risk labels are exercised in browser tests | User review of final comparison fields and team workflow |
| AI briefs and script review | Editable saved briefs, full PDF download, explicit approval and late-review rejection are covered | Real generation, source/claim checks and review of actual creator scripts |
| Inbox and Gmail | Approval gate, MIME attachment bytes, send/unknown states, duplicate guards and reply handling are tested with fixtures | OAuth consent/refresh, one approved email to a controlled inbox, attachment check and real reply sync |
| Workspace operations | Tasks, notes, stages, files, activity history, permissions and revision conflicts are implemented and tested | Hosted multi-user acceptance with the owner |
| Onboarding and responsive layout | Desktop/WebKit guide tests assert visible, uncovered and stable native targets; compare/email/brief reload paths, small screens and single-creator flow are covered | Owner acceptance on an actual phone and live, variable-length creator data |
| Deployment and storage | Docker build/start, ordinary-user backup and isolated restore run in CI; Render blueprint and `/healthz` exist | Hosting account, approved paid service, HTTPS origin, persistent disk and restart check |
| Disaster recovery | WAL snapshot, CLI refusal guards, original-key validation, restored access/data and quarantined mail are tested | Private off-host destination, schedule/retention, monitoring and hosted restore/cutover drill |
| Provider/public-release readiness | Secret values remain server-side; setup/recovery instructions identify external gates | Owner-controlled account setup, Google release approval as applicable, operator/contact information and approved privacy/retention/deletion process |

Source evidence: [API tests](tests/product-api.test.mjs),
[recovery tests](tests/product-recovery.test.mjs),
[browser workflow](tests/product-browser.mjs),
[guide checks](tests/product-guide.mjs),
[CI](.github/workflows/product-ci.yml), [implementation scope](PRODUCT-IMPLEMENTATION.md).

The current-host configuration audit found no configured YouTube key, Gemini key,
Gmail OAuth client, transactional mail provider or Render public address. The latest
completed checks before this audit were green; that does not change these missing
external prerequisites. Recheck the latest branch CI after further changes.

## Other explicitly unfinished capabilities

- Automatic scheduled follow-up, verified delivery/read receipts and automatic
  interest classification are not implemented. Replies and manual stages exist.
  Unattended outreach must not be inferred from approval of an individual email.
- No multi-instance database design is implemented. The current deployment contract
  is one process/instance with a persistent SQLite volume.
- Request-batch limits are not a monetary spending cap. Real provider quotas,
  cost monitoring and audit retention still need operational configuration.

## Order of completion

1. The owner registers/signs in to the chosen hosting and Google accounts, confirms
   service charges and configures secrets in the hosting platform (never in chat).
2. Deploy one private test instance and verify the exact public origin, disk and
   OAuth callback. Keep the original pitch-demo URL intact.
3. Run controlled live YouTube/Gemini/Gmail and transactional-mail checks, followed
   by physical-phone and owner UI acceptance. Record failures and fix them.
4. Complete off-host recovery and public-release/operator requirements, resolve the
   functional gaps above, then repeat the full acceptance audit before release.

These steps preserve the full product objective; a private test deployment alone
does not satisfy production acceptance.
