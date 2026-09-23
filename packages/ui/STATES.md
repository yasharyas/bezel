# States

Every interactive primitive in Bezel is specified against the same eight states.
This file is both the spec (what a state must look like) and the audit (which
components currently render it).

Values reference `src/tokens/tokens.css`.

---

## The spec

| State | What it must do | Token |
|---|---|---|
| **default** | The resting appearance. Legible at 4.5:1, at least 48px on its smallest axis. | `--bz-ink`, `--bz-radius-full` |
| **hover** | Pointer only. A change of fill or border, never of layout. Must never be the *only* signal an element is interactive. | `--bz-duration-fast`, `--bz-ease-out` |
| **focus** | 2px outline at 2px offset, `:focus-visible` not `:focus`, clearing 3:1 against the element's own ground. Non-negotiable. | `--bz-focus-ring`, `--bz-focus-width`, `--bz-focus-offset` |
| **active** | The pressed instant. `scale(0.97)` for buttons is the house value; it must be reduced-motion gated. | `--bz-duration-fast` |
| **disabled** | 50% opacity plus `cursor: not-allowed`. Not focusable, not announced as actionable. Contrast is exempt here. | `--bz-ink-disabled` |
| **loading** | The control keeps its size, gains `aria-busy`, and announces the change in a live region. A spinner alone is not a loading state. | `--bz-duration-base` |
| **error** | `--bz-danger-decor` for the border or mark, `--bz-danger` for the message text, plus `aria-invalid` and `aria-describedby` pointing at it. | `--bz-danger`, `--bz-danger-decor` |
| **empty** | An icon, a sentence saying what is missing, and one action. Wrapped in `role="status"` so a results list going empty is announced. | `--bz-ink-muted` |

Three rules cut across all eight:

1. **Hover without focus is half a component.** Any styling applied on `:hover`
   needs a `:focus-visible` counterpart, or keyboard users get a different
   product.
2. **A state that is only a colour is not a state.** Selected, active-route and
   error all need a second signal: a mark, a label, or an ARIA attribute.
3. **Loading, error and empty are announcements.** If a screen reader user
   cannot tell the state changed, the state was not implemented.

---

## The audit

`+` implemented · `–` missing · `n/a` not applicable to this component ·
`!` present but broken

### Form controls

| Component | default | hover | focus | active | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|
| `forms/TextInput` | + | – | + | – | + | – | + | n/a |
| `forms/CheckboxVariants` (×4) | + | + | + | + | – | n/a | – | n/a |
| `forms/MD3Switch` | + | + | + | + | + | – | – | n/a |
| `forms/BlenderUpload` | + | + | + | + | + | + | ! | + |

`TextInput` renders an error but does not set `aria-invalid` or link the message
with `aria-describedby`, so the error is visual only. `BlenderUpload` reports errors through a callback and
renders nothing, so it is marked `!`. No form component links and announces its
errors, so the library has no reference to copy for that pattern.

### Buttons and links

| Component | default | hover | focus | active | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|
| `GlassButton` | + | + | + | + | + | n/a | n/a | n/a |
| `buttons/PinchedButton` | + | + | + | + | + | n/a | n/a | n/a |
| `buttons/ToolbarButton` | + | + | + | – | + | n/a | n/a | n/a |
| `buttons/BorderBeamButton` | + | + | + | + | + | n/a | n/a | n/a |
| `buttons/CircleCTA` | + | + | + | – | – | n/a | n/a | n/a |
| `buttons/TextDisperseLink` | + | + | + | – | n/a | n/a | n/a | n/a |

`PinchedButton` and the star ring now carried by `BorderBeamButton` are the
only two that were complete before this pass, and they are the reference for
the rest.

### Navigation

| Component | default | hover | focus | active/current | disabled |
|---|---|---|---|---|---|
| `navigation/Pagination` | + | + | + | + | ! |
| `navigation/TubelightNavBar` | + | + | + | + | – |
| `navigation/StickyNav` | + | + | + | + | – |
| `navigation/StickyNavbar` | + | + | + | + | – |
| `navigation/SiteHeader` | + | + | + | – | – |
| `navigation/MobileMenu` | + | + | + | – | n/a |
| `navigation/SectionProgressRail` | + | – | + | + | n/a |
| `navigation/CollapsibleSidebar` | + | + | + | – | – |
| `navigation/TimedTabs` | + | + | + | + | n/a |

`Pagination` marks disabled with `disabled:pointer-events-none` on an `<a>`.
Anchors are never `:disabled`, so those classes are dead, and it is marked `!`.

Active/current is a colour change in most of these and carries no `aria-current`
or `aria-selected`, which breaks cross-cutting rule 2 above.

### Feedback, overlays and panels

| Component | default | hover | focus | active | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|
| `feedback/EmptyState` | + | + | + | – | – | n/a | n/a | + |
| `feedback/ErrorBoundary` | + | + | + | + | n/a | n/a | + | n/a |
| `feedback/CelebrationOverlay` | + | – | + | – | + | n/a | n/a | n/a |
| `feedback/TillReceiptPrint` | + | – | + | – | – | n/a | n/a | n/a |
| `feedback/SubmissionLoader` | n/a | n/a | n/a | n/a | n/a | + | n/a | n/a |
| `loaders/SkeletonCard` (×2) | n/a | n/a | n/a | n/a | n/a | + | n/a | n/a |
| `feedback/ImagePlaceholder` | n/a | n/a | n/a | n/a | n/a | + | n/a | n/a |
| `feedback/LoadingSpinner` | n/a | n/a | n/a | n/a | n/a | ! | n/a | n/a |
| `feedback/ToastContainer` | n/a | n/a | n/a | n/a | n/a | n/a | ! | n/a |
| `dialogs/MorphDialog` | + | + | + | + | n/a | n/a | n/a | n/a |
| `panels/SidePanel` | + | + | + | – | – | n/a | – | n/a |

`LoadingSpinner` renders a spinner with no `role="status"` and no accessible
label, so the loading state exists visually and not at all for assistive tech,
so it is marked `!`. `ToastContainer` has the same gap: no `role="status"`, no
`aria-live`, so nothing it says is ever announced.

`SkeletonCard` and `SkeletonRow` are each a polite `role="status"` with
`aria-busy` and a text label ("Loading" by default), and `ImagePlaceholder`
carries `aria-busy` on its image role. Until September 2026 all three were
visual only, and their pulse was too faint to see: over a full cycle no pixel
moved more than 14 grey levels. Each now sweeps a visible sheen, pauses it off
screen and in hidden tabs, and holds a still placeholder under reduced motion.

### Cards

| Component | default | hover | focus | active | disabled |
|---|---|---|---|---|---|
| `cards/PointerGlowCard` | + | + | + | n/a | n/a |
| `cards/TestimonialCard` | + | n/a | n/a | n/a | n/a |
| `cards/CardGrid` | + | n/a | n/a | n/a | n/a |

`CardGrid` is content, not controls, so it has no hover: the four grids it
replaced in September 2026 lifted on hover and read as clickable when they were
not. `PointerGlowCard` lights its border and surface under a fine pointer, and focus
anywhere inside it lights the card and moves the spotlight to the focused
element, so its hover has a keyboard counterpart. `TestimonialCard` is static
content with nothing to focus. Until September 2026 a `hover:shadow-md`
signalled an interaction the card does not have, and it was marked `!`; that is
gone, so hover is `n/a`. Its stars are now one image named "Rated N out of 5",
so the rating is announced as well as drawn.

### Annotation

| Component | default | hover | focus | active | disabled |
|---|---|---|---|---|---|
| `animation/SketchHighlight` | + | n/a | n/a | n/a | n/a |
| `callouts/SketchArrow` | + | n/a | n/a | n/a | n/a |

Both are marks rather than controls: they draw over or behind content that is
already in the document, take no pointer events and hold no state a reader
could change. `SketchHighlight` has one opt-in pointer behaviour,
`resketchOnHover`, which re-rolls the wobble in the stroke and says nothing, so
it has no keyboard counterpart to miss. `SketchArrow` is hidden from assistive
technology unless it is given a `label`, at which point it becomes a named
image, because an arrow that carries meaning has to be readable and one that
repeats the copy next to it should not be read twice. Under reduced motion both
hold their first take still, and both stop cycling while the tab is hidden.

---

## Known gaps this matrix does not close

Focus is now present everywhere. These remain open and are tracked here rather
than being quietly dropped:

- **Only `MorphDialog` implements a focus trap.**
  `MobileMenu`, `SubmissionLoader` and `CelebrationOverlay` are all full-screen
  overlays with background content still tabbable underneath.
- **Loading is rarely announced.** `aria-busy` and a live region appear in
  `loaders/MultiStepLoader` and the two skeletons in
  `loaders/SkeletonCard`; `feedback/ImagePlaceholder` has `aria-busy` alone.
  `LoadingSpinner` and the rest still have neither.
- **Error is visual only in every form component.** No form component sets
  `aria-invalid` or `aria-describedby`.
- **A label is not associated with its input.** `SidePanel`'s `PanelField`
  renders a `<label>` that neither wraps its control nor carries `htmlFor`.
- **`forms/CheckboxVariants`' four exports have no accessible name at all.**

### Avatar

| Component | default | hover | focus | active | disabled |
|---|---|---|---|---|---|
| `display/PixelAvatar` | + | + | n/a | n/a | n/a |

An avatar is an image, not a control. Hover plays one frame, the eyes shut and
the sprite lifts one cell, and changes nothing a reader relies on, so there is
no keyboard counterpart to owe. A focusable parent, such as a row or a link, can
play the same frame by changing `playKey`. The sprite is hidden from assistive
technology unless it is given a `label`, since it usually sits next to the name
it stands for. Under reduced motion the idle loop stops and hover keeps the
blink but drops the hop; the idle loop also skips its turn while the tab is
hidden.

### Celebration

| Component | default | hover | focus | active | disabled |
|---|---|---|---|---|---|
| `feedback/ConfettiFirecracker` | + | n/a | n/a | n/a | n/a |

It renders no element of its own until it is fired, and what it then adds is a
fixed canvas that is `aria-hidden`, takes no pointer events and is removed on
the last frame, so there is nothing to hover, focus or disable. The word it
spells is decoration and is never the only place a message appears. Its
optional tap trigger ignores presses on anything matching
`a, button, input, textarea, select, label, [role=button]`, so it cannot steal a
control's press, and it counts only the primary pointer. Under reduced motion it
still fires, with the word rendered at rest instead of thrown.
