---
name: react-best-practices
description: React performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React components to ensure optimal performance patterns. Triggers on tasks involving React components, data fetching, bundle optimization, canvas/simulation rendering, or performance improvements.
---

# React Best Practices (Vercel Engineering)

Comprehensive performance optimization guide for React applications, adapted for the **Excellent Academy Digital Textbook** project (React + TypeScript + Vite).

## When to Apply
Reference these guidelines when:
- Writing new React components or simulation labs
- Reviewing code from the `dev-sandbox` branch
- Refactoring existing components (especially `TextbookContent.tsx`, `App.tsx`, or any `*Lab.tsx` file)
- Optimizing bundle size or load times for smartboard/PWA deployment
- Debugging slow rendering in canvas-based simulations

## Rule Categories by Priority

| Priority | Category | Impact | Key Focus for This Project |
|----------|----------|--------|---------------------------|
| 1 | Eliminating Waterfalls | CRITICAL | Parallel data loading in simulations |
| 2 | Bundle Size Optimization | CRITICAL | PWA load speed on smartboards |
| 3 | Re-render Optimization | HIGH | Canvas simulations with frequent state updates |
| 4 | Rendering Performance | HIGH | SVG/Canvas animation in lab components |
| 5 | JavaScript Performance | MEDIUM | Loop optimization in physics calculations |

### 1. Eliminating Waterfalls (CRITICAL)
- `async-parallel` — Use `Promise.all()` for independent operations. Never chain independent fetches sequentially.
- `async-defer-await` — Move `await` into branches where actually used. Don't block early.
- `async-cheap-condition-before-await` — Check cheap sync conditions before awaiting remote values.

### 2. Bundle Size Optimization (CRITICAL)
- `bundle-barrel-imports` — Import directly from source files, avoid barrel `index.ts` re-exports.
- `bundle-dynamic-imports` — Use `React.lazy()` for heavy lab components (e.g., `WaveOpticsLab`, `SHMLab`). Each lab is large and should not be in the main bundle.
- `bundle-defer-third-party` — Load analytics/logging after hydration, not during initial render.
- `bundle-conditional` — Load simulation libraries only when the user navigates to that lab.

### 3. Re-render Optimization (HIGH)
- `rerender-use-ref-transient-values` — **CRITICAL for simulations.** Use `useRef` for animation frame values (particle positions, wave phases, slider drag values) instead of `useState`. State triggers re-renders; refs do not.
- `rerender-no-inline-components` — Never define components inside other components. This destroys React's reconciliation.
- `rerender-memo` — Extract expensive calculation results into `React.memo()` wrapped components.
- `rerender-derived-state-no-effect` — Derive state during render, not in `useEffect`. Effects cause an extra render cycle.
- `rerender-functional-setstate` — Use functional `setState` (e.g., `setCount(prev => prev + 1)`) for stable callbacks in simulation loops.
- `rerender-lazy-state-init` — Pass a function to `useState` for expensive initial values (e.g., parsing simulation config).
- `rerender-split-combined-hooks` — If a custom hook has independent dependencies, split it into multiple hooks to prevent unnecessary recalculations.

### 4. Rendering Performance (HIGH)
- `rendering-animate-svg-wrapper` — Animate a `<div>` wrapper around SVG elements, not the `<svg>` element itself. SVG re-renders are expensive.
- `rendering-svg-precision` — Reduce SVG coordinate precision to 2 decimal places. Extra decimals waste bytes and GPU cycles.
- `rendering-conditional-render` — Use ternary (`condition ? <A/> : <B/>`) not `&&` (`condition && <A/>`). The `&&` pattern can accidentally render `0` or `""`.
- `rendering-content-visibility` — Use `content-visibility: auto` CSS property for off-screen lab content to skip rendering until visible.

### 5. JavaScript Performance (MEDIUM)
- `js-set-map-lookups` — Use `Set`/`Map` for O(1) lookups instead of `Array.includes()` or `Array.find()`. Important for topic lookups in `TextbookContent.tsx`.
- `js-combine-iterations` — Combine multiple `.filter().map()` chains into a single `.reduce()` or loop. Reduces array allocations.
- `js-early-exit` — Return early from functions. Don't nest deep conditionals.
- `js-batch-dom-css` — Group CSS changes via classes or `cssText`, never set individual style properties in a loop.
- `js-request-idle-callback` — Defer non-critical work (preloading next lab, analytics) to `requestIdleCallback`.

## Anti-Patterns Specific to This Project

| Anti-Pattern | Where It Happens | Fix |
|-------------|-----------------|-----|
| `useState` for animation values | `*Lab.tsx` simulation components | Use `useRef` + `requestAnimationFrame` |
| Importing all labs at top of `App.tsx` | `App.tsx` (63KB file) | Use `React.lazy()` with `<Suspense>` |
| Inline function components | Inside render methods | Extract to module-level named components |
| `useEffect` to derive computed values | Dashboard, TextbookContent | Compute during render instead |
| Full re-render on slider change | Simulation controls | Isolate slider state to a wrapper component |
