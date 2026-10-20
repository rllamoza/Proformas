---
name: Neumorphic Precision Systems
colors:
  surface: '#f6f9ff'
  surface-dim: '#d4dbe2'
  surface-bright: '#f6f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4fc'
  surface-container: '#e8eef6'
  surface-container-high: '#e3e9f1'
  surface-container-highest: '#dde3eb'
  on-surface: '#161c22'
  on-surface-variant: '#45464e'
  inverse-surface: '#2b3137'
  inverse-on-surface: '#ebf1f9'
  outline: '#75777e'
  outline-variant: '#c5c6cf'
  surface-tint: '#505e80'
  primary: '#041533'
  on-primary: '#ffffff'
  primary-container: '#1b2a49'
  on-primary-container: '#8392b6'
  inverse-primary: '#b7c6ed'
  secondary: '#a23f00'
  on-secondary: '#ffffff'
  secondary-container: '#ff752b'
  on-secondary-container: '#5f2200'
  tertiary: '#211400'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b2700'
  on-tertiary-container: '#ac8d5b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b7c6ed'
  on-primary-fixed: '#0a1b39'
  on-primary-fixed-variant: '#384667'
  secondary-fixed: '#ffdbcd'
  secondary-fixed-dim: '#ffb595'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#7c2e00'
  tertiary-fixed: '#ffdeab'
  tertiary-fixed-dim: '#e4c18b'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5a4318'
  background: '#f6f9ff'
  on-background: '#161c22'
  surface-variant: '#dde3eb'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  numeric-currency-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  numeric-currency-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system is engineered for specialized technical-commercial quotation and installation workflows in the Peruvian enterprise and construction sectors. Its identity balances industrial engineering authority with tactile digital craftsmanship. 

The aesthetic execution leverages modern, disciplined Neomorphism. Unlike first-generation neumorphic experiments that suffered from low contrast and legibility degradation, this system treats light, extrusion, and cavity as structural cues while relying on high-contrast typography, crisp iconography, and unambiguous accent signals for transactional data. Surfaces appear extruded directly from the matte substrate, with light casting from the top-left (-135°) at all times. Physical tactile feedback—such as sinking buttons on click and deeply engraved inputs—grounds the user in a reliable, precision-tooled workspace.

## Colors

The palette is anchored by the matte base tone `#E2E8F0`, which serves as the canvas substrate and the baseline color for extruded surfaces. Depth is produced mathematically through light highlights (`#FFFFFF` with calculated opacities) and ambient shadow sinks (`#94A3B8` to `#64748B` with alpha mixing), rather than chromatic contrast.

- **Substrate & Surface Base:** `#E2E8F0`
- **Primary (Corporate Marine):** `#1B2A49` provides contrast, authoritative headers, active primary controls, and structural data hierarchies.
- **Secondary / Action Accent (Safety Orange):** `#F26B21` is reserved strictly for high-priority purchase intent, final approval CTAs, status badges for pending reviews, and grand totals in Peruvian Soles (S/).
- **Neutral Structure:** `#0F172A` for high-contrast primary text, `#475569` for technical labels and units, and `#CBD5E1` for subtle separator channels.
- **Functional Semantics:** Green `#10B981` (Approved/Installed), Amber `#F59E0B` (Under Observation), and Red `#EF4444` (Rejected/Void).

## Typography

The type system relies on `Inter` across all text tiers to maintain neutral legibility against shadowed surfaces.

All monetary figures representing Peruvian currency (e.g., `S/ 14,850.00`) and technical measurement metrics (e.g., `m²`, `kVA`, `AWG`) must enforce tabular numbers (`font-feature-settings: "tnum" 1, "cv05" 1`). This prevents character shifting when line items update and keeps decimal alignments balanced in quotation sheets. Titles and labels utilize tighter letter spacing to balance the soft, spread shadows of the surrounding components.

## Layout & Spacing

A 12-column fluid grid governs desktop and tablet screens, shifting to a 4-column structure under 640px. Because neumorphic elements cast bidirectional shadows with soft blurs (up to 16px spread), gutters must be strictly preserved at a minimum of `1.5rem` on desktop to prevent shadow overlap and visual mud.

- **Desktop (≥ 1024px):** 12 columns, `gutter: 1.5rem`, `margin: 2rem`, max-width content container set to `1440px`.
- **Tablet (641px - 1023px):** 8 columns, `gutter: 1rem`, `margin: 1.5rem`.
- **Mobile (≤ 640px):** 4 columns, `gutter: 0.75rem`, `margin: 1rem`.

Component padding relies strictly on the `space-*` scale: dense data tables utilize `space-sm` vertical padding with `space-md` horizontal cell margins, while summary quotation cards require `space-lg` to allow dual-edge lighting room to dissipate smoothly.

## Elevation & Depth

All visual depth relies on an ambient dual light source model calibrated precisely for `#E2E8F0`:
- **Light Angle:** 315° (top-left illumination: light at -5px, -5px; shadow at 5px, 5px).
- **Extruded Level 1 (Resting Cards, Floating Panels):**
  `box-shadow: -6px -6px 14px rgba(255, 255, 255, 0.85), 6px 6px 14px rgba(148, 163, 184, 0.45);`
- **Extruded Level 2 (Interactive Floating Elements, Modals, Hover States):**
  `box-shadow: -10px -10px 20px rgba(255, 255, 255, 0.95), 10px 10px 20px rgba(148, 163, 184, 0.55);`
- **Sunken / Inset Level 1 (Inputs, Search, Inactive Toggle Wells):**
  `box-shadow: inset -3px -3px 7px rgba(255, 255, 255, 0.8), inset 3px 3px 7px rgba(148, 163, 184, 0.4);`
- **Sunken / Inset Level 2 (Pressed Buttons, Selected Segmented Tabs):**
  `box-shadow: inset -5px -5px 10px rgba(255, 255, 255, 0.85), inset 5px 5px 10px rgba(148, 163, 184, 0.5);`
- **Hybrid Accent Shadows (Orange Highlighted Elements):**
  `box-shadow: -4px -4px 10px rgba(255, 255, 255, 0.9), 4px 4px 12px rgba(242, 107, 33, 0.35);`

No 1px solid black or dark gray borders are permitted. Boundaries are defined exclusively through contrast between highlight bevels and drop shadows.

## Shapes

The design system employs a consistent `roundedness: 2` (base `0.5rem` / `8px` corner radius) across all interactive controls, extending to `1rem` (`16px`) for structural cards and panels, and `1.5rem` (`24px`) for master proforma sheets and modal overlays.

Sharp corners (0px) are prohibited because dual-shadow lighting clips unnaturally at hard angles, breaking the extruded surface illusion. Circular radii (`rounded-full`) are reserved exclusively for icon buttons, avatars, and segmented status indicators.

## Components

### Buttons
- **Primary Action (Extruded Marine):** Background `#1B2A49`, text `#FFFFFF`, font-weight 600. Shadow: `-4px -4px 10px rgba(255, 255, 255, 0.6), 4px 4px 12px rgba(27, 42, 73, 0.45)`. On active/pressed: transforms to inset shadow `inset 3px 3px 6px rgba(0, 0, 0, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.1)`.
- **Conversion Accent (Vibrant Orange):** Background `#F26B21`, text `#FFFFFF`. Used for "Emitir Proforma", "Aprobar Presupuesto", and final checkout operations.
- **Secondary / Neumorphic Soft:** Background `#E2E8F0`, text `#1B2A49`. Extruded Level 1 shadow. On press, transitions to Sunken Level 2 with zero layout shift.

### Input Fields & Selects
- Background matches canvas `#E2E8F0`.
- Applied Sunken Level 1 inner shadow (`inset -3px -3px 7px... inset 3px 3px 7px...`).
- Active focus state: inner shadow deepens slightly and adds a clean 1.5px outer glow using `#F26B21` at 50% opacity. Text color `#0F172A`, placeholder `#94A3B8`.

### Checkboxes & Radios
- **Unchecked:** Inset sunken square or circle (`18px × 18px`) into the `#E2E8F0` plane.
- **Checked:** Sunken base with an extruded pill/dot inside finished in `#F26B21` or `#1B2A49`.

### Cards & Proforma Item Sheets
- Extruded Level 1 surface with base `#E2E8F0`. Padding `space-lg`.
- Line item rows inside cards use subtle alternating divider trenches: a top light edge (`1px solid #FFFFFF`) paired with a bottom dark edge (`1px solid #CBD5E1`) creating an engraved groove effect.

### Chips & Status Tags
- **Informative:** Extruded Level 1 pill, text `#1B2A49`, uppercase tracking.
- **Totalizer Chip:** Sunken well holding tabular bold digits in `#F26B21` highlighting subtotal, IGV (18%), and final price in Soles.

### Installation Material Line Item (Specialized Component)
- A compound horizontal row: left-hand drag/sequence indicator (recessed groove), middle item description and unit count (flat text), and right-hand unit cost/total inputs (recessed numeric wells with tabular alignment).