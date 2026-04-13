---
name: composition-patterns
description: React composition patterns for building scalable, flexible component libraries. Use when refactoring components with boolean prop proliferation, building new lab components, or designing reusable APIs. Triggers on tasks involving compound components, render props, context providers, or component architecture.
---

# React Composition Patterns

Composition patterns for building flexible, maintainable React components in the **Excellent Academy Digital Textbook**. Avoid boolean prop proliferation by using compound components, lifting state, and composing internals.

## When to Apply
Reference these guidelines when:
- Creating a new simulation lab component (`*Lab.tsx`)
- Refactoring components with many boolean props
- Building shared UI components (controls, sliders, panels)
- Reviewing component architecture in a PR from `dev-sandbox`
- Designing how new labs should share common behavior

## Rule Categories by Priority

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Component Architecture | HIGH |
| 2 | State Management | MEDIUM |
| 3 | Implementation Patterns | MEDIUM |

### 1. Component Architecture (HIGH)

#### Avoid Boolean Props
**Bad — boolean prop chaos:**
```tsx
<SimulationLab
  showControls={true}
  showFormulas={true}
  isFullscreen={false}
  hasResetButton={true}
  showTooltips={true}
  isDarkMode={false}
/>
```

**Good — composition:**
```tsx
<SimulationLab>
  <SimulationLab.Canvas />
  <SimulationLab.Controls>
    <SliderControl label="Frequency" />
    <ResetButton />
  </SimulationLab.Controls>
  <SimulationLab.Formulas />
</SimulationLab>
```

#### Compound Components
Structure complex components with shared context. Each sub-component accesses shared simulation state via context, not prop drilling:

```tsx
const SimulationContext = React.createContext<SimulationState | null>(null);

function SimulationLab({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  return (
    <SimulationContext.Provider value={{ state, dispatch }}>
      <div className="lab-container">{children}</div>
    </SimulationContext.Provider>
  );
}

// Sub-components access shared state via context
SimulationLab.Canvas = function Canvas() {
  const { state } = useContext(SimulationContext)!;
  return <canvas /* render using state */ />;
};

SimulationLab.Controls = function Controls({ children }: { children: React.ReactNode }) {
  return <div className="controls-panel">{children}</div>;
};
```

### 2. State Management (MEDIUM)

#### Decouple State Implementation
The Provider is the ONLY place that knows how state is managed. Consuming components only know the interface:

```tsx
// Good — consumers don't know if it's useState, useReducer, or Zustand
interface SimulationActions {
  setFrequency: (f: number) => void;
  reset: () => void;
  togglePlay: () => void;
}

// The provider could switch from useState to Zustand without changing consumers
```

#### Lift State into Providers
Move state into provider components when sibling components need access:

```tsx
// Bad — prop drilling between siblings
function Lab() {
  const [freq, setFreq] = useState(1);
  return (
    <>
      <Canvas frequency={freq} />
      <Slider value={freq} onChange={setFreq} />
      <FormulaDisplay frequency={freq} />
    </>
  );
}

// Good — shared via context
function Lab() {
  return (
    <SimulationProvider>
      <Canvas />
      <Slider />
      <FormulaDisplay />
    </SimulationProvider>
  );
}
```

### 3. Implementation Patterns (MEDIUM)

#### Explicit Variants Over Booleans
Create explicit variant components instead of mode switching:

```tsx
// Bad
<TopicCard isCompact={true} isHighlighted={false} />

// Good
<CompactTopicCard />
<HighlightedTopicCard />
```

#### Children Over Render Props
Use `children` for composition instead of `renderX` props:

```tsx
// Bad
<Panel renderHeader={() => <h2>Controls</h2>} renderBody={() => <Sliders />} />

// Good
<Panel>
  <Panel.Header><h2>Controls</h2></Panel.Header>
  <Panel.Body><Sliders /></Panel.Body>
</Panel>
```

## Anti-Patterns Specific to This Project

| Anti-Pattern | Example | Fix |
|-------------|---------|-----|
| God component | `TextbookContent.tsx` (162KB) handling all grades, subjects, and topics | Break into `GradeSection`, `SubjectSection`, `TopicCard` compound components |
| Prop drilling simulation state | Passing `frequency`, `amplitude`, `wavelength` through 3+ levels | Use `SimulationContext` provider |
| Boolean mode switching | `if (isGrade11) {...} else if (isGrade12) {...}` | Create `Grade11Content` and `Grade12Content` variant components |
| Inline event handlers | `onClick={() => { /* 20 lines */ }}` | Extract to named handler functions or custom hooks |
