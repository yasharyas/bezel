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
   error all need a second signal — a mark, a label, or an ARIA attribute.
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
| `forms/DOBPicker` | + | – | + | – | – | n/a | + | n/a |
| `forms/SelectInput` | + | – | + | + | – | – | + | + |
| `forms/Checkbox` | + | – | + | – | – | n/a | + | n/a |
| `forms/CheckboxVariants` (×4) | + | + | + | + | – | n/a | – | n/a |
| `forms/RadioGroup` | + | + | + | – | – | n/a | + | n/a |
| `forms/MD3Switch` | + | + | + | + | + | – | – | n/a |
| `forms/FileUpload` | + | + | + | – | – | – | + | + |
| `forms/BlenderUpload` | + | + | + | + | + | + | ! | + |

`TextInput`, `DOBPicker`, `SelectInput` and `Checkbox` render an error but none
of them set `aria-invalid` or link the message with `aria-describedby`, so the
error is visual only. `BlenderUpload` reports errors through a callback and
renders nothing — marked `!`.

### Buttons and links

| Component | default | hover | focus | active | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|
| `GlassButton` | + | + | + | + | + | n/a | n/a | n/a |
| `buttons/PinchedButton` | + | + | + | + | + | n/a | n/a | n/a |
| `buttons/StarBorder` | + | + | + | + | + | n/a | n/a | n/a |
| `buttons/ToolbarButton` | + | + | + | – | + | n/a | n/a | n/a |
| `buttons/BorderBeamButton` | + | + | + | + | – | n/a | n/a | n/a |
| `buttons/ConicBorderButton` | + | + | + | + | – | n/a | n/a | n/a |
| `buttons/CircleCTA` | + | + | + | – | – | n/a | n/a | n/a |
| `buttons/TextDisperseLink` | + | + | + | – | n/a | n/a | n/a | n/a |
| `buttons/WaxSealButton` | + | + | + | + | – | n/a | n/a | n/a |
| `buttons/WhatsAppFAB` | + | + | + | – | n/a | n/a | n/a | n/a |

`PinchedButton` and `StarBorder` are the only two that were complete before this
pass, and they are the reference for the rest.

### Navigation

| Component | default | hover | focus | active/current | disabled |
|---|---|---|---|---|---|
| `navigation/Pagination` | + | + | + | + | ! |
| `navigation/StepperNavigation` | + | + | + | + | + |
| `navigation/Breadcrumb` | + | + | + | + | n/a |
| `navigation/CategoryChips` | + | + | + | + | – |
| `navigation/CategoryGrid` | + | + | + | – | – |
| `navigation/MobileBottomNav` | + | + | + | + | – |
| `navigation/TubelightNavBar` | + | + | + | + | – |
| `navigation/StickyNav` | + | + | + | + | – |
| `navigation/StickyNavbar` | + | + | + | + | – |
| `navigation/SiteHeader` | + | + | + | – | – |
| `navigation/MobileMenu` | + | + | + | – | n/a |
| `navigation/SectionProgressRail` | + | – | + | + | n/a |
| `navigation/CollapsibleSidebar` | + | + | + | – | – |

`Pagination` marks disabled with `disabled:pointer-events-none` on an `<a>`.
Anchors are never `:disabled`, so those classes are dead — marked `!`.

Active/current is a colour change in most of these and carries no `aria-current`
or `aria-selected`, which breaks cross-cutting rule 2 above.

### Feedback, overlays and panels

| Component | default | hover | focus | active | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|
| `feedback/EmptyState` | + | + | + | – | – | n/a | n/a | + |
| `feedback/EcomEmptyState` | + | + | + | + | – | n/a | + | + |
| `feedback/ErrorBoundary` | + | + | + | – | n/a | n/a | + | n/a |
| `feedback/CelebrationOverlay` | + | – | + | – | + | n/a | n/a | n/a |
| `feedback/TillReceiptPrint` | + | – | + | – | – | n/a | n/a | n/a |
| `feedback/SubmissionLoader` | n/a | n/a | n/a | n/a | n/a | + | n/a | n/a |
| `feedback/LoadingSpinner` | n/a | n/a | n/a | n/a | n/a | ! | n/a | n/a |
| `feedback/ToastContainer` | n/a | n/a | n/a | n/a | n/a | n/a | ! | n/a |
| `dialogs/DualConfirmDialog` | + | + | + | + | + | + | n/a | n/a |
| `overlays/SearchOverlay` | + | + | + | + | – | – | n/a | + |
| `panels/SidePanel` | + | + | + | – | – | n/a | – | n/a |
| `panels/StickyCartBar` | + | + | + | – | – | n/a | n/a | n/a |

`LoadingSpinner` renders a spinner with no `role="status"` and no accessible
label, so the loading state exists visually and not at all for assistive tech —
marked `!`. `ToastContainer` has the same gap: no `role="status"`, no
`aria-live`, so nothing it says is ever announced.

---

## Known gaps this matrix does not close

Focus is now present everywhere. These remain open and are tracked here rather
than being quietly dropped:

- **No component in the library implements a focus trap.** `DualConfirmDialog`,
  `SearchOverlay`, `MobileMenu`, `SubmissionLoader` and `CelebrationOverlay` are
  all full-screen overlays with background content still tabbable underneath.
  `SearchOverlay` handles Escape only while focus is in its input.
- **Loading is almost never announced.** `aria-busy` and a live region appear in
  `loaders/MultiStepLoader` and nowhere else.
- **Error is visual only in every form component.** None set `aria-invalid` or
  `aria-describedby`.
- **Two labels are not associated with their inputs** — `Input.tsx` and
  `SidePanel`'s `PanelField` both render a `<label>` that neither wraps its
  control nor carries `htmlFor`.
- **`forms/CheckboxVariants`' four exports have no accessible name at all.**
