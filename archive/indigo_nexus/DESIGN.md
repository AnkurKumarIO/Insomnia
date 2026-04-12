# Design System Specification: The Luminescent Architecture

## 1. Overview & Creative North Star: "The Digital Curator"
This design system rejects the cluttered density of traditional SaaS platforms in favor of a high-end, editorial experience. Our Creative North Star is **The Digital Curator**. Like a modern art gallery, the UI serves as a sophisticated, silent vessel for data, utilizing expansive negative space, high-contrast typography scales, and a "layered-glass" philosophy.

We move beyond the "template" look by embracing **Intentional Asymmetry**. Dashboards should not be rigid grids; they are compositions of varying surface heights and weights. By prioritizing tonal depth over structural lines, we create a tech-savvy environment that feels both authoritative and ethereal—inspired by the precision of Linear and the atmospheric minimalism of Vercel.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in deep obsidian tones, punctuated by high-vibrancy accents. We do not use color to decorate; we use it to direct.

### Core Philosophy
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background shifts (e.g., a `surface-container-low` section resting on a `surface` background). This creates a seamless, "molded" appearance rather than a boxed-in layout.
*   **Surface Hierarchy & Nesting:** Use the surface-container tiers (`lowest` to `highest`) to create physical depth. Inner containers should use a higher tier to "lift" toward the user, or a lower tier to "recede" into the UI.
*   **The Glass & Gradient Rule:** Floating elements (modals, dropdowns) must utilize Glassmorphism. Use semi-transparent `surface-container-highest` with a `backdrop-filter: blur(20px)`.
*   **Signature Textures:** Main CTAs and hero elements should employ a subtle linear gradient from `primary-container` (#4F46E5) to `primary` (#C3C0FF) at a 135-degree angle to provide a "spectral" glow that flat hex codes cannot replicate.

### Primary Palette (Functional Tokens)
*   **Surface (Base):** `#0b1326`
*   **Primary (Indigo Glow):** `#c3c0ff` (Text/Iconography), `#4f46e5` (Action Container)
*   **Secondary (Success Green):** `#4edea3`
*   **Tertiary (Warning Yellow):** `#ffb95f`
*   **Error:** `#ffb4ab`

---

## 3. Typography: The Editorial Scale
We use **Inter** as our sole typeface to maintain a clean, engineering-led aesthetic. The hierarchy relies on extreme contrast between `display` and `label` sizes to create a sense of importance and scale.

*   **Display (lg/md/sm):** Used for "hero" moments and data milestones. Set with a letter-spacing of `-0.04em` to create a tight, custom-type feel.
*   **Headline & Title:** Used for section headers. Bold weights are reserved only for `headline-lg` and `title-sm` to maintain a sophisticated balance.
*   **Body (lg/md/sm):** High-readability weights (Regular 400). Use `on-surface-variant` (#C7C4D8) for secondary body text to reduce visual noise.
*   **Labels:** Always uppercase with `+0.05em` letter-spacing. These function as "signposts" in the UI, providing a technical, metadata aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Depth is not an effect; it is an architecture. We use **Tonal Layering** instead of structural lines.

*   **The Layering Principle:** 
    *   Base Layer: `surface` (#0B1326)
    *   Section Layer: `surface-container-low` (#131B2E)
    *   Component/Card Layer: `surface-container` (#171F33) or `surface-container-high` (#222A3D)
*   **Ambient Shadows:** For floating elements (Modals/Popovers), use a multi-layered shadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(195, 192, 255, 0.05)`. The subtle tint of `primary` in the shadow's rim reinforces the "Luminescent" theme.
*   **The Ghost Border Fallback:** If a border is required for extreme accessibility, use `outline-variant` (#464555) at 20% opacity. Never use 100% opaque borders.
*   **Corner Radius:** A universal `14px` (`lg` scale) is applied to all cards and containers to soften the technical edge of the dark mode.

---

## 5. Components: The Primitive Set

### Buttons & Inputs
*   **Primary Button:** Gradient fill (`primary-container` to `primary`). No border. `label-md` uppercase text.
*   **Secondary/Ghost Button:** No background. `outline-variant` border at 20% opacity. On hover, transition to `surface-container-highest`.
*   **Input Fields:** Use `surface-container-lowest` as the fill. The active state should not use a thick border, but rather a "glow" using a 1px `primary` shadow.

### Data & Content
*   **Cards:** Forbid divider lines. Separate content using `1.5rem` (xl) vertical spacing or a background shift to `surface-container-highest`.
*   **Chips:** High-radius (full). Use `secondary-container` with `on-secondary-container` text for a subtle, tech-modern tag look.
*   **Alumni Intelligence Cards (Custom):** For AI-driven insights, use a `surface-variant` background with a subtle 2px blurred "left-edge" accent in `primary`.

### Navigation
*   **Sidebar:** `surface-container-low`. Active states should be indicated by a `primary` text color shift and a subtle `surface-container-high` background pill—never a vertical line indicator.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme white space (vertical padding) to separate major sections.
*   **Do** use `backdrop-filter: blur` on all navigation bars to let background content bleed through subtly.
*   **Do** use `on-surface-variant` for all non-essential metadata.
*   **Do** treat the "Indigo" primary color as a light source; it should feel like it is glowing against the dark background.

### Don't
*   **Don't** use 1px solid borders to create grids or tables.
*   **Don't** use pure black (#000000). Always use the `surface` obsidian tones to maintain depth.
*   **Don't** use standard "Drop Shadows." Use the Ambient Shadow specification provided in Section 4.
*   **Don't** use more than two different font weights on a single screen. Contrast should come from size and color, not weight.