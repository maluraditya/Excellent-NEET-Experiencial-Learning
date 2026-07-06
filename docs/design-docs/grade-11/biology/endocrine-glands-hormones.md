# T31 · Endocrine Glands & Hormone Actions

## 1. Topic Name
**Human Endocrine System — Glands, Hormones, and Their Functions** — NCERT Class 11 Biology, *Chemical Coordination and Integration*, §19.1, §19.2 and §19.3.

## 2. Subject Type & Hierarchy
Biology → Human Physiology → Endocrine System → Hormonal Coordination

## 3. Comprehensive Explanation (Strict NCERT Teacher's Guide)

**Definition & Foundation.** "Endocrine glands lack ducts and are hence called **ductless glands**. Their secretions are called **hormones**." NCERT modern definition: "Hormones are **non-nutrient chemicals which act as intercellular messengers** and are produced in trace amounts."

**Organised Endocrine Glands (NCERT Fig 19.1).** Hypothalamus, Pituitary, Pineal, Thyroid, Parathyroid, Thymus, Adrenal, Pancreas, Gonads (Testis/Ovary). Other hormone-producing organs: heart, kidney, GI tract, liver.

**Major Glands and Their Hormones — NCERT summary level.**

- **Hypothalamus.** Basal diencephalon. Releases:
  - **Releasing hormones** (e.g. GnRH → stimulates pituitary release of gonadotrophins).
  - **Inhibiting hormones** (e.g. somatostatin → inhibits GH release).

- **Pituitary.** "Master gland." Three parts:
  - **Pars distalis (anterior):** 6 trophic hormones — GH, prolactin, TSH, ACTH, LH, FSH.
  - **Pars intermedia:** MSH (acts on melanocytes).
  - **Pars nervosa (neurohypophysis):** Oxytocin, Vasopressin (ADH).

- **Pineal.** Melatonin → diurnal rhythms (sleep/wake, body temperature).

- **Thyroid.** Thyroid hormones (T3, T4) → BMR, CNS development/maturation, erythropoiesis, carbohydrate/protein/fat metabolism, menstrual cycle. **Thyrocalcitonin** → decreases blood Ca²⁺.

- **Parathyroid.** **PTH** → increases blood Ca²⁺ (calcium homeostasis).

- **Thymus.** Thymosins → T-lymphocyte differentiation (cell-mediated immunity); also boost humoral immunity.

- **Adrenal Gland.**
  - **Medulla (centre):** Epinephrine (adrenaline) + Norepinephrine (noradrenaline) → alertness, pupillary dilation, piloerection, sweating, ↑ heart rate, ↑ contraction strength, ↑ respiration, glycogenolysis, lipolysis, proteolysis. The "fight-or-flight" hormones.
  - **Cortex (outer):**
    - **Glucocorticoids** → gluconeogenesis, lipolysis, proteolysis, erythropoiesis, cardiovascular support, blood pressure, GFR, anti-inflammatory.
    - **Mineralocorticoids** → water + electrolyte balance.

- **Pancreas (endocrine portion).**
  - **Glucagon** → glycogenolysis + gluconeogenesis → **hyperglycaemia**.
  - **Insulin** → cellular glucose uptake + glycogenesis → **hypoglycaemia**. Insulin deficiency/resistance → **diabetes mellitus**.

- **Testis (males).** **Androgens** → male accessory organs, 2° sex characters, spermatogenesis, male sexual behaviour, anabolic, erythropoiesis.

- **Ovary (females).** **Estrogen** → female accessory organs, 2° sex characters. **Progesterone** → maintains pregnancy, mammary gland development, lactation.

- **Other organs.** Heart → ANF (↓ BP). Kidney → erythropoietin. GI tract → gastrin, secretin, CCK, GIP (regulate digestive secretions).

## 4. Real-World Analogy and Applications
- **Daily life:** the "morning rush" — you wake up with cortisol-driven alertness and a glucagon-driven blood-sugar bump.
- **Biological:** fight-or-flight response when a car horn surprises you on the road — adrenaline spikes within seconds.
- **Industry:** insulin therapy for Type 1 diabetics; thyroxine tablets for hypothyroidism; growth-hormone therapy for paediatric dwarfism.

## 5. Simulation Design & UX

### Teaching Objective
Replace the rote list-memorisation of "which gland does what" with a **navigable human body map** where the teacher can light up any gland, see its hormones flow out, watch their target organs respond, and trigger common scenarios (stress, fed state, fasting, exercise) to see multiple glands cooperate.

### Visual Environment & Aesthetic
Centre-canvas: a stylised **front-view human silhouette** (genderless toggle available) with all endocrine glands shown as glowing labelled icons at their anatomical positions — hypothalamus + pituitary at the head, thyroid + parathyroid at the neck, thymus at the chest, adrenals + pancreas in the abdomen, gonads at the pelvis. Plus heart, kidney, GI for the secondary-source organs.

Soft white background, premium anatomical illustration in flat-vector style.

### Smartboard Layout & Responsiveness
4-zone layout. Left aside = **Gland Library** card (clickable list — tap to focus the body view) + **Hormone Lookup** card. Right aside = NCERT info card for selected gland (auto-updates) + live readouts (active hormone, target organ, current scenario state).

### Simulation Elements (Visual Metaphors — premium motion)
- **Click any gland** → it pulses with a gentle glow → emits **animated hormone molecules** (colour-coded by gland) that travel through stylised bloodstream paths to their target organs.
- **Target organs** **respond visibly** — e.g. pancreas releases insulin → liver icon "absorbs glucose" with a colour shift; adrenal medulla releases epinephrine → heart icon pulses faster, pupils dilate (eye icon), small skin patches show piloerection.
- **Scenario mode** triggers cascades:
  - **Stress (fight-or-flight)**: hypothalamus → pituitary (ACTH) → adrenal cortex (cortisol) + direct adrenal medulla (epi/norepi). Multiple animated paths fire in sequence.
  - **Fed state**: blood glucose rises → pancreas → insulin → muscles/liver absorb glucose.
  - **Fasting**: blood glucose drops → pancreas → glucagon → liver releases glucose.
  - **Cold exposure**: hypothalamus → pituitary (TSH) → thyroid → T3/T4 → body heat ↑.
  - **Puberty**: hypothalamus → pituitary (LH/FSH) → gonads → testosterone/estrogen → secondary sex characters appear on silhouette.
- **Hormone chemistry mode**: toggle to show chemical category (peptide / steroid / iodothyronine / amine) — molecules render in their actual rough structure (no detail).

### Teacher Demonstration Controls
- **Scenario selector**: Resting · Stress · Fed · Fasting · Cold · Exercise · Puberty.
- **Gland focus**: click any gland icon to zoom info-card.
- **Sex toggle**: M/F (changes gonadal icons).
- **Hormone visibility filters**: show/hide selected gland types.
- **Replay** button to re-play the last hormone-cascade animation.
- **Chemistry mode toggle**.
- Pause/Play/Reset top-right.

### What the Class Observes
- Click pancreas → insulin and glucagon visible as two distinct streams to liver. Toggle blood glucose high → only insulin fires; toggle low → only glucagon. Hyperglycaemia/hypoglycaemia labels appear.
- Run Stress scenario → 3-channel cascade: HPA axis (hypothalamus → pituitary ACTH → adrenal cortex cortisol) + direct adrenal medulla → heart pulses, eyes dilate, breathing icon speeds up, blood vessels constrict. Teacher pauses anywhere to discuss.
- Run Puberty scenario → sex-specific hormones light up the gonads, secondary sex characters appear visually on the silhouette in sequence.
- Click hypothalamus → see releasing/inhibiting hormones going DOWN to pituitary, NOT to the body directly. NCERT distinction made visual.

### Scientific Logic (NCERT Aligned)
Every gland's hormone list matches NCERT §19.2 summary. Every action description traceable to NCERT verbatim (alertness/pupillary dilation/piloerection from medulla, gluconeogenesis from cortex, glucose uptake from insulin, etc.). No mention of receptor signal-transduction details (covered in sibling sim T32). No deep endocrinology terms (HPA axis named in scenario but not as a NCERT term; described in plain English).

### Step-by-Step Teaching Sequence
1. Open with full silhouette. Identify every gland's location. **Q:** "Which gland is called the 'master gland' and why?"
2. Click pituitary → enumerate 6+1+2 hormones (anterior/intermediate/posterior).
3. Click hypothalamus → show releasing hormones going to pituitary (NOT body). **Q:** "If pituitary is the master, then who's its boss?"
4. Run **Fed → Fasting** in succession. **Q:** "How does the pancreas know when to release insulin vs glucagon?"
5. Run **Stress** scenario in slow-mo. **Q:** "Two adrenal layers fire — what's the difference between their hormones?"
6. Run **Puberty** scenario. **Q:** "Which hormones from the pituitary unlock the gonads, and what do the gonads then send out?"
7. End: quiz with random gland clicks → student names the hormones live.

### Learning Outcome
Students replace flat memorisation with a **spatial + functional map** of the endocrine system. They can identify glands, list their hormones, describe each hormone's action, and trace the hypothalamus-pituitary-target-gland axis — answering every NCERT §19.2 exercise question.
