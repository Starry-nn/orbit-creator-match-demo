# Orbit — AI Creator Matchmaking

A dependency-free, mobile-first clickable prototype for an AI-powered YouTube creator matchmaking platform.

The discovery experience borrows the interaction principles—not the branding—from story-led profile products such as Hinge: one creator is presented as a scrollable narrative made of media, prompts, performance evidence, and AI reasoning. Teams can shortlist a creator from a specific profile section and preserve that context as a decision note.

## Included flows

- Campaign dashboard and low-friction four-step campaign setup with a ready-made sample brief
- AI-ranked creator discovery feed
- Seven real public YouTube creator samples using locally stored official channel avatars
- Long-form creator profiles with content signals and performance stories
- Explainable AI match memo and evidence
- Gesture controls: swipe left to pass, swipe right to shortlist, plus save and undo actions
- Contextual shortlist notes on individual profile sections
- Creator pool, comparison, outreach, AI brief, and campaign workspace

## Run

Open `index.html` directly, or serve the folder locally:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/creator-match-demo/` when serving from the parent folder.

The prototype is designed at 393 × 852 CSS pixels and scales down to smaller iPhone viewports.

Creator subscriber counts, performance figures, match scores, and campaign recommendations are illustrative demo data. Creator names and imagery link the concept to recognizable public YouTube channels; no affiliation or endorsement is implied.

No build step or third-party package is required.
