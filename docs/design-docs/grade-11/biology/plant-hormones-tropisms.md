# T21 · Plant Hormones & Tropisms

## 1. Topic Name
**Plant Growth Regulators (PGRs) — Discovery, Physiological Effects, Phototropism** — NCERT Class 11 Biology, Ch 13 *Plant Growth and Development*, §13.4. **(Seed dormancy, vernalisation, photoperiodism are NCERT-rationalised-out — excluded from this sim.)**

## 2. Subject Type & Hierarchy
Biology → Plant Physiology → Growth Regulators

## 3. Comprehensive Explanation (Strict NCERT Teacher's Guide)

**Definition & Foundation.** PGRs are "small, simple molecules of diverse chemical composition" also called plant hormones / phytohormones. Two functional groups:
- **Promoters:** auxins, gibberellins, cytokinins (cell division, enlargement, tropic growth, flowering, fruiting).
- **Inhibitors:** abscisic acid (ABA); ethylene fits either group but is "largely an inhibitor".

**The Five PGRs — NCERT essentials only.**

1. **Auxins.** Term from Greek *auxein* "to grow"; first isolated from human urine. **IAA** (indole-3-acetic acid) is the natural one; **IBA** also natural; **NAA, 2,4-D** synthetic. Produced at growing apices of stems/roots. Effects:
   - Initiate rooting in stem cuttings (plant propagation).
   - Promote flowering in pineapples; prevent fruit/leaf drop early; promote abscission of older mature leaves/fruits.
   - **Apical dominance** — apical bud inhibits lateral buds; decapitation triggers lateral growth (basis of tea plantations and hedge-making).
   - Induce **parthenocarpy** (e.g. tomatoes).
   - **2,4-D** as herbicide for dicot weeds.

2. **Gibberellins (GA₃).** Discovered via *Gibberella fujikuroi* "bakanae" disease (Kurosawa 1926). Effects: increase length of grape stalks; hasten maturity in juvenile conifers (early seed); promote **bolting** (internode elongation before flowering) in beet, cabbage and rosette plants.

3. **Cytokinins.** Kinetin (modified adenine) discovered by Miller et al. 1955 from autoclaved herring sperm DNA. **Zeatin** is the natural form (from corn-kernels, coconut milk). Synthesised in regions of rapid cell division — root apices, developing shoot buds, young fruits. Effects: new leaves, chloroplasts, lateral shoot growth, adventitious shoot formation; **overcome apical dominance**; delay leaf senescence via nutrient mobilisation.

4. **Ethylene (C₂H₄).** Gaseous PGR. Discovered by Cousins (1910) — ripe oranges hasten banana ripening. Synthesised by senescing tissues and ripening fruits. Effects: horizontal growth + apical hook in dicot seedlings; senescence and abscission of leaves/flowers; **fruit ripening** (respiratory climacteric); breaks seed/bud dormancy (peanut germination, potato sprouting); deep-water rice internode elongation; root + root-hair growth; flowering in pineapple and mango. **Ethephon** widely used commercially.

5. **Abscisic Acid (ABA).** Convergence of three names: inhibitor-B, abscission II, dormin. Roles: regulating abscission and dormancy; "stress hormone"; growth-inhibiting.

**Phototropism (NCERT).** Charles Darwin + Francis Darwin: canary grass coleoptiles bend toward unilateral light. The **tip of the coleoptile** is the "site of transmittable influence". F.W. Went later isolated **auxin** from oat coleoptile tips. This is the Darwin experiment (NCERT Fig 13.10).

## 4. Real-World Analogy and Applications
- **Daily life:** pruning hedges = exploiting apical dominance with auxin redistribution.
- **Biological:** sunflowers tracking the sun = phototropism in action.
- **Industry:** ethephon spray on tomato/apple/cherry orchards for synchronised ripening and thinning.

## 5. Simulation Design & UX

### Teaching Objective
Show that **hormones aren't switches — they're sliders, and the same hormone produces opposite effects at different doses/locations.** Reveal *why* the Darwin coleoptile bends, *why* an apical bud silences its laterals, and *why* one ripe banana spoils the bunch.

### Visual Environment & Aesthetic
Soft white canvas. **Three demonstration stages** the teacher can swap between, each lush and botanically illustrated in flat-vector style:
- **Stage A — Coleoptile + Light** (Darwin experiment). A young grass coleoptile centre-canvas; a movable sun icon casts a soft amber light cone from any angle.
- **Stage B — Branching Tree.** A schematic young plant with one apical bud + lateral buds. Sliders for auxin/cytokinin/decapitation.
- **Stage C — Fruit Bowl.** Apples + bananas in a glass bowl, with an ethylene cloud sim.

### Smartboard Layout & Responsiveness
4-zone layout. Left aside = "Discoveries timeline" card (Darwin → Kurosawa → Skoog → Cousins → ABA convergence) + "Hormone Cheat Sheet". Right aside = NCERT effects panel + live state (current dose, observed effect).

### Simulation Elements (Visual Metaphors — premium motion)
- **Stage A:** auxin shown as **glowing cyan molecules** that *redistribute* away from the lit side; cells on the shaded side **smoothly elongate** (scale-Y interpolation), causing the coleoptile to bend in a buttery arc. A faint **dashed trajectory** traces the bending tip live.
- **Stage B:** auxin level visualised as cyan saturation in the apical bud; lateral buds shown as **dim dormant pods**. Crank up auxin → laterals fade further. "Decapitate" scissors-icon → top vanishes with a snip animation → laterals **bloom outward** with spring-eased growth.
- **Stage C:** an apple gets the "ripe" toggle → emits a slow **expanding ring of green ethylene molecules**; nearby bananas **transition colour** (green→yellow→brown via interpolated fill) on a smooth gradient. Faint **respiratory-climacteric heart-beat pulse** appears beside ripening fruits.
- Coloured **hormone droplets** dragged from a "PGR palette" onto any stage trigger the canonical NCERT effect with a labelled callout.

### Teacher Demonstration Controls
Chunky bottom controls (contextual to active stage):
- **Stage selector** (A/B/C segmented).
- **Hormone palette**: Auxin · GA · Cytokinin · Ethylene · ABA (chunky chips, draggable).
- **Stage-specific sliders**: light direction (A), hormone dose 0-100 (all), decapitate button (B), ethylene level (C).
- Pause/Play/Reset top-right of canvas.

### What the Class Observes
- Stage A: rotate sun → coleoptile bends *toward* the new light direction within seconds, with cells on the dark side visibly elongated.
- Stage B: increase auxin → lateral buds *fade*; click decapitate → they *bloom*. Add cytokinin to a hedged plant → laterals bloom even without decapitation. This makes "antagonism between auxin and cytokinin" obvious.
- Stage C: place one ethylene-emitting apple in the bowl → all nearby fruits ripen in sequence, far ones lag. Sealed lid (toggle) accelerates everything.

### Scientific Logic (NCERT Aligned)
Every effect annotated with the exact NCERT line (apical dominance, parthenocarpy, climacteric, etc.). No mention of seed dormancy / vernalisation / photoperiodism (rationalised out for NEET 2025-26). No molecular-receptor depth.

### Step-by-Step Teaching Sequence
1. **Stage A — Darwin's experiment.** Place sun on left; watch bend. **Q:** "Why does the *tip* matter — what would happen if we covered the tip with foil?" (NCERT Fig 13.10 reproduction.)
2. **Stage B — apical dominance.** Show silent laterals; **Q:** "Why don't side branches grow?" Decapitate; laterals bloom. Add auxin paste to cut surface → laterals re-silence. Real-world tie-in: tea plantations.
3. **Stage B — cytokinin antagonism.** Add cytokinin; laterals bloom without decapitation.
4. **Stage C — fruit ripening.** Start with one bagged ripe apple → no spread. Open the bag → ethylene cloud spreads → fruits ripen. **Q:** "Why do greengrocers keep bananas separate?"
5. **Wrap.** Toggle through the five PGRs with the palette on a blank plant. Each shows its NCERT effect in 4 seconds.

### Learning Outcome
Students intuitively recall **which hormone does what**, **where it's made**, **who discovered it**, and **how phototropism actually works** — covering every NCERT 13.4 exercise question and the standard NEET PGR-effect MCQs.
