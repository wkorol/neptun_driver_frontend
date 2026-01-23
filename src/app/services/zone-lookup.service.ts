import { Injectable } from '@angular/core';

type Position = [number, number]; // [lng, lat]

type PolygonRings = Position[][]; // [outer, holes...]

type PolygonWithBbox = {
    rings: PolygonRings;
    bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
};

type ZonePolygon = {
    zone: number;
    polygons: PolygonWithBbox[];
};

type GeoJsonFeatureCollection = {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
};

type GeoJsonFeature = {
    type: 'Feature';
    properties: { zone?: number };
    geometry: GeoJsonGeometry;
};

type GeoJsonGeometry =
    | { type: 'Polygon'; coordinates: PolygonRings }
    | { type: 'MultiPolygon'; coordinates: PolygonRings[] }
    | { type: 'Point'; coordinates: Position };

type ZoneCentroid = {
    zone: number;
    position: Position; // [lng, lat]
};

@Injectable({ providedIn: 'root' })
export class ZoneLookupService {
    private zones: ZonePolygon[] = [];
    private centroids: ZoneCentroid[] = [];
    private loadPromise: Promise<void> | null = null;

    async ensureLoaded(): Promise<void> {
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = Promise.all([
            fetch('/zones.geojson')
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to load zones.geojson: ${res.status}`);
                    }
                    return res.json();
                }),
            fetch('/zones_centroids.geojson')
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to load zones_centroids.geojson: ${res.status}`);
                    }
                    return res.json();
                })
        ])
            .then(([zonesData, centroidsData]: [GeoJsonFeatureCollection, GeoJsonFeatureCollection]) => {
                this.zones = this.parseZones(zonesData);
                this.centroids = this.parseCentroids(centroidsData);
            })
            .catch(err => {
                console.error('[ZoneLookup] Load error', err);
                this.zones = [];
                this.centroids = [];
            });

        return this.loadPromise;
    }

    getZoneForPoint(lat: number, lng: number): number | null {
        if (!this.zones.length) return null;

        for (const zone of this.zones) {
            for (const poly of zone.polygons) {
                if (!this.pointInBbox(lat, lng, poly.bbox)) continue;
                if (this.pointInPolygon(lat, lng, poly.rings)) {
                    return zone.zone;
                }
            }
        }

        return null;
    }

    getNearestZoneForPoint(lat: number, lng: number): number | null {
        if (!this.centroids.length) return null;
        let bestZone: number | null = null;
        let bestDist = Number.POSITIVE_INFINITY;

        for (const centroid of this.centroids) {
            const d = this.haversine(lat, lng, centroid.position[1], centroid.position[0]);
            if (d < bestDist) {
                bestDist = d;
                bestZone = centroid.zone;
            }
        }

        return bestZone;
    }

    private parseZones(data: GeoJsonFeatureCollection): ZonePolygon[] {
        const zones: ZonePolygon[] = [];

        for (const feature of data.features || []) {
            const zoneId = feature.properties?.zone;
            if (typeof zoneId !== 'number' || !feature.geometry) continue;

            const polygons: PolygonWithBbox[] = [];

            if (feature.geometry.type === 'Polygon') {
                polygons.push(this.buildPolygon(feature.geometry.coordinates));
            } else if (feature.geometry.type === 'MultiPolygon') {
                for (const coords of feature.geometry.coordinates) {
                    polygons.push(this.buildPolygon(coords));
                }
            }

            if (polygons.length) {
                zones.push({ zone: zoneId, polygons });
            }
        }

        zones.sort((a, b) => a.zone - b.zone);
        return zones;
    }

    private parseCentroids(data: GeoJsonFeatureCollection): ZoneCentroid[] {
        const centroids: ZoneCentroid[] = [];

        for (const feature of data.features || []) {
            const zoneId = feature.properties?.zone;
            if (typeof zoneId !== 'number' || !feature.geometry) continue;
            if (feature.geometry.type !== 'Point') continue;
            centroids.push({ zone: zoneId, position: feature.geometry.coordinates });
        }

        centroids.sort((a, b) => a.zone - b.zone);
        return centroids;
    }

    private buildPolygon(rings: PolygonRings): PolygonWithBbox {
        let minLng = Number.POSITIVE_INFINITY;
        let minLat = Number.POSITIVE_INFINITY;
        let maxLng = Number.NEGATIVE_INFINITY;
        let maxLat = Number.NEGATIVE_INFINITY;

        for (const ring of rings) {
            for (const [lng, lat] of ring) {
                if (lng < minLng) minLng = lng;
                if (lat < minLat) minLat = lat;
                if (lng > maxLng) maxLng = lng;
                if (lat > maxLat) maxLat = lat;
            }
        }

        return {
            rings,
            bbox: [minLng, minLat, maxLng, maxLat]
        };
    }

    private pointInBbox(lat: number, lng: number, bbox: [number, number, number, number]): boolean {
        const [minLng, minLat, maxLng, maxLat] = bbox;
        return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
    }

    private pointInPolygon(lat: number, lng: number, rings: PolygonRings): boolean {
        if (!rings.length) return false;
        if (!this.pointInRing(lat, lng, rings[0])) return false;

        for (let i = 1; i < rings.length; i += 1) {
            if (this.pointInRing(lat, lng, rings[i])) return false;
        }

        return true;
    }

    private pointInRing(lat: number, lng: number, ring: Position[]): boolean {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];

            const intersect =
                yi > lat !== yj > lat &&
                lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const toRad = (val: number) => (val * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
