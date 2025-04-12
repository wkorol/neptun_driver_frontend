import { Component, OnDestroy, OnInit } from '@angular/core';
import { expand, of, delay, switchMap, Subscription } from 'rxjs';
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
  center: google.maps.LatLngLiteral = { lat: 54.352025, lng: 18.646638 }; // Gdańsk
  zoom = 12;

  taxis: TaxiStatus[] = [];
  private subscription?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.subscription = of(null).pipe(
        expand(() =>
            this.http.get<TaxiStatus[]>('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status').pipe(
                switchMap(data => {
                  this.taxis = data;
                  return of(null).pipe(delay(500)); // krótka przerwa przed następnym zapytaniem
                })
            )
        )
    ).subscribe();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
