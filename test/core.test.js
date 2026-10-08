import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HysteresisGate, HysteresisState } from '../src/index.js';

describe('HysteresisGate', () => {
  it('starts in the OFF state', () => {
    const g = new HysteresisGate(10, 5);
    assert.equal(g.state, HysteresisState.OFF);
  });

  it('exposes the configured limits', () => {
    const g = new HysteresisGate(10, 5);
    assert.equal(g.onLimit, 10);
    assert.equal(g.offLimit, 5);
  });

  it('switches ON when the input reaches the on limit', () => {
    const g = new HysteresisGate(10, 5);
    assert.equal(g.update(10), HysteresisState.ON);
    assert.equal(g.state, HysteresisState.ON);
  });

  it('switches OFF when the input falls to the off limit', () => {
    const g = new HysteresisGate(10, 5);
    g.update(20); // ON
    assert.equal(g.update(5), HysteresisState.OFF);
  });

  it('holds ON for values inside the band', () => {
    const g = new HysteresisGate(10, 5);
    g.update(20); // ON
    assert.equal(g.update(7), HysteresisState.ON);
    assert.equal(g.update(6), HysteresisState.ON);
  });

  it('holds OFF for values inside the band', () => {
    const g = new HysteresisGate(10, 5);
    assert.equal(g.update(7), HysteresisState.OFF);
    assert.equal(g.update(9), HysteresisState.OFF);
  });

  it('does not re-trigger ON once already ON', () => {
    const g = new HysteresisGate(10, 5);
    g.update(20); // ON
    assert.equal(g.update(1000), HysteresisState.ON);
    assert.equal(g.update(20), HysteresisState.ON);
  });

  it('does not re-trigger OFF once already OFF', () => {
    const g = new HysteresisGate(10, 5);
    assert.equal(g.update(0), HysteresisState.OFF);
    assert.equal(g.update(-1000), HysteresisState.OFF);
  });

  it('handles a collapsed band (onLimit === offLimit)', () => {
    // The band is a single point. Equality drives both transitions, so a
    // value exactly at the limit flips whichever way is new.
    const g = new HysteresisGate(7, 7);
    assert.equal(g.update(7), HysteresisState.ON);    // OFF -> ON at the limit
    assert.equal(g.update(7), HysteresisState.OFF);   // ON -> OFF at the limit
  });

  it('handles an inverted band (offLimit > onLimit)', () => {
    // Every value forces a decision. We just confirm it is deterministic,
    // not that it is useful.
    const g = new HysteresisGate(5, 10);
    assert.equal(g.update(3), HysteresisState.OFF); // below onLimit, stays OFF
    assert.equal(g.update(6), HysteresisState.ON);  // >= onLimit, flips ON
    assert.equal(g.update(11), HysteresisState.ON); // above offLimit, stays ON
  });

  it('supports negative limits', () => {
    const g = new HysteresisGate(-5, -10);
    assert.equal(g.update(-7), HysteresisState.OFF);
    assert.equal(g.update(-5), HysteresisState.ON);
    assert.equal(g.update(-7), HysteresisState.ON);
    assert.equal(g.update(-10), HysteresisState.OFF);
  });

  it('rejects non-finite input values', () => {
    const g = new HysteresisGate(10, 5);
    assert.throws(() => g.update(NaN), { name: 'TypeError' });
    assert.throws(() => g.update(Infinity), { name: 'TypeError' });
    assert.throws(() => g.update(-Infinity), { name: 'TypeError' });
    assert.throws(() => g.update('10'), { name: 'TypeError' });
  });

  it('rejects non-finite limits at construction', () => {
    assert.throws(() => new HysteresisGate(NaN, 5), { name: 'TypeError' });
    assert.throws(() => new HysteresisGate(10, Infinity), { name: 'TypeError' });
    assert.throws(() => new HysteresisGate('10', 5), { name: 'TypeError' });
  });

  it('preserves state across a chattering input inside the band', () => {
    const g = new HysteresisGate(10, 5);
    g.update(20); // ON
    for (const v of [8, 6, 9, 7, 6.5, 9.9]) {
      assert.equal(g.update(v), HysteresisState.ON);
    }
    assert.equal(g.update(5), HysteresisState.OFF);
    for (const v of [6, 8, 9.9, 7]) {
      assert.equal(g.update(v), HysteresisState.OFF);
    }
  });
});
