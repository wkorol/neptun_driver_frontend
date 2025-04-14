import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, of, Subscription, timer, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { NgForOf } from '@angular/common';

interface TaxiStatus {
  TaxiNo: string;
  Latitude: number;
  Longitude: number;
  Status?: string;
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
  private latestSub?: Subscription;
  private refreshSub?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Od razu po wejściu na stronę — zleć odświeżenie
    this.http.get('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status')
        .pipe(catchError(() => of(null)))
        .subscribe();

    // Co 2 sekundy: pobieraj dane z cache
    this.latestSub = timer(0, 2000).pipe(
        switchMap(() =>
            this.http.get<TaxiStatus[]>('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status/latest').pipe(
                catchError(() => of([]))
            )
        )
    ).subscribe((data) => {
      this.taxis = data;
    });

    // Co 30 sekund: trigger do backendu żeby odświeżył cache
    this.refreshSub = timer(30000, 30000).pipe(
        switchMap(() =>
            this.http.get('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status').pipe(
                catchError(() => of(null))
            )
        )
    ).subscribe();
  }


  ngOnDestroy() {
    this.latestSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
  }
}
