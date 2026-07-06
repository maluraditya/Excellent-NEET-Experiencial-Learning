# T25 · Cardiac Cycle & ECG Waves

## 1. Topic Name
**Cardiac Cycle and Electrocardiogram (ECG)** — NCERT Class 11 Biology, *Body Fluids and Circulation*, §15.3.2 and §15.3.3.

## 2. Subject Type & Hierarchy
Biology → Human Physiology → Cardiovascular System

## 3. Comprehensive Explanation (Strict NCERT Teacher's Guide)

**Definition & Foundation.** "The sequential events in the heart which is cyclically repeated is called the cardiac cycle and it consists of systole and diastole of both the atria and ventricles." Normal rate: **72 cycles/min** → duration **0.8 s/cycle**.

**Pacemaker — SAN.** The **sinoatrial node (SAN)** in the upper right corner of the right atrium generates the action potential that drives each cycle — it sets the heart's pace.

**AVN.** The action potential reaches the **atrioventricular node (AVN)** in the lower-left of the right atrium, from where it conducts to ventricular musculature.

**Phases (NCERT description, condensed):**
1. SAN fires → **atrial systole** (atria contract simultaneously) → blood pushed into ventricles.
2. **Ventricular systole** → tricuspid + bicuspid valves close (**"lub"**) → semilunar valves forced open → blood ejected into pulmonary artery (right) and aorta (left).
3. **Ventricular diastole** → ventricular pressure falls → semilunar valves close (**"dub"**) → backflow prevented.
4. As pressure drops further, tricuspid/bicuspid valves open from atrial side → blood refills ventricles.
5. **Joint diastole** → all chambers relaxed; SAN fires again → loop repeats.

**Stroke Volume & Cardiac Output.**
- **Stroke volume = ~70 mL** per ventricle per cycle.
- **Cardiac output = stroke volume × heart rate ≈ 5000 mL = 5 L/min** in a healthy adult.
- Both stroke volume and HR are adjustable → athletes have higher CO.

**Heart Sounds.** Two per cycle, clinically diagnostic: **"lub"** = tricuspid/bicuspid closure; **"dub"** = semilunar valve closure.

**ECG (Electrocardiogram).** "Graphical representation of the electrical activity of the heart during a cardiac cycle." Standard ECG: 3 leads (one on each wrist + left ankle).
- **P wave** = atrial depolarisation → atrial contraction.
- **QRS complex** = ventricular depolarisation → ventricular contraction (marks **beginning of systole**).
- **T wave** = ventricular repolarisation → return to normal; end of T marks **end of systole**.

**Heart rate** = count QRS complexes per minute. Deviations from standard shape indicate abnormality/disease.

## 4. Real-World Analogy and Applications
- **Daily life:** the rhythmic squeezing-and-releasing of a turkey baster — fill / squeeze / refill.
- **Biological:** athlete's resting bradycardia (40-50 bpm) maintaining 5 L CO via higher stroke volume.
- **Industry:** the ICU bedside monitor — the "pip…pip…peeeee" of a flatline is literally absent QRS complexes.

## 5. Simulation Design & UX

### Teaching Objective
Lock in the **mapping between the physical heart-pump action, the heart sounds, and the ECG trace** so students never again confuse "P = atria, QRS = ventricles, T = relaxation" or forget the lub-dub.

### Visual Environment & Aesthetic
Centre-canvas: a beautifully simplified **anatomical heart cross-section** showing four chambers, valves, SAN/AVN nodes, pulmonary artery, aorta. Soft white background. Above the heart, a **live ECG trace** scrolls in real time. Below the heart, a thin **audio waveform** of lub-dub plays. To the side, a **stethoscope cursor** the teacher can drag onto the heart to hear sounds locally.

### Smartboard Layout & Responsiveness
4-zone layout. Left aside = **Phase Diagram** card (segmented bar of the 0.8 s cycle with current phase highlighted) + **Pressure-Volume** card (pressure curves of atrium/ventricle/aorta scrolling live). Right aside = NCERT phases card + live readouts (HR bpm, SV mL, CO L/min, current ECG peak).

### Simulation Elements (Visual Metaphors — premium motion)
- **SAN** glows yellow each beat and emits a **propagating golden wave** that races across the atria → atrial walls contract (smooth scale-down).
- Wave converges on **AVN** (red dot) where it pauses briefly (visible delay → the "AV delay" without naming it explicitly), then races down the ventricular walls → ventricles contract with a dramatic squeeze animation.
- **Valves** flap open/closed in sync — bicuspid/tricuspid snap shut with a soft "lub" tone synced to the audio; semilunar snap shut with "dub".
- **Blood flow** shown as drifting red particles with arrows; arrows reverse on diastole.
- **ECG trace** generated procedurally: P emerges as atrial wave fires, QRS spikes at AVN→ventricle conduction, T peaks at relaxation. Trace scrolls left at constant speed; teacher can **pause and scrub** the trace to map any peak back to the heart animation.
- **Cycle clock** — a circular progress ring around the heart that ticks through 0.0 → 0.8 s.

### Teacher Demonstration Controls
- **Heart rate slider** (40 → 180 bpm).
- **Stroke volume slider** (40 → 120 mL).
- **Scenario segmented**: Resting · Exercise · Sleep · Arrhythmia (AVN block).
- **Show/hide layers**: ECG · Heart sounds · Pressure curves · Conduction wave.
- **Step-by-phase mode**: advance one phase at a time (atrial systole → ventricular systole → ventricular diastole → joint diastole) with NCERT labels.
- Pause/Play/Reset top-right.

### What the Class Observes
- Default 72 bpm → ECG trace shows textbook P-QRS-T spacing; live CO settles at ~5 L/min.
- Crank HR to 180 bpm → trace compresses; CO climbs but stroke volume may not match → tie back to the "athlete vs ordinary man" NCERT line.
- AVN block scenario → conduction wave stops at AVN → ventricles don't fire → QRS vanishes → only P waves on trace, no pump action. Class sees why an AV block is fatal.
- Step-mode: pause at QRS onset → click → teacher walks class through the exact NCERT phase description.

### Scientific Logic (NCERT Aligned)
SV = 70 mL, CO = 5 L, HR = 72, cycle = 0.8 s — all live on the right aside. Lub = AV valves closing, dub = semilunar valves — NCERT-exact mapping. P/QRS/T mapping exact. No mention of bundle of His, Purkinje fibres (out of NCERT scope), but conduction wave drawn realistically.

### Step-by-Step Teaching Sequence
1. Default scenario, observe one full cycle. **Q:** "Which chamber pumps first — atria or ventricles? How do you know?"
2. Toggle to step-mode. Walk through 4 phases with audio per phase. **Q at each:** "What's the ECG doing right now?"
3. Drag stethoscope cursor onto AV valves vs semilunar. **Q:** "Why two distinct sounds in one cycle?"
4. Switch to Exercise (HR = 150, SV = 90). Watch CO climb. **Q:** "Why does CO not just double — what limits it?"
5. AVN block scenario. **Q:** "Where on the ECG can you spot this?"
6. End: scrub ECG to align P/QRS/T with each phase. NCERT exercise on ECG-phase mapping cracked.

### Learning Outcome
Students gain a permanent mental model: SAN→atrial contraction→ventricular contraction→relaxation, mapped 1:1 to lub-dub and to P-QRS-T. They can compute CO, explain athlete physiology, and read a basic rhythm strip — covering all of NCERT §15.3.2-3 exercises.
