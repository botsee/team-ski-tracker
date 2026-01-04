// /js/osmContext.js

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CACHE_PREFIX = "osm_cache_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 óra

// keresési távolságok (méter)
const DIST_PISTE = 25;
const DIST_LIFT = 30;
const DIST_HUT = 40;

export class OSMContext {
  constructor(eventId, center, radiusKm = 5) {
    this.eventId = eventId;
    this.center = center; // { lat, lng }
    this.radiusKm = radiusKm;
    this.data = null;
  }

  async init() {
    const cached = this._loadCache();
    if (cached) {
      this.data = cached;
      return;
    }

    const query = this._buildQuery();
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      body: query
    });

    const json = await res.json();
    this.data = this._normalize(json.elements);
    this._saveCache(this.data);
  }

  /**
   * Kontextus meghatározása egy GPS ponthoz
   */
  getContext(lat, lng, activityType) {
    if (!this.data) return null;

    if (activityType === "skiing") {
      return this._findNearest(this.data.pistes, lat, lng, DIST_PISTE);
    }

    if (activityType === "lift") {
      return this._findNearest(this.data.lifts, lat, lng, DIST_LIFT);
    }

    if (activityType === "rest") {
      return this._findNearest(this.data.huts, lat, lng, DIST_HUT);
    }

    return null;
  }

  // ---------------- PRIVATE ----------------

  _buildQuery() {
    const { lat, lng } = this.center;
    const r = this.radiusKm * 1000;

    return `
      [out:json][timeout:25];
      (
        way(around:${r},${lat},${lng})["piste:type"];
        way(around:${r},${lat},${lng})["aerialway"];
        node(around:${r},${lat},${lng})["amenity"~"restaurant|cafe|alpine_hut"];
      );
      out center tags;
    `;
  }

  _normalize(elements) {
    const pistes = [];
    const lifts = [];
    const huts = [];

    elements.forEach(el => {
      const lat = el.lat || el.center?.lat;
      const lng = el.lon || el.center?.lon;
      if (!lat || !lng) return;

      if (el.tags?.["piste:type"]) {
        pistes.push({
          name: el.tags.name || "Ismeretlen pálya",
          difficulty: el.tags["piste:difficulty"] || null,
          lat,
          lng
        });
      }

      if (el.tags?.aerialway) {
        lifts.push({
          name: el.tags.name || "Felvonó",
          type: el.tags.aerialway,
          lat,
          lng
        });
      }

      if (el.tags?.amenity) {
        huts.push({
          name: el.tags.name || "Hütte",
          lat,
          lng
        });
      }
    });

    return { pistes, lifts, huts };
  }

  _findNearest(list, lat, lng, maxDist) {
    let best = null;
    let bestDist = Infinity;

    list.forEach(item => {
      const d = this._distance(lat, lng, item.lat, item.lng);
      if (d < bestDist && d <= maxDist) {
        bestDist = d;
        best = item;
      }
    });

    return best;
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

  _cacheKey() {
    return CACHE_PREFIX + this.eventId;
  }

  _saveCache(data) {
    localStorage.setItem(
      this._cacheKey(),
      JSON.stringify({
        ts: Date.now(),
        data
      })
    );
  }

  _loadCache() {
    const raw = localStorage.getItem(this._cacheKey());
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      localStorage.removeItem(this._cacheKey());
      return null;
    }

    return parsed.data;
  }
}
