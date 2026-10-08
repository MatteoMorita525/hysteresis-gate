# Hysteresis Gate

A small, dependency-free TypeScript/JavaScript utility that reports ON or OFF based on an input value, using separate thresholds to switch on and off. This eliminates output chatter when the input jitters near a single threshold.

## Usage

```js
import { HysteresisGate, HysteresisState } from 'hysteresis-gate';

const gate = new HysteresisGate(10, 5); // onLimit=10, offLimit=5

gate.update(7);  // 'OFF' — below the on limit, no change
gate.update(12); // 'ON'  — crossed the on limit
gate.update(7);  // 'ON'  — inside the band, state holds
gate.update(4);  // 'OFF' — crossed the off limit

gate.state      // current output: 'OFF'
gate.onLimit    // 10
gate.offLimit   // 5
```

`HysteresisState` is a frozen object: `HysteresisState.ON === 'ON'` and `HysteresisState.OFF === 'OFF'`.

## Why this exists

Sensor data and noisy signals oscillate around a decision boundary. A plain `value > threshold` check flips on every tiny crossing. By requiring the input to rise to `onLimit` before switching ON and fall to `offLimit` before switching OFF, the gate only changes output when the signal has moved decisively. The trade-off: the output is now path-dependent — the same input value can yield ON or OFF depending on history, which is the entire point but means you cannot reason about the output from the latest sample alone.

## Awkward edges

- **Initial state is OFF.** If your input boots already high, the first `update()` call that reaches `onLimit` fires immediately. There is no startup grace period.
- **Collapsed band (`onLimit === offLimit`)** degenerates into a plain threshold where equality triggers transitions in both directions.
- **Inverted band (`offLimit > onLimit`)** is a misconfiguration; the gate remains deterministic (every sample forces a decision toward whichever limit applies) but is not useful. No error is thrown, because limits are often derived from noisy data and a throwing utility is harder to compose.
- Only finite numbers are accepted as limits and inputs; `NaN`, `Infinity`, and non-numbers throw `TypeError`.
