// /js/stateMachine.js

export const StateTypes = {
  AUTO: "auto",
  MANUAL_REST: "manual_rest",
  MANUAL_HUT: "manual_hut",
  MANUAL_OFFLINE: "manual_offline"
};

const REST_TIMEOUT_MS = 15 * 60 * 1000; // 15 perc

export class ActivityStateMachine {
  constructor(onStateChange) {
    this.state = StateTypes.AUTO;
    this.manualUntil = null;
    this.onStateChange = onStateChange;
    this._timer = null;
  }

  // --- PUBLIC API ---

  getState() {
    return this.state;
  }

  isAutomatic() {
    return this.state === StateTypes.AUTO;
  }

  setManualRest() {
    this._setManual(StateTypes.MANUAL_REST);
  }

  setManualHut() {
    this._setManual(StateTypes.MANUAL_HUT);
  }

  setManualOffline() {
    this._clearTimer();
    this.state = StateTypes.MANUAL_OFFLINE;
    this.manualUntil = null;
    this._emit();
  }

  startAutomatic() {
    this._clearTimer();
    this.state = StateTypes.AUTO;
    this.manualUntil = null;
    this._emit();
  }

  /**
   * Mozgás esemény (pl. GPS update után)
   * Ha manuális pihenés/hütte alatt elindul a user,
   * azonnal visszaváltunk AUTO-ra.
   */
  onMovementDetected(speedKmh) {
    if (
      (this.state === StateTypes.MANUAL_REST ||
        this.state === StateTypes.MANUAL_HUT) &&
      speedKmh > 3
    ) {
      this.startAutomatic();
    }
  }

  // --- INTERNAL ---

  _setManual(type) {
    this._clearTimer();
    this.state = type;
    this.manualUntil = Date.now() + REST_TIMEOUT_MS;

    this._timer = setTimeout(() => {
      this.startAutomatic();
    }, REST_TIMEOUT_MS);

    this._emit();
  }

  _clearTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _emit() {
    if (typeof this.onStateChange === "function") {
      this.onStateChange({
        state: this.state,
        manualUntil: this.manualUntil
      });
    }
  }
}
