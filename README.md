# Orbit — AI Creator Matchmaking

A dependency-free, mobile-first clickable prototype for an AI-powered YouTube creator matchmaking platform.

The discovery experience borrows the interaction principles—not the branding—from story-led profile products such as Hinge: one creator is presented as a scrollable narrative made of media, prompts, performance evidence, and AI reasoning. Teams can shortlist a creator from a specific profile section and preserve that context as a decision note.

## Included flows

- Campaign dashboard and three-step campaign setup
- AI-ranked creator discovery feed
- Long-form creator profiles with content prompts and performance stories
- Explainable AI match memo and evidence
- Pass, save, shortlist, and undo actions
- Contextual shortlist notes on individual profile sections
- Creator pool, comparison, outreach, AI brief, and campaign workspace

## Run

Open `index.html` directly, or serve the folder locally:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/creator-match-demo/` when serving from the parent folder.

The prototype is designed at 393 × 852 CSS pixels and scales down to smaller iPhone viewports.

No build step or third-party package is required.
