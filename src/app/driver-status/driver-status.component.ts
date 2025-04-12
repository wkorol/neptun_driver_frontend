import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { NgForOf } from '@angular/common';

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
  center: google.maps.LatLngLiteral = { lat: 54.352025, lng: 18.646638 };
  zoom = 12;

  taxis: TaxiStatus[] = [];
  private polling = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.startPolling();
  }

  ngOnDestroy() {
    this.polling = false; // zatrzymaj pętlę
  }

  private startPolling() {
    const poll = () => {
      if (!this.polling) return;

      this.http.get<TaxiStatus[]>('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status')
          .subscribe({
            next: (data) => {
              this.taxis = data;
              setTimeout(poll, 500); // mała przerwa po odpowiedzi
            },
            error: (err) => {
              console.error('Polling error:', err);
              setTimeout(poll, 5000); // dłuższy wait przy błędzie
            }
          });
    };

    poll();
  }
}
