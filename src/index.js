/**
 * Public API for the hysteresis-gate library.
 *
 * The whole library is a single class; we re-export it here so callers
 * can do `import { HysteresisGate } from 'hysteresis-gate'` without caring
 * about internal file layout.
 */
export { HysteresisGate } from './core.js';
export { HysteresisState } from './core.js';
