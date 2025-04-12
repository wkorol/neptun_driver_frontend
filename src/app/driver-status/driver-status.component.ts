import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { NgForOf } from '@angular/common';
import { catchError, timeout, of } from 'rxjs';

interface TaxiStatus {
  TaxiNo: string;
  Latitude: number;
  Longitude: number;
}

@Component({
  selector: 'app-driver-status',
  standalone: true,
  imports: [
    GoogleMap,
    MapMarker,
    NgForOf
  ],
  templateUrl: './driver-status.component.html',
  styleUrl: './driver-status.component.css'
})
export class DriverStatusComponent implements OnInit, OnDestroy {
  center: google.maps.LatLngLiteral = { lat: 54.352025, lng: 18.646638 }; // Gdańsk
  zoom = 12;

  taxis: TaxiStatus[] = [];
  private polling = false;

  // Chroni przed wielokrotnym odpaleniem
  private static isPolling = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    console.log('[DriverStatus] ngOnInit');
    if (DriverStatusComponent.isPolling) {
      console.warn('[DriverStatus] Polling already running — skipping init');
      return;
    }

    DriverStatusComponent.isPolling = true;
    this.startPolling();
  }

  ngOnDestroy() {
    this.polling = false;
    DriverStatusComponent.isPolling = false;
    console.log('[DriverStatus] ngOnDestroy');
  }

  private startPolling() {
    console.log('[DriverStatus] startPolling');
    const poll = () => {
      if (!this.polling) return;

      this.http.get<TaxiStatus[]>('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status').pipe(
          timeout(10000), // max 10s na odpowiedź
          catchError(err => {
            console.error('[DriverStatus] Polling error:', err);
            return of([]); // nie przerywaj pętli
          })
      ).subscribe(data => {
        this.taxis = data;
        setTimeout(poll, 500); // krótka pauza przed kolejnym requestem
      });
    };

    this.polling = true;
    poll();
  }
}
