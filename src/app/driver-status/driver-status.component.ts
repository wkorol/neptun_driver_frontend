import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, Subscription, timer, switchMap } from 'rxjs';
import {FormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";

interface TaxiStatus {
  TaxiNo: string;
  Latitude: number;
  Longitude: number;
  Status?: number;
}

declare const google: any;


@Component({
  selector: 'app-driver-status',
  standalone: true,
  imports: [
    FormsModule,
    NgIf
  ],
  templateUrl: './driver-status.component.html',
  styleUrl: './driver-status.component.css'
})
export class DriverStatusComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  map!: google.maps.Map;
  center: google.maps.LatLngLiteral = { lat: 54.352025, lng: 18.646638 };
  zoom = 12;
  taxis: TaxiStatus[] = [];
  private latestSub?: Subscription;
  private refreshSub?: Subscription;
  private markers: google.maps.marker.AdvancedMarkerElement[] = [];
  private userLocationMarker?: google.maps.marker.AdvancedMarkerElement;
  searchTerm: string = '';
  notFound: boolean = false;



  constructor(private http: HttpClient) {}


  ngOnInit() {
    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: this.center,
      zoom: this.zoom,
      disableDefaultUI: true,
      mapId: '63516a0a42b74a67?v=1337'
    });


    // Trigger cache refresh once
    this.http.get('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status')
        .pipe(catchError(() => of(null)))
        .subscribe();

    // Every 2 seconds: get taxi data from cache
    this.latestSub = timer(0, 2000).pipe(
        switchMap(() =>
            this.http.get<TaxiStatus[]>('https://apineptun-ij5mx.ondigitalocean.app/api/proxy/drivers/status/latest').pipe(
                catchError(() => of([]))
            )
        )
    ).subscribe((data) => {
      this.taxis = data;
      this.updateMarkers();
    });

    // Every 30 seconds: ask backend to refresh cache
    this.refreshSub = timer(10000, 10000).pipe(
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

  private updateMarkers() {
    this.markers.forEach((marker) => marker.map = null);
    this.markers = [];

    for (const taxi of this.taxis) {
      if (taxi !== null) {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat: taxi.Latitude, lng: taxi.Longitude },
          map: this.map,
          title: `Taxi ${taxi.TaxiNo}`,
          content: this.createMarkerLabel(taxi.TaxiNo, taxi.Status)
        });
        this.markers.push(marker);
      }
    }

    this.filterMarkers(); // od razu zastosuj filtr
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterMarkers(); // pokaż wszystkie taksówki
  }

  filterMarkers() {
    const term = this.searchTerm.trim().toLowerCase();

    // Pokaż zawsze wszystkie taksówki
    this.markers.forEach((marker) => {
      marker.map = this.map;
    });

    // Jeśli nic nie wpisane – nie zoomuj
    if (term === '') {
      this.notFound = false;
      return;
    }

    // Znajdź dokładnie dopasowaną taksówkę
    const index = this.taxis.findIndex(t => t.TaxiNo.toLowerCase() === term);
    if (index !== -1) {
      this.notFound = false;

      const taxi = this.taxis[index];
      const position = {
        lat: taxi.Latitude,
        lng: taxi.Longitude
      };

      this.map.panTo(position);
      this.map.setZoom(14);
    } else {
      this.notFound = true;
    }

  }






  private createMarkerLabel(taxiNo: string, status?: number): HTMLElement {
    const div = document.createElement('div');
    div.innerText = taxiNo;

    let backgroundColor = '#2196F3'; // default blue
    if (status === 1) {
      backgroundColor = '#4CAF50'; // green
    } else if (status === 2) {
      backgroundColor = '#F44336'; // red
    }

    div.style.background = backgroundColor;
    div.style.color = '#fff';
    div.style.padding = '4px 8px';
    div.style.borderRadius = '8px';
    div.style.fontWeight = 'bold';
    div.style.fontSize = '12px';
    div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

    // 🔑 Fix: allow click to bubble to the marker
    div.style.pointerEvents = 'none';

    return div;
  }

  locateMe(): void {
    this.searchTerm = '253';
  }
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //         (position) => {
  //           const latLng = {
  //             lat: position.coords.latitude,
  //             lng: position.coords.longitude,
  //           };
  //
  //           this.map.panTo(latLng);
  //           this.map.setZoom(15);
  //
  //           // Remove old user marker if it exists
  //           if (this.userLocationMarker) {
  //             this.userLocationMarker.map = null;
  //           }
  //
  //           // Create a styled marker for the user's location
  //           const markerContent = document.createElement('div');
  //           markerContent.style.width = '16px';
  //           markerContent.style.height = '16px';
  //           markerContent.style.borderRadius = '50%';
  //           markerContent.style.backgroundColor = '#4285F4';
  //           markerContent.style.border = '2px solid white';
  //           markerContent.style.boxShadow = '0 0 6px rgba(0, 0, 0, 0.3)';
  //           markerContent.style.pointerEvents = 'none'; // allow click-through
  //
  //           this.userLocationMarker = new google.maps.marker.AdvancedMarkerElement({
  //             position: latLng,
  //             map: this.map,
  //             title: 'You are here',
  //             content: markerContent,
  //           });
  //         },
  //         (error) => {
  //           alert('Geolocation failed: ' + error.message);
  //         }
  //     );
  //   } else {
  //     alert('Geolocation is not supported by your browser.');
  //   }
  // }

}
