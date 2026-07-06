import React from 'react';
import { InfographicSpec } from './types';
import InfographicRenderer from './InfographicRenderer';
import { grade12Physics } from './specs/grade12-physics';

/**
 * Central id-keyed registry of NCERT-verified infographic specs.
 * `TopicLayoutContainer` calls `getInfographic(topic.id)` to auto-wire the
 * correct panel — so adding a new topic's infographic is just a spec entry here.
 */
const SPECS: Record<string, InfographicSpec> = {
  ...grade12Physics,
};

export const hasInfographic = (topicId: string): boolean => topicId in SPECS;

export const getInfographic = (topicId: string): React.ReactNode | null => {
  const spec = SPECS[topicId];
  return spec ? <InfographicRenderer spec={spec} /> : null;
};
