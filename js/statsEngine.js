// /js/statsEngine.js

export class StatsEngine {
  constructor() {
    this.lastPoint = null;
    this.lastTs = null;
    this.lastState = null;

    this.distance = 0; // méter
    this.restTime = 0; // ms
  }

  addPoint({ lat, lng, ts, state }) {
    if (this.lastTs && this.lastState) {
      const dt = ts - this.lastTs;

      if (this.lastState === "rest") {
        this.restTime += dt;
      }
    }

    if (
      this.lastPoint &&
      state === "skiing" &&
      this.lastState === "skiing"
    ) {
      this.distance += this._distance(
        this.lastPoint.lat,
        this.lastPoint.lng,
        lat,
        lng
      );
    }

    this.lastPoint = { lat, lng };
    this.lastTs = ts;
    this.lastState = state;
  }

  getStats() {
    return {
      distanceKm: (this.distance / 1000).toFixed(2),
      restTimeMin: Math.round(this.restTime / 60000)
    };
  }

  _distance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
