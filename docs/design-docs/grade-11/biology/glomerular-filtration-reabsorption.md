# T26 · Glomerular Filtration & Reabsorption

## 1. Topic Name
**Urine Formation — Glomerular Filtration, Reabsorption and Tubular Secretion** — NCERT Class 11 Biology, *Excretory Products and their Elimination*, §16.2 and §16.3.

## 2. Subject Type & Hierarchy
Biology → Human Physiology → Excretory System

## 3. Comprehensive Explanation (Strict NCERT Teacher's Guide)

**Definition & Foundation.** "Urine formation involves three main processes: **glomerular filtration, reabsorption, and secretion**." All three happen in the **nephron** — the structural and functional unit of the kidney.

**Nephron Anatomy.**
- **Glomerulus** = tuft of capillaries (from afferent arteriole).
- **Renal tubule** = Bowman's capsule → PCT → loop of Henle → DCT → collecting duct.
- Bowman's capsule + glomerulus = **Malpighian corpuscle**.

**1. Glomerular Filtration (ultrafiltration).**
- Driven by **glomerular capillary blood pressure** (non-selective).
- Three layers: endothelium of glomerular vessels → basement membrane → epithelium (**podocytes**) of Bowman's capsule with **filtration slits**.
- All plasma constituents pass except **proteins** → hence "ultrafiltration".
- **GFR ≈ 125 mL/min ≈ 180 L/day** in healthy adult.
- ~1100–1200 mL blood filtered per minute (≈ 1/5 of CO).
- Regulated by **Juxta Glomerular Apparatus (JGA)** — JG cells release **renin** when GFR drops.

**2. Reabsorption.**
- Daily filtrate 180 L vs daily urine 1.5 L → **~99% reabsorbed**.
- **PCT** = major reabsorption site, lined by **simple cuboidal brush-border epithelium** (huge surface area).
- ~70–80% of electrolytes + water + nearly all essential nutrients (glucose, amino acids, Na⁺) reabsorbed in PCT.
- Mechanisms: **active** (glucose, amino acids, Na⁺) vs **passive** (urea, water in early segments).

**3. Tubular Secretion.**
- Active secretion of **H⁺, K⁺, ammonia (NH₃)** into the filtrate.
- Maintains ionic and acid-base balance of body fluids.

## 4. Real-World Analogy and Applications
- **Daily life:** an industrial sieve + recycling line — sieve first, then return 99% of valuables, send 1% to waste.
- **Biological:** diabetics overflow tubular reabsorption capacity for glucose → glucose in urine (NCERT-implied).
- **Industry:** dialysis machines artificially recreate glomerular filtration when kidneys fail.

## 5. Simulation Design & UX

### Teaching Objective
Make visceral the **brutal asymmetry** of the nephron: 180 L filtered every day, only 1.5 L excreted — and reveal that "selective" reabsorption is what makes survival possible.

### Visual Environment & Aesthetic
Central canvas: a single nephron drawn elegantly — afferent arteriole feeding the glomerular tuft (visibly pulsing with pressure), Bowman's capsule cradling it, PCT looping outward as a coiled tube, then continuing into the rest of the nephron (greyed out for this sim's focus) and a peritubular capillary running alongside. Soft white background with subtle teal kidney-cortex tint.

### Smartboard Layout & Responsiveness
4-zone layout. Left aside = **GFR / Reabsorption ratio** bar chart card + **Filtration Membrane Cross-Section** zoom card (3 layers + slit pores). Right aside = NCERT process card + live readouts (GFR mL/min, daily filtrate L/day, urine output L/day, glucose %, Na⁺ %).

### Simulation Elements (Visual Metaphors — premium motion)
- **Blood particles** (red discs, plasma proteins as larger gold ovals, glucose/amino acids/Na⁺ as coloured small dots) enter the glomerulus from afferent arteriole.
- **Filtration:** small particles **squeeze through** the membrane's slit pores into Bowman's capsule with a **press-and-pop** animation. Plasma proteins **bounce off** and continue out the efferent arteriole.
- **Filtrate stream** travels down the PCT as a current. Along the way:
  - Glucose dots, amino-acid dots, Na⁺ dots get **actively grabbed** by brush-border pumps (small ATP-spending icons flash) and **shuttled across to the peritubular capillary** — clean directional animation.
  - Water molecules flow **passively** with a softer drift.
  - Urea (small grey dots) drift across passively too.
- **Tubular secretion:** H⁺ / K⁺ / NH₃ pulse from the peritubular capillary INTO the filtrate (opposite direction, with a "pump in" animation).
- **Live volume gauges**: filtrate left in lumen visibly shrinks as it travels through PCT.

### Teacher Demonstration Controls
- **Blood pressure slider** (low → normal 80 mmHg → high) — directly affects GFR.
- **JGA toggle**: enable/disable JG-cell renin response.
- **Plasma glucose slider** (normal → hyperglycaemic diabetic level) — show "tubular max" overflow.
- **Filtration view**: Normal speed · Slow-mo · Step-by-particle.
- **Toggle**: highlight active transport vs passive transport with colour coding.
- Pause/Play/Reset top-right.

### What the Class Observes
- Default → GFR holds at ~125 mL/min, urine output ~1.5 L/day, glucose 0% in urine.
- Drop blood pressure → GFR plummets. Enable JGA → renin fires, blood pressure restored, GFR climbs back. Teacher can show "autoregulation" live.
- Crank plasma glucose to diabetic levels → PCT pumps saturate, glucose particles **spill past** into the continuing tubule, appear in urine. NCERT-aligned, even though "diabetes glucosuria" isn't named.
- Slow-mo + size labels make the "1.5 vs 180" ratio undeniable when teacher pauses at the end of PCT.

### Scientific Logic (NCERT Aligned)
GFR = 125 mL/min, 180 L/day, 99% reabsorption, 70-80% in PCT, glucose/aa/Na⁺ active, urea/water passive, H⁺/K⁺/NH₃ secreted — every number/mechanism is NCERT verbatim. Loop of Henle and DCT/collecting duct are visible but greyed (focus stays on filtration + PCT reabsorption + secretion; loop+concentration covered in sibling sim T27).

### Step-by-Step Teaching Sequence
1. Start at normal BP. Observe one batch of plasma being filtered. **Q:** "Why don't the proteins make it across?"
2. Zoom into the filtration membrane (left aside) and identify the 3 NCERT layers + podocytes + slit pores.
3. Drop BP. Watch GFR die. **Q:** "What does the kidney do about it?" Enable JGA → renin fires.
4. Switch to slow-mo. Watch glucose / amino acid / Na⁺ getting pumped out at PCT. **Q:** "Why is the PCT so good at this — what does its lining look like?" (Reveal brush border.)
5. Crank plasma glucose. **Q:** "Why does sugar appear in a diabetic's urine?" Show transport-pump saturation.
6. Enable tubular secretion view. **Q:** "What do H⁺ and K⁺ pumps do for the body's pH?"

### Learning Outcome
Students intuit the **filtration → reabsorption → secretion** triad in the correct location order (glomerulus → PCT → throughout), nail the 125 mL/min and 99% numbers, and explain autoregulation via JGA — directly answering NCERT exercises 1, 2, 3.
