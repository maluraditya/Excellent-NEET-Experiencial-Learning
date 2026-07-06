# T28 · Sliding Filament Theory

## 1. Topic Name
**Mechanism of Muscle Contraction — Sliding Filament Theory** — NCERT Class 11 Biology, *Locomotion and Movement*, §17.2.

## 2. Subject Type & Hierarchy
Biology → Human Physiology → Muscular System → Contractile Mechanism

## 3. Comprehensive Explanation (Strict NCERT Teacher's Guide)

**Definition & Foundation.** "Mechanism of muscle contraction is best explained by the **sliding filament theory** which states that contraction of a muscle fibre takes place by the sliding of the thin filaments over the thick filaments."

**The Sarcomere — functional unit.** Portion of myofibril between two successive **Z lines**. Components:
- **A band** (thick + overlap region) — retains length during contraction.
- **I band** (thin filaments only) — shortens during contraction.
- **H zone** = central part of thick filament not overlapped by thin filaments at rest.
- **Z line** = anchors thin (actin) filaments.

**Thin (Actin) Filament Structure.**
- 2 helically wound **F-actin** strands (each = polymer of monomeric **G-actin**).
- 2 strands of **tropomyosin** running along.
- **Troponin** complex at regular intervals on tropomyosin.
- At rest: **a troponin subunit masks the myosin-binding active sites on actin**.

**Thick (Myosin) Filament Structure.**
- Polymer of **meromyosin** monomers.
- Each meromyosin = globular **head + short arm (HMM)** + **tail (LMM)**.
- HMM projects as **cross arm**; head = **ATPase**; head has ATP binding sites + actin binding sites.

**Contraction Cycle (NCERT verbatim sequence):**
1. **Neural signal** from CNS via motor neuron arrives at **neuromuscular junction** (motor-end plate).
2. Releases **Acetylcholine** → action potential in sarcolemma → spreads through fibre.
3. Action potential causes release of **Ca²⁺ into sarcoplasm**.
4. ↑ Ca²⁺ → binds troponin subunit → **unmasks** active sites on actin.
5. ATP hydrolysis powers **myosin head binding** to active sites → **cross-bridge** forms.
6. Cross-bridge **pulls actin towards A-band centre** → **Z lines drawn inwards** → sarcomere shortens.
7. **I band reduces; A band retains length.**
8. Myosin releases ADP + Pi → returns to relaxed conformation.
9. New ATP binds myosin head → cross-bridge **breaks**.
10. ATP hydrolysed again → cycle repeats → further sliding.
11. **Relaxation**: Ca²⁺ pumped back into **sarcoplasmic cisternae** → troponin re-masks → Z lines return to original position.

## 4. Real-World Analogy and Applications
- **Daily life:** rowing a boat — oars (myosin heads) reach forward, grip water (actin), pull, release, reach forward again. Filaments don't shorten; they slide.
- **Biological:** rigor mortis after death — no ATP to break the cross-bridges → muscles lock in contracted state.
- **Industry:** electrical stimulation therapy in physiotherapy triggers the same Ca²⁺ release pathway to make a muscle contract without voluntary neural input.

## 5. Simulation Design & UX

### Teaching Objective
Make students *see* that **the filaments themselves do not shorten** — they slide past each other. And tie the **Ca²⁺ release** + **ATP cycle** + **cross-bridge** events into one continuous mechanism instead of disconnected facts.

### Visual Environment & Aesthetic
Centre-canvas: a single **stylised sarcomere** spanning the canvas width, with Z lines at both ends, dark thick myosin filaments in the middle, golden thin actin filaments interdigitating from the Z lines. Each myosin filament has 6-8 visible **HMM heads** projecting on stalks. Tropomyosin runs as a thin pink strip on the actin; troponin complexes as small turquoise pearls at intervals.

Above the sarcomere: a stylised **motor neuron axon terminal** at the neuromuscular junction with **synaptic vesicles**.

Below: a labelled **sarcoplasmic cisternae** (calcium reservoir) with Ca²⁺ channels.

Soft white background, premium muscle-fibre tint.

### Smartboard Layout & Responsiveness
4-zone layout. Left aside = **Sarcomere Length Chart** card (live A-band/I-band/H-zone widths) + **Ca²⁺ concentration** meter. Right aside = NCERT cycle steps card + live readouts (cross-bridges active count, ATP/s consumed, contraction %, Ca²⁺ µM).

### Simulation Elements (Visual Metaphors — premium motion)
- **Neural signal**: golden pulse travels down axon → triggers **vesicle fusion** at terminal → ACh particles (tiny dots) cross the cleft → sarcolemma flashes blue (depolarisation).
- **Ca²⁺ release**: channels in sarcoplasmic cisternae open → **Ca²⁺ ions (yellow orbs)** stream out with a satisfying burst.
- **Troponin–Ca²⁺ binding**: pearls turn yellow as Ca²⁺ binds → tropomyosin **slides aside** → active sites on actin **glow red** (now exposed).
- **Cross-bridge cycle** for each myosin head, animated in 4 phases per beat:
  1. Head primed (ATP bound, vertical) → smooth tilt down to bind actin.
  2. Power stroke: head rotates 45° → drags attached actin segment toward centre.
  3. Head releases ADP+Pi (small particles ejected with a puff).
  4. New ATP binds → head detaches → re-cocks vertical.
- Heads cycle **asynchronously** for realism (the visual heartbeat of the sim).
- **Z lines visibly slide inward**; sarcomere shortens like a concertina. **I bands shrink** (highlighted); **A band stays the same width** (highlighted differently). The "filaments don't shorten" insight becomes self-evident.
- **Relaxation**: Ca²⁺ ions get **vacuumed back** into cisternae (reverse pump animation) → troponin pearls turn turquoise → tropomyosin re-covers → cross-bridges fall away → Z lines glide back outward.

### Teacher Demonstration Controls
- **Stimulation rate slider** (single twitch → fast tetanus). At very high rate → contraction sustains.
- **Ca²⁺ release amount** slider (manual override).
- **ATP supply** slider (normal → low → zero) — at zero, heads stay bound = **rigor mortis** demo.
- **Step-mode toggle**: advance the cycle one NCERT step at a time with labels.
- **Layer toggles**: show/hide tropomyosin · troponin · ATP icons · band measurements.
- Pause/Play/Reset top-right.

### What the Class Observes
- Single twitch: Ca²⁺ burst → cross-bridges fire → sarcomere shortens 20% → Ca²⁺ pumped back → relax. Cycle visible in ~2 seconds.
- Tetanus: continuous stimulation → Ca²⁺ stays high → constant contraction.
- Drop ATP to zero mid-contraction: heads freeze in attached state → Z lines locked in shortened position → **rigor mortis** label appears. Restore ATP → heads release.
- Step-mode: teacher pauses at each NCERT step, walking class through troponin masking/unmasking and the 4-phase cross-bridge cycle.
- The A-band-stays / I-band-shrinks measurement live on the left aside is the visual gold standard for sliding filament.

### Scientific Logic (NCERT Aligned)
Every step in the 11-step contraction cycle traced verbatim: ACh release, sarcolemma AP, Ca²⁺ release, troponin masking removed, ATP-powered cross-bridge, A-band retains / I-band shortens, ADP+Pi release, new ATP detaches, Ca²⁺ pumped back, relaxation. No mention of T-tubules, ryanodine receptors, troponin C/I/T subtypes (out of NCERT scope).

### Step-by-Step Teaching Sequence
1. Default single twitch in slow-mo. **Q:** "What was the trigger — and where did it come from?"
2. Step-mode through neural→ACh→AP→Ca²⁺ release. **Q:** "Why does Ca²⁺ matter for contraction?"
3. Highlight troponin unmasking. **Q:** "What was hiding from the myosin heads?"
4. Slow-mo a single cross-bridge cycle. **Q:** "Where does the energy come from for the pull, and where for the release?"
5. Show A-band vs I-band measurements. **Q:** "If the muscle is shorter, why isn't the dark band any narrower?"
6. Drop ATP to zero. Rigor mortis. **Q:** "Why do bodies stiffen after death?"

### Learning Outcome
Students lock in the **sliding (not shortening) of filaments**, the **cross-bridge cycle's dependence on Ca²⁺ AND ATP**, and the **A/I/H band behaviour** during contraction — answering NCERT exercises on sarcomere, sliding filament, and the role of ATP in muscle contraction.
