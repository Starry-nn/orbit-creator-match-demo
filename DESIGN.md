---
version: alpha
name: "Orbit Creator Partnership Workspace"
description: "A decision-focused creator intelligence workspace that turns campaign evidence into confident human choices."
colors:
  primary: "#315CF5"
  ink: "#202124"
  paper: "#F7F7F5"
  canvas: "#F2F3F7"
  rail: "#151B2C"
  muted: "#697083"
  line: "#E3E7EF"
  success: "#45C79B"
  warning: "#F4D767"
  danger: "#FF725C"
typography:
  display:
    fontFamily: "Avenir Next, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif"
  body:
    fontFamily: "Avenir Next, SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif"
rounded:
  DEFAULT: "0.875rem"
  sm: "0.5625rem"
  md: "0.875rem"
  lg: "1.5rem"
  pill: "999px"
spacing:
  control-gap: "0.625rem"
  card-gap: "1rem"
  page-max: "65rem"
components:
  button:
    minHeight: "2.625rem"
  card:
    borderColor: "#E3E7EF"
  sidebar:
    desktopWidth: "13.75rem"
  focus:
    ringColor: "#9DB0FF"
---

# Orbit Design System

## Overview

### Creative North Star

Orbit should feel like a campaign control room that keeps the creator, source video, and decision evidence in one field of view. Desktop uses a queue–evidence–decision composition; mobile compresses the same hierarchy into one scrollable dossier. Orbit retains its Google-pitch palette, evidence-first hierarchy, and circular orbital signature.

### Product context and register

- **Audience and primary job:** Agency creator teams evaluating, advancing, contacting, and activating creators for a campaign.
- **Target market(s) and evidence:** Global English-language pitch prototype; README and product sample content are the maintained evidence.
- **Locale(s) and language policy:** English UI. User requests may be bilingual, but shipped interface copy remains English until localization is explicitly scoped.
- **Usage scene:** Mobile review at 360/393px and laptop pitch/demo at approximately 1280px; information is dense but decisions must remain obvious.
- **Register:** Product UI with restrained brand expression.
- **Memorable signature:** A creator decision dossier connected to timestamped YouTube evidence and explicit Gemini Vision/Transcript reasoning, with the same Pass/Save for later/Select outcomes across desktop and mobile.
- **Restraint:** Lists, forms, email outreach, and campaign operations use familiar product patterns and quiet surfaces.
- **Anti-references:** Do not resemble a generic analytics dashboard, a macOS device mockup, or a dating app clone. The creator card may borrow direct-manipulation clarity without romantic or consumer-social styling.
- **Token ownership/runtime mapping:** `DESIGN.md` documents approved intent; the canonical runtime tokens are CSS variables in `styles.css`. Token changes must update both files in one change.

## Colors

`primary` is the Orbit decision/action color. `rail` anchors the desktop workspace. `paper`, `canvas`, and `line` create quiet evidence surfaces. `success`, `warning`, and `danger` are semantic and always paired with labels or icons. High-contrast mode may defer to system colors.

## Typography

Display typography uses the existing Avenir Next/SF Pro stack for creator names and decisive headings. Body typography uses the companion text stack. Data labels are compact but never the only carrier of meaning. Sentence case is standard; uppercase is reserved for short metadata labels.

## Layout

Desktop uses a 220px persistent rail and one shared content grid for every work surface. Discover uses two closely spaced columns: a creator/video profile with subscribers, average views, and engagement, plus a decision panel with score, multimodal evidence, and timestamp proof. The two columns move as one swipe surface, while plain-text Pass and Select arrow cues sit outside the combined column group. The only decision row sits below the profile; Save for later is an icon action sized symmetrically with Undo and defers the creator until the rest of the queue has been reviewed. Selected, Email, and Campaign use the same outer edges, equal card widths within each repeated module, and full-width section bars. Buttons are primary; swipe and arrow keys are optional accelerators taught with a compact contextual coach card. Campaign workspace pairs its milestone card with KPIs and time-compression evidence instead of stacking everything in a narrow center column. Mobile retains bottom navigation and a single scroll column at 393px and 360px. Scroll ownership belongs to `.app`; sticky chrome must not obscure focused controls.

## Elevation & Depth

Hierarchy comes from tonal surfaces, borders, and one deliberate dossier shadow. Static operational cards use subtle or no shadow. Sticky toolbars use translucency and blur only to preserve context over scrolling content.

## Shapes

Controls use 9–14px radii, cards use 14–24px radii, and decisive/compact actions may use pills. The creator dossier is the largest rounded surface. Circular forms are reserved for Orbit marks, scores, avatars, and icon-only decisions.

## Components

### Foundational visual states

Interactive controls require default, hover, visible focus, pressed, disabled, and busy states. Selection uses both color and a persistent state marker. Reduced motion removes decorative transitions while preserving state changes.

### Buttons and actions

Primary actions are solid Orbit blue. Neutral actions are white/outlined. Pass uses neutral/danger semantics; Select uses primary or success semantics with an explicit label. Save for later never changes campaign-selection status and requeues the creator after the remaining candidates. Icon-only controls require accessible names.

### Navigation and data display

Desktop uses the dark workspace rail; mobile uses bottom navigation. Discover prioritizes one creator at a time. Selected and Inbox may use two columns on desktop but preserve the same item order and actions on mobile.

### Forms and overlays

Fields use owned inline focus rings and text errors. Textareas do not resize. Decision capture uses the existing app-owned sheet; browser-native alert/confirm/prompt are forbidden. Toasts acknowledge actions but never hold the only critical information.

Campaign creation separates business goal, target audience, budget/scale, YouTube format/placement, and final match criteria. The AI Brief is an app-owned bottom sheet on mobile and a right-side drawer on desktop.

### Iconography

Use the existing compact line/symbol language and official Gemini/YouTube marks. Text labels remain visible for primary navigation and decision actions.

### Motion

Motion communicates selection, swipe direction, sheets, and navigation. Typical feedback is 180–320ms. Respect `prefers-reduced-motion`.

### Content and data visualization

Copy is direct and operational: Pass, Save for later, Select, Compare, Prepare outreach. Creator discovery uses public YouTube data and does not imply creator onboarding. Outreach is email-based: Gemini may draft from campaign inputs and public signals, but a user must review and approve every message before sending. Match scores always expose supporting factors and evidence. Prototype figures and contact details remain clearly illustrative in project documentation.

## Do's and Don'ts

- **Do:** Keep the creator decision and its evidence visually central.
- **Do:** Preserve identical action names and outcomes across desktop and mobile.
- **Don't:** Copy the reference product's orange/brown branding or serif-led identity.
- **Don't:** hide evidence, keyboard alternatives, or semantic meaning behind hover or gesture alone.
