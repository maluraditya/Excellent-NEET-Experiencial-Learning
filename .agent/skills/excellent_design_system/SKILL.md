---
name: "Excellent Design System"
description: "Core UI/UX tokens, patterns, and anti-patterns for the Excellent Academy platform. MUST use when creating or modifying any visual components."
---

# Excellent Academy Design System

This skill enforces the specific visual language, tokens, and aesthetic rules for the Excellent Academy Digital Textbook platform. Apply these principles rigorously when writing or modifying UI code.

## 1. Typography

We use a dual-font strategy. NEVER use default fonts.

- **Headings & Display Text**: `font-display` (Manrope)
  - Use `font-black` (900) or `font-extrabold` (800) for large hero text and card titles.
  - Tracking: Use `tracking-tight` for huge headers, `tracking-wider` or `tracking-widest` for uppercase microcopy (e.g., tags, labels).
- **Body & Paragraphs**: `font-sans` (Inter)
  - Use `text-slate-600` or `text-slate-500` for body copy to reduce contrast harshness compared to pure black.
  - Line Height: Use `leading-relaxed` for long-form textbook content.

## 2. Color Palette & Theming

Do not use hard-coded hex values in components. Use our Tailwind configuration:

- **Primary**: `bg-brand-primary` / `text-brand-primary` (Deep Red)
- **Secondary**: `bg-brand-secondary` / `text-brand-secondary` (Warm Yellow)
- **Dark Mode / Deep Contrasts**: `bg-brand-dark` / `text-brand-dark`
- **Neutrals**: Rely heavily on the `slate` scale (`slate-900` for primary text, `slate-500/600` for secondary, `slate-50/100` for subtle card backgrounds).
- **Subject Themes**:
  - Physics: `blue-500`
  - Chemistry: `rose-500`
  - Biology: `emerald-500`

## 3. Border Radius & Shapes (Crucial)

We have explicitly moved away from the generic "pill" look (`rounded-full`). Follow this strict scale:

- **Avatars & Pure Icon Buttons (circular)**: `rounded-full`
- **Large Cards & Main Layout Containers**: `rounded-2xl`, `rounded-3xl`, or `rounded-[2.5rem]`
- **Standard Buttons (e.g., Launch Lab)**: `rounded-xl` or `rounded-2xl`
- **Inputs & Tags**: `rounded-xl`
- **Tooltips & Small Badges**: `rounded-md` or `rounded-lg`

*Anti-Pattern*: Do NOT use `rounded-full` for standard text buttons, search bars, or filter dropdowns.

## 4. Spacing & Spatial Design

- Use explicit gap spacing in flex/grid layouts rather than margins.
- Ensure all touch targets on mobile devices are at least 44x44px.
- Container padding should scale: `p-3 sm:p-4 md:p-8 lg:p-12`.

## 5. Visual Hierarchy & Micro-Animations

- **Shadows**: Use subtle shadows. Combine `shadow-sm` with `border border-slate-200` for standard cards. Use large, colored soft shadows on hover (e.g., `hover:shadow-[0_20px_40px_-15px_rgba(...,0.5)]`).
- **Glassmorphism**: Use sparingly for overlays: `bg-white/40 backdrop-blur-xl border border-white/60`.
- **Animations**:
  - In-animations: Use `animate-in fade-in slide-in-from-bottom-4 duration-700`.
  - Hover states: `transition-all duration-300 hover:-translate-y-1`.

## 6. Callouts & Textbook Content

- *Anti-Pattern*: Do NOT use the standard AI "side-stripe" pattern (`border-l-4 border-color-500`).
- *Correct Pattern*: Use a full, subtle border with a tinted background (e.g., `bg-amber-50 border border-amber-200 shadow-sm rounded-xl`).

## 7. Accessibility (A11y)

- **Focus Rings**: A global `:focus-visible` ring is defined in `globals.css` (`outline: 2px solid #B3202F`). Ensure all interactive elements (buttons, inputs) can receive focus.
- **Contrast**: Ensure text over images or gradients maintains a 4.5:1 ratio.

## 8. General AI Anti-Patterns to Avoid

- **Sparing Gradient Text**: You may use `bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent` exclusively for massive Hero headings to create a "wow" moment. Avoid using it for standard body text, buttons, or small labels to prevent a generic AI-generated aesthetic.
- **No Over-stuffed Grids**: Give elements room to breathe.
- **No nested cards**: Use dividers, spacing, or typography to create hierarchy within a card, not another card.
