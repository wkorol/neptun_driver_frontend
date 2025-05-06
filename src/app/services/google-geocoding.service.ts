// google-geocoding.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GoogleGeocodingService {
    geocodeAddress(address: string): Promise<google.maps.LatLngLiteral | null> {
        const geocoder = new google.maps.Geocoder();
        return new Promise((resolve) => {
            geocoder.geocode({ address }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    const location = results[0].geometry.location;
                    resolve({ lat: location.lat(), lng: location.lng() });
                } else {
                    console.warn('[Geocoder] Nie udało się znaleźć adresu:', status);
                    resolve(null);
                }
            });
        });
    }

    async reverseGeocode(coords: { lat: number; lng: number }): Promise<unknown> {
        const geocoder = new google.maps.Geocoder();
        return new Promise((resolve) => {
            geocoder.geocode({ location: coords }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    resolve(null);
                }
            });
        });
    }
}