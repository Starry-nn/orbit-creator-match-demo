# Orbit — Creator Partnership Workspace

## Real product implementation

First-time deployment: [account and setup checklist (中文)](SETUP-CHECKLIST.zh-CN.md).

The original pitch demo is preserved below. A separate, database-backed product
is now implemented at `/product/` when served by the Node backend:

```bash
npm ci
npm start
```

Open `http://127.0.0.1:4180/product/`. Register a real account and create your
campaign; there are no seeded campaign records. See [DEPLOYMENT.md](DEPLOYMENT.md)
for the hosted Docker/persistent-disk setup and Google integrations.

The implementation includes password sessions, private workspaces, team invitations,
campaign brief import (TXT/PDF/DOCX), YouTube discovery/import, Gemini video evidence,
durable swipe decisions and undo, comparison, notes, Gmail outreach, reply checks,
editable creator briefs, complete PDF export, first-pass draft review, tasks and
private campaign files. External integrations require server credentials.

`npm test` verifies API behavior with injected providers. `npm run test:browser`
runs the product workflow in Chromium desktop and WebKit mobile. These tests do
not establish live Gemini access or Gmail delivery. Production release gates and
remaining work are recorded in [PRODUCT-IMPLEMENTATION.md](PRODUCT-IMPLEMENTATION.md).

GitHub Pages still serves the original static prototype. It does not host the
production API, database, OAuth callback or background analysis jobs.

## Original pitch demo

A dependency-free, mobile-first clickable prototype for an agency-facing creator partnership workspace.

The name **Orbit** reflects the product's job: keeping clients, creators, briefs, approvals, outreach, and deliverables in one campaign system. The circular mark reinforces that idea without making AI the brand itself.

The discovery experience borrows the interaction principles—not the branding—from story-led profile products such as Hinge: one creator is presented as a scrollable narrative made of media, prompts, performance evidence, and AI reasoning. Teams can select a creator from a specific profile section and preserve that context as a decision note.

## Demo

[Watch the 37-second guided product tour](demo/orbit-guided-tour.mp4)

## Included flows

- Campaign dashboard and low-friction four-step campaign setup with a ready-made sample brief
- Locked first-run tour that requires users to set the campaign goal, target audience and budget before guiding them through matching, selection, AI-drafted email outreach, creator brief, and workspace interfaces
- AI-ranked creator discovery feed
- Explainable, weighted fit scoring with traceable campaign and YouTube evidence
- Seven real public YouTube creator samples using locally stored official channel avatars
- Long-form creator profiles with content signals and performance stories
- Explainable AI match memo and evidence
- Gemini-assisted brief extraction, personalized outreach emails, creator briefs, and first-pass draft risk review
- Before/after workflow timing to show campaign acceleration
- Gesture controls: swipe left to pass, swipe right to select, plus save-for-later and undo actions
- Contextual selection notes on individual profile sections
- Client selection review, finalist comparison, human-approved email outreach, creator briefs, and a campaign control room
- Operational campaign views for owners, deadlines, client approvals, conflicts, budgets, creator stages, deliverables, and files

## Run

Open `index.html` directly, or serve the folder locally:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/creator-match-demo/` when serving from the parent folder.

The default route starts with the new-user experience. Add `?mode=workspace` to open the returning-user dashboard directly.

The presentation controls include Pixel 8 Pro (393px), Pixel 8 (360px), and a responsive 1280px browser workspace. The browser option reflows navigation and content for a laptop presentation while preserving the two mobile layouts.

Creator subscriber counts, performance figures, match scores, Gemini outputs, risk flags, and campaign recommendations are illustrative prototype data. Creator names, Google product marks, and YouTube imagery identify the public products and channels used in the proposed workflow; no affiliation or endorsement is implied.

No build step or third-party package is required.
