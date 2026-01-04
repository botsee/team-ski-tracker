// /js/activityEngine.js

export const ActivityTypes = {
  SKIING: "skiing",
  LIFT: "lift",
  REST: "rest"
};

const BUFFER_SIZE = 6;            // utolsó 6 pont (~1 perc)
const MIN_SKI_SPEED = 10;         // km/h
const MAX_LIFT_SPEED = 6;         // km/h
const MIN_LIFT_SPEED = 2;         // km/h
const REST_SPEED = 0.5;           // km/h

export class ActivityEngine {
  constructor() {
    this.buffer = [];
  }

  /**
   * Új GPS pont hozzáadása
   */
  addPoint({ lat, lng, speed, altitude, timestamp }) {
    this.buffer.push({ lat, lng, speed, altitude, timestamp });

    if (this.buffer.length > BUFFER_SIZE) {
      this.buffer.shift();
    }
  }

  /**
   * Activity meghatározása a buffer alapján
   */
  detectActivity() {
    if (this.buffer.length < 3) {
      return null;
    }

    const speeds = this.buffer.map(p => p.speed || 0);
    const avgSpeed =
      speeds.reduce((a, b) => a + b, 0) / speeds.length;

    // REST
    if (avgSpeed < REST_SPEED) {
      return ActivityTypes.REST;
    }

    // LIFT (lassú, stabil)
    if (
      avgSpeed >= MIN_LIFT_SPEED &&
      avgSpeed <= MAX_LIFT_SPEED &&
      this._isStableDirection()
    ) {
      return ActivityTypes.LIFT;
    }

    // SKIING
    if (avgSpeed >= MIN_SKI_SPEED) {
      return ActivityTypes.SKIING;
    }

    return null;
  }

  // ---- PRIVATE ----

  _isStableDirection() {
    if (this.buffer.length < 4) return false;

    const headings = [];

    for (let i = 1; i < this.buffer.length; i++) {
      const prev = this.buffer[i - 1];
      const curr = this.buffer[i];
      headings.push(this._bearing(prev, curr));
    }

    const variance = this._variance(headings);
    return variance < 200; // kis irányszórás → lift
  }

  _bearing(p1, p2) {
    const toRad = d => (d * Math.PI) / 180;
    const y = Math.sin(toRad(p2.lng - p1.lng)) * Math.cos(toRad(p2.lat));
    const x =
      Math.cos(toRad(p1.lat)) * Math.sin(toRad(p2.lat)) -
      Math.sin(toRad(p1.lat)) *
        Math.cos(toRad(p2.lat)) *
        Math.cos(toRad(p2.lng - p1.lng));
    return Math.atan2(y, x) * (180 / Math.PI);
  }

  _variance(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return (
      arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      arr.length
    );
  }
}
