# Codex prompt — generate a topic infographic poster

Paste the block below into Codex. Fill the **INPUTS**; leave the **DESIGN SYSTEM**
and **RULES** unchanged so every topic comes out as one visual family.
The output is a single self-contained `.svg` you then export to PNG.

---

```
You are producing ONE educational infographic POSTER as a single self-contained SVG,
using the skeleton in docs/infographics/infographic-template.svg. Keep its layout,
palette, type classes, and card structure; only replace content and draw the hero diagram.

INPUTS
- Topic: {{TOPIC}}
- Grade / subject: {{GRADE}} {{SUBJECT}}  (NCERT {{CHAPTER}})
- Source of truth: verbatim NCERT facts I provide below (do not invent numbers/laws):
  {{PASTE NCERT EXCERPTS / KEY FACTS HERE}}

FILL THESE SLOTS (keep every line tight — this is a poster, not prose)
- TITLE (uppercase) + one-line subtitle that says what it does
- NCERT_REF chip, e.g. "NCERT XII · Ch 6"
- CENTRAL HERO DIAGRAM: the single labelled illustration that tells the whole story
  start-to-finish. Describe its parts, then draw them with semantic colours and add
  leader-line labels. (e.g. for EMI: bar magnet → coil → galvanometer, field lines,
  induced-current arrows.)
- Definition card: 3 bullets + one "so what"
- Core equation card: the main formula in the highlight box + 2 term meanings + 1 insight
- Key-quantity card: a secondary formula/quantity + 2 notes + its SI unit
- Law/mechanism card: 2 lines + a boxed key example
- How-it-works card: 3–4 numbered steps
- Common-misconceptions card: 3 "✗" bullets + 1 "✓" correction
- Real-world-uses card: 4 bullets
- Footer line

DESIGN SYSTEM (do not change)
- Canvas: SVG viewBox 0 0 1080 1350 (portrait 4:5). No external fonts/images/scripts.
- Palette: bg #F5F8FC · ink #1A2233 · muted #5B6675 · accent #B3202F · highlight #FFC748
  · card border #E3E8F0. Semantic diagram colours per topic (state them explicitly).
- Type scale: title 46/800 · card title 18/800 (accent) · body 15.5/400 · formula 26/800 serif.
- Cards: rx 16, white fill, 1.5px #E3E8F0 border, soft shadow, 6px coloured left rule.
- One hero diagram in the centre; cards annotate it. Generous spacing, legible at 2x.

RULES
- Content must match the NCERT excerpts exactly (formulas, terms, values). If a fact
  isn't in the source, omit it rather than guess.
- No text overflow: keep bullets to ~6 words, equations short. Wrap long lines by hand
  into multiple <text> lines.
- Everything vector; no raster, no <foreignObject>, no web fonts.

OUTPUT
1. The complete .svg file.
2. A one-line command to export it to PNG at 2x, e.g.
   `npx svgexport in.svg out.png 2x`  (or rsvg-convert / Inkscape).
```

---

## Worked reference
The Electromagnetic Induction poster (`public/infographics/emi-faraday.png`) is the
target look. Its central diagram is *magnet → coil → galvanometer*; its cards are
definition, Faraday's equation `ε = −N dΦ/dt`, flux `Φ = B·A·cosθ`, Lenz's law,
misconceptions, and applications.

## Tips
- **One idea per card.** If a card needs a paragraph, it's two cards.
- **The centre carries the concept**; if someone only looks at the middle diagram they
  should still get the gist. Labels do the teaching, cards do the depth.
- **Verify first, design second.** Pull NCERT facts (via the class+subject MCP) and paste
  them into the prompt so Codex can't drift.
- **Export at 2x** (2160×2700) for smartboard sharpness; the source images we've used
  (~400px wide) look soft when projected.
