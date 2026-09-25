# UX Contract

## Product context

- Audience: Agency creator partnership teams and Google pitch reviewers.
- Primary jobs: Create a campaign, assess creator fit, advance creators to client review, compare, contact, brief, and review.
- Target market(s): Global English-language prototype.
- Active locales: English.
- Language/content register and native-review policy: Direct product English; no production localization commitment in this prototype.
- Timezone/calendar policy: Illustrative dates only; no backend date contract.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Product scope and sample-data disclosure | `README.md` | Product brief | 2026-09-25 |
| Interaction behavior | `app.js` | Prototype implementation | 2026-09-25 |
| Visual system | `DESIGN.md` | Design contract | 2026-09-25 |

Permissions, billing, deletion, retention, and legal workflows are not implemented and are outside prototype scope.

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`
- Token ownership model: Existing runtime CSS is canonical; `DESIGN.md` documents approved values and intent.
- Runtime design-system/token source: `styles.css` `:root` variables and shared selectors.
- Mapping/export/adapters: Direct CSS-variable mapping; no generated artifacts.
- Token drift gate: Review `DESIGN.md` and `styles.css` together; run the premium static audit.
- Supported themes: Light only; forced colors remains system-controlled.
- Design-context owner/review policy: Update only for durable, explicitly approved design changes.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | Shared field styles and `bind()` handlers | `styles.css`, `app.js` | create / review | browser workflow |
| Scrollbar | Global application stylesheet | `DESIGN.md`, `styles.css` | thin app scroller | computed/visual check |
| Toast | `#toast` and `toast()` | `app.js` | status acknowledgement | live region + browser check |
| AI Brief drawer | `#briefDrawer` and drawer handlers | `index.html`, `app.js` | bottom sheet / right drawer | open, close, full-brief handoff |
| Multimodal evidence | Discover decision panel | `app.js` creator evidence data | mobile memo / desktop rail | Vision + Transcript labels and timestamp proof |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | Label + semantic tone | contrast/elevation | visible ring | pressed transform | non-interactive | stable geometry | inline recovery where applicable |
| Icon button | accessible name | contrast/elevation | visible ring | pressed transform | non-interactive | stable geometry | n/a |
| Input | labeled/placeholder | border | owned ring | n/a | muted | stable geometry | text guidance |
| Textarea | resize none | border | owned ring | n/a | muted | stable geometry | text guidance |
| Table/list | visible rows | surface change | visible ring on controls | selected marker | n/a | stable region | retained navigation |

## Dataset navigation

- Exploratory lists: Render the seven bounded sample creators; no pagination is needed for prototype data.
- URL state: Demo state is transient, with optional `screen`, `device`, `step`, and `tour` parameters for deterministic pitch entry points and QA.
- Empty/no-results/error/loading treatment: Search reports no sample match without discarding the current creator.
- Back/scroll restoration: Screen navigation resets the active content scroller to the top.
- Selection scope: At most two creators are selected for comparison; checkboxes and buttons provide non-drag alternatives.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|---|
| Create campaign | Five-step Create/Continue | stable button | Discover | analyzed/ranked toast | remain on form | next screen | `app.js` |
| Search creator | Enter in search | none/local | matching creator | updated dossier | no-results toast | remains in search | `app.js` |
| Advance creator | swipe/button/right arrow on desktop | exit animation | next creator | toast + selected count | Undo | next dossier | `app.js` |
| Generate AI Brief | Generate AI Brief | stable drawer | editable brief | three creator-specific directions | close drawer | drawer heading | `app.js` |
| Compare | Compare button | none/local | comparison | selected count | edit selection | comparison heading | `app.js` |
| Cancel/back | Back/navigation | none | owning screen | none | n/a | destination content | `app.js` |

## Navigation and responsive behavior

- Route document title policy: Single prototype document title.
- Breadcrumb/tab/route-state policy: Desktop rail and mobile bottom navigation share the same destinations and labels.
- Sidebar/drawer/bottom-sheet transformation: 220px desktop rail becomes five-item mobile bottom navigation.
- Responsive discovery strategy: Desktop uses creator queue + evidence dossier + decision rail; mobile uses one dossier column.
- Responsive table strategy: Lists become one column on mobile and two columns where space allows.
- Truncation/full-value access: Creator names remain visible; secondary snippets may ellipsize.
- Focus restoration and sticky-obstruction policy: Embedded decision controls remain in document flow and focused controls remain within the app scroller.
- Desktop input parity: Pass, Save for later, and Advance buttons are primary; left/right arrows and swipe remain optional alternatives.

## Overlays and feedback

- Dialog primitives: Existing decision sheet plus the AI Brief drawer and dedicated backdrop.
- Toast placement/duration/deduplication: Shared `#toast`, approximately 1.7 seconds.
- Layer/z-index contract: tour > toast > decision sheet > backdrop > navigation/content. Starting or advancing the tour closes decision and brief overlays so only one guided target can be active.

## Async and resilience

Prototype data is local and synchronous. No network mutations, offline writes, session state, or conflict resolution are claimed.

## Validation

Local prototype controls own their feedback. Textareas use `resize: none`. No browser-native alert, confirm, prompt, or validation bubble is used.

## Verification

- Required static commands: `git diff --check`; premium strict audit.
- Browser/device matrix: Browser 1280, Pixel 8 Pro 393, Pixel 8 360.
- Accessibility checks: semantic buttons/inputs, accessible names, visible focus, non-drag alternatives, reduced motion.
- Canonical sibling flow used for comparison: Discover decision actions and Selected creator comparison.
