import React from 'react';

/**
 * Data-driven infographic system.
 * Each topic contributes an `InfographicSpec` (NCERT-verified) that the
 * shared `InfographicRenderer` turns into a clean, consistent visual panel.
 * This keeps every topic on-brand and avoids bespoke layout code per topic.
 */

export type Tone = 'red' | 'amber' | 'slate';

/** A short visual step tile (icon-free, number-badged flow). */
export interface StepItem {
  label: string;
  sub?: string;
}

/** A column in a comparison block. */
export interface CompareColumn {
  title: string;
  tag?: string;
  tone?: Tone;
  points: string[];
}

/** A single formula / relationship card. */
export interface FormulaItem {
  expr: string;
  note?: string;
}

/** A big-number callout. */
export interface StatItem {
  value: string;
  label: string;
}

export type InfographicBlock =
  | { kind: 'diagram'; heading?: string; svg: React.ReactNode; caption?: string }
  | { kind: 'steps'; heading: string; ordered?: boolean; items: StepItem[] }
  | { kind: 'compare'; heading: string; columns: CompareColumn[] }
  | { kind: 'formula'; heading: string; items: FormulaItem[] }
  | { kind: 'stats'; heading: string; items: StatItem[] }
  | { kind: 'points'; heading: string; tone?: Tone; items: StepItem[] }
  | { kind: 'facts'; heading: string; items: string[] };

export interface InfographicSpec {
  /** Small eyebrow label, e.g. the NCERT unit/branch. */
  eyebrow: string;
  title: string;
  /** NCERT chapter/section citation, e.g. "NCERT XI Physics · Ch 9". */
  ncertRef?: string;
  /** One-line hook shown in the hero (optional, keep very short). */
  tagline?: string;
  blocks: InfographicBlock[];
}
