# T29 · Action Potential Generation

## 1. Topic Name
**Generation and Conduction of Nerve Impulse — Resting Potential, Action Potential, Repolarisation** — NCERT Class 11 Biology, *Neural Control and Coordination*, §18.3.1.

## 2. Subject Type & Hierarchy
Biology → Human Physiology → Neural System → Electrical Excitability

## 3. Comprehensive Explanation (Strict NCERT Teacher's Guide)

**Definition & Foundation.** Neurons are excitable because their membranes are in a **polarised state**. Ion channels in the neural membrane are selectively permeable to different ions.

**Resting State (Polarisation).** When a neuron is not conducting:
- Membrane is **more permeable to K⁺**, **nearly impermeable to Na⁺**, **impermeable to negatively charged proteins** in the axoplasm.
- Inside: high K⁺, high negative proteins, low Na⁺.
- Outside: low K⁺, high Na⁺.
- Concentration gradients **actively maintained by the Na-K pump**: "transports 3 Na⁺ outwards for 2 K⁺ into the cell."
- Net result: **outer surface positive, inner surface negative** → membrane is **polarised**.
- "The electrical potential difference across the resting plasma membrane is called the **resting potential**."

**Generation of Action Potential.**
- A stimulus at site A makes the membrane there freely permeable to **Na⁺**.
- **Rapid influx of Na⁺** → polarity reverses: outer becomes negative, inner becomes positive.
- "The polarity of the membrane at site A is thus reversed and hence **depolarised**."
- "The electrical potential difference across the plasma membrane at site A is called the **action potential**, which is in fact termed as a **nerve impulse**."

**Conduction along the axon.**
- At site A (depolarised) and site B (still polarised), the polarity difference drives a current.
- Inside: current flows A → B. Outside: current flows B → A — completing the circuit.
- This causes site B's polarity to reverse → action potential generated at B.
- "The sequence is repeated along the length of the axon."

**Repolarisation.**
- Na⁺ permeability rise is "extremely short-lived" → quickly followed by **rise in K⁺ permeability**.
- "Within a fraction of a second, K⁺ diffuses outside the membrane and restores the resting potential of the membrane at the site of excitation."
- Fibre becomes responsive to further stimulation. (This recovery interval = **refractory period**.)

## 4. Real-World Analogy and Applications
- **Daily life:** falling dominos — one tip topples the next, the wave races down the line, but each domino has to be reset before it can fire again.
- **Biological:** local anaesthetic (lignocaine) blocks Na⁺ channels → no depolarisation can propagate → no pain signal reaches brain.
- **Industry:** EEG / nerve-conduction-velocity tests measure exactly these propagating action potentials.

## 5. Simulation Design & UX

### Teaching Objective
Show that an action potential isn't a current flowing along a wire — it's a **wave of local depolarisation-repolarisation** travelling along the membrane, regenerated at every point. And tie the Na⁺/K⁺ pump's quiet maintenance work to the spectacular AP fireworks.

### Visual Environment & Aesthetic
Centre-canvas: a beautifully drawn **horizontal axon** taking up most of the width — a translucent cylindrical membrane with Na-K pumps visible as small embedded gear icons, Na⁺ channels and K⁺ channels as distinct gated pores. Ion particles (Na⁺ as cyan dots, K⁺ as amber dots) drift inside and outside in their NCERT concentrations.

Above the axon: a **live voltage trace** scrolls in real time as the membrane voltage at a probe location.

Soft white background, premium glass-morphism membrane.

### Smartboard Layout & Responsiveness
4-zone layout. Left aside = **Voltage vs Time** plot (live, with marked phases) + **Ion permeability** stacked bars (Na⁺ vs K⁺). Right aside = NCERT phases card + live readouts (membrane potential mV, Na⁺ influx rate, K⁺ efflux rate, propagation velocity m/s, state: resting/depolarising/repolarising/refractory).

### Simulation Elements (Visual Metaphors — premium motion)
- **Resting state**: Na-K pump gears spin slowly; for each cycle, **3 cyan Na⁺ ejected outward, 2 amber K⁺ pulled inward** with arrow animations. Concentration gradients shown by ion density (lots of cyan outside, lots of amber inside).
- Outer membrane glows **faint orange/positive**; inner glows **faint cyan/negative** — the polarisation.
- **Stimulus**: teacher clicks at a point on the axon → bright **stimulus flash**.
- **Depolarisation wave**:
  - Na⁺ channels at the stimulus site **swing open** (cute gate animation) → **cyan ions rush IN** as a wave of arrows.
  - Local polarity **flips** (colour swap of inner/outer glow at the site).
  - Voltage trace spikes upward to about +30 mV.
- **Propagation**: the depolarised site triggers the **neighbouring section** — Na⁺ channels there open in turn → the wave **travels visibly** along the axon (like a torchlight relay).
- **Repolarisation**: K⁺ channels open with a slight delay → amber K⁺ rushes OUT → polarity restores → voltage drops back to -70 mV. Brief **undershoot** dip then settles. Site shown in greyish "refractory" tint until pump restores gradients fully.
- **All-or-none demo**: stimuli below threshold do nothing; at threshold a full AP fires with identical amplitude regardless of stimulus strength.

### Teacher Demonstration Controls
- **Stimulus location**: click anywhere on axon (with chunky finger-target).
- **Stimulus strength slider** (sub-threshold → threshold → supra-threshold).
- **Speed control** segmented: Slow-mo (0.1×) · Normal · Fast.
- **Channel block toggles**: ⛔ Block Na⁺ channels (anaesthetic) · ⛔ Block K⁺ channels (no repolarisation) · ⛔ Disable Na-K pump (gradient slowly drains).
- **Myelin toggle**: show/hide a myelin sheath with nodes of Ranvier (saltatory conduction visible) — NCERT context.
- **Probe** draggable along axon — voltage trace reflects the probe location.
- Pause/Play/Reset top-right.

### What the Class Observes
- Default: stimulus → AP races down axon at ~50 m/s with crisp wave + trace spike.
- Sub-threshold stimulus: tiny local Na⁺ trickle, no propagation. Trace shows a small wobble.
- Block Na⁺ channels: stimulus does nothing. The "lignocaine" demo.
- Block K⁺ channels: depolarisation can't end. Trace stays high. Demonstrates why repolarisation is essential.
- Disable Na-K pump: AP works for a few firings, then gradient drains, then no more APs. Class sees the pump's "silent partner" role.
- Enable myelin: AP **jumps node-to-node** with visible saltatory leaps → much faster propagation. NCERT-friendly bonus.

### Scientific Logic (NCERT Aligned)
3 Na⁺ out / 2 K⁺ in stoichiometry, Na⁺-impermeable at rest, depolarisation = polarity reversal, K⁺ efflux for repolarisation, refractory period, propagation by local current flow — all NCERT verbatim. Resting potential shown as ~-70 mV but the number is not in NCERT — labelled as "approximate value" in theory card. Threshold value not from NCERT — described as "the firing threshold" without a number.

### Step-by-Step Teaching Sequence
1. Default resting view. **Q:** "Why is the inside of a resting neuron negative?" Show pump in action.
2. Click axon → fire one AP. Watch wave + trace. **Q:** "What ions did what?"
3. Slow-mo a single AP. Step through Na⁺ in → polarity flip → K⁺ out → polarity restore. NCERT phase labels light up in sync.
4. Sub-threshold stimulus. **Q:** "Why does nothing happen?" Reveal all-or-none.
5. Block Na⁺ → block K⁺ → disable pump (one at a time). Each shows a different failure mode.
6. Enable myelin. **Q:** "Why is this so much faster?" Saltatory leap visible.

### Learning Outcome
Students leave with a clean mental model: **resting state = polarised by Na-K pump; AP = brief Na⁺ rush flipping polarity; conduction = wave that regenerates at every point; recovery = K⁺ rush + pump restoration.** They can answer NCERT exercises on neuron polarisation, AP generation, conduction, and the role of Na/K pumps.
