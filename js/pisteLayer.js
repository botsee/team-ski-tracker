// /js/pisteLayer.js

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CACHE_PREFIX = "piste_geom_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 óra

export class PisteLayer {
  constructor(map, eventId, center, radiusKm = 5) {
    this.map = map;
    this.eventId = eventId;
    this.center = center;
    this.radiusKm = radiusKm;
    this.layer = L.layerGroup().addTo(map);
    this.visible = false;
  }

  async toggle() {
    if (this.visible) {
      this.layer.clearLayers();
      this.visible = false;
      return;
    }

    const data = this._loadCache();
    if (data) {
      this._draw(data);
      this.visible = true;
      return;
    }

    const query = this._buildQuery();
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      body: query
    });

    const json = await res.json();
    const ways = json.elements || [];

    this._saveCache(ways);
    this._draw(ways);
    this.visible = true;
  }

  _buildQuery() {
    const { lat, lng } = this.center;
    const r = this.radiusKm * 1000;

    return `
      [out:json][timeout:25];
      way["piste:type"](around:${r},${lat},${lng});
      out geom tags;
    `;
  }

  _draw(ways) {
    ways.forEach(w => {
      if (!w.geometry) return;

      const latlngs = w.geometry.map(p => [p.lat, p.lon]);

      L.polyline(latlngs, {
        color: this._color(w.tags?.["piste:difficulty"]),
        weight: 3,
        opacity: 0.85
      })
        .bindPopup(
          `<strong>${w.tags?.name || "Pálya"}</strong><br>
           Nehézség: ${w.tags?.["piste:difficulty"] || "ismeretlen"}`
        )
        .addTo(this.layer);
    });
  }

  _color(diff) {
    if (diff === "green") return "#2ecc71";
    if (diff === "blue") return "#3498db";
    if (diff === "red") return "#e74c3c";
    if (diff === "black") return "#000";
    return "#aaa";
  }

  _saveCache(data) {
    localStorage.setItem(
      CACHE_PREFIX + this.eventId,
      JSON.stringify({ ts: Date.now(), data })
    );
  }

  _loadCache() {
    const raw = localStorage.getItem(CACHE_PREFIX + this.eventId);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + this.eventId);
      return null;
    }

    return parsed.data;
  }
}
