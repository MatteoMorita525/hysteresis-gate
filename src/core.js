/**
 * The two stable outputs of a hysteresis gate.
 *
 * Kept as a plain frozen object rather than an enum so the library stays
 * dependency-free and the values are safe to compare with === across realms.
 */
export const HysteresisState = Object.freeze({
  OFF: 'OFF',
  ON: 'ON',
});

/**
 * A hysteresis gate with distinct on/off thresholds.
 *
 * Why hysteresis: a plain threshold (value > X) chatters when the input
 * jitters around X. By using a higher limit to switch ON and a lower limit
 * to switch OFF, the output only changes when the input has moved
 * decisively past the previous decision.
 *
 * Decision rule (state is OFF and input >= onLimit  => ON;
 *               state is ON  and input <= offLimit  => OFF):
 *
 *   offLimit < onLimit  -> the classic band. Values inside the band are
 *                          "sticky": they keep whatever state the gate is
 *                          already in. This is the intended, useful case.
 *   offLimit == onLimit -> the band collapses to zero. The gate degenerates
 *                          into a plain threshold, but is still well defined:
 *                          equality triggers a change in both directions,
 *                          so the band is never truly empty for ties.
 *   offLimit >  onLimit  -> the band is "inverted". Every input lies strictly
 *                          outside one of the limits, so every sample forces
 *                          a decision. This is a misconfiguration but we
 *                          handle it deterministically rather than throwing,
 *                          because throwing on bad numeric config is a
 *                          surprise for callers who construct limits from
 *                          noisy data.
 *
 * The initial state is OFF. If your sensor powers up reading high, the first
 * call to update() will fire the ON transition immediately; there is no
 * "boot debounce". This keeps the gate stateless across restarts, which is
 * the least surprising default for a small utility library.
 */
export class HysteresisGate {
  #onLimit;
  #offLimit;
  #state;

  /**
   * @param {number} onLimit  Value at or above which the gate switches ON.
   * @param {number} offLimit Value at or below which the gate switches OFF.
   */
  constructor(onLimit, offLimit) {
    if (typeof onLimit !== 'number' || !Number.isFinite(onLimit)) {
      throw new TypeError('onLimit must be a finite number');
    }
    if (typeof offLimit !== 'number' || !Number.isFinite(offLimit)) {
      throw new TypeError('offLimit must be a finite number');
    }
    this.#onLimit = onLimit;
    this.#offLimit = offLimit;
    this.#state = HysteresisState.OFF;
  }

  /**
   * Apply a new sample. Returns the gate's output AFTER applying the sample.
   *
   * @param {number} value
   * @returns {string} HysteresisState.ON or HysteresisState.OFF
   */
  update(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError('value must be a finite number');
    }

    if (this.#state === HysteresisState.OFF) {
      if (value >= this.#onLimit) {
        this.#state = HysteresisState.ON;
      }
    } else {
      if (value <= this.#offLimit) {
        this.#state = HysteresisState.OFF;
      }
    }
    return this.#state;
  }

  /** Current output without applying a sample. */
  get state() {
    return this.#state;
  }

  /** The ON threshold, as supplied to the constructor. */
  get onLimit() {
    return this.#onLimit;
  }

  /** The OFF threshold, as supplied to the constructor. */
  get offLimit() {
    return this.#offLimit;
  }
}
