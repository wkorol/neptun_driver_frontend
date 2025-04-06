import {
  Component,
  ElementRef,
  ViewChild,
  NgZone,
  ChangeDetectorRef,
  OnDestroy,
  inject,
  DestroyRef
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { AppMapComponent } from '../app-map/app-map.component';
import { fromEvent, Subscription } from 'rxjs';
import { OverlayContainer } from '@angular/cdk/overlay';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-taxi-form',
  standalone: true,
  imports: [
    MatFormField,
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatLabel,
    ReactiveFormsModule,
    MatSlideToggle,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    MatButton,
    GoogleMapsModule,
    CommonModule,
    AppMapComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './taxi-form.component.html',
  styleUrl: './taxi-form.component.css'
})
export class TaxiFormComponent implements OnDestroy {
  taxiForm: FormGroup;
  pickupCoords: google.maps.LatLngLiteral | null = null;
  dropoffCoords: google.maps.LatLngLiteral | null = null;
  price: number | null = null;
  travelTimeInSeconds: number | null = null;

  destroyRef = inject(DestroyRef);
  isRouteLoading: boolean = false;

  @ViewChild('pickup') pickupInput!: ElementRef;
  @ViewChild('dropoff') dropoffInput!: ElementRef;
  @ViewChild('picker') picker!: MatDatepicker<Date>;
  @ViewChild(AppMapComponent) mapComponent!: AppMapComponent;

  private overlayClickSubscription?: Subscription;
  private pickupAutocomplete!: google.maps.places.Autocomplete;
  private dropoffAutocomplete!: google.maps.places.Autocomplete;

  polygonCoords: google.maps.LatLngLiteral[] = [];

  constructor(
      private fb: FormBuilder,
      private overlayContainer: OverlayContainer,
      private ngZone: NgZone,
      private cdr: ChangeDetectorRef
  ) {
    this.taxiForm = this.fb.group({
      immediate: [false],
      date: [new Date()],
      time: [null],
      pickupAddress: ['', Validators.required],
      dropoffAddress: ['']
    });
  }

  ngAfterViewInit(): void {
    this.taxiForm.get('immediate')?.valueChanges
        .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.routeWasCalculated = false;
          this.updateMapRoute();
        });
    this.picker.openedStream.subscribe(() => {
      this.ngZone.runOutsideAngular(() => {
        queueMicrotask(() => {
          const overlayPane = document.querySelector('.cdk-overlay-pane');
          this.overlayClickSubscription = fromEvent<MouseEvent>(document, 'click').subscribe(event => {
            const target = event.target as HTMLElement;
            if (this.picker.opened && overlayPane && !overlayPane.contains(target)) {
              this.ngZone.run(() => this.picker.close());
            }
          });
        });
      });
    });

    this.picker.closedStream.subscribe(() => {
      this.overlayClickSubscription?.unsubscribe();
    });

    const bounds = new google.maps.LatLngBounds(
        { lat: 49.0, lng: 14.0 },
        { lat: 55.0, lng: 24.0 }
    );

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      bounds,
      strictBounds: false
    };

    this.pickupAutocomplete = new google.maps.places.Autocomplete(this.pickupInput.nativeElement, autocompleteOptions);
    this.pickupAutocomplete.addListener('place_changed', () => {
      const place = this.pickupAutocomplete.getPlace();
      this.pickupCoords = place.geometry?.location
          ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
          : null;
      this.updateMapRoute();
    });

    this.dropoffAutocomplete = new google.maps.places.Autocomplete(this.dropoffInput.nativeElement, autocompleteOptions);
    this.dropoffAutocomplete.addListener('place_changed', () => {
      const place = this.dropoffAutocomplete.getPlace();
      this.dropoffCoords = place.geometry?.location
          ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
          : null;
      this.updateMapRoute();
    });

    this.taxiForm.get('pickupAddress')?.valueChanges
        .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.pickupCoords = null;
          this.price = null;
          this.mapComponent.clearRoute();
        });

    this.taxiForm.get('dropoffAddress')?.valueChanges
        .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.dropoffCoords = null;
          this.price = null;
          this.mapComponent.clearRoute();
        });
  }

  get formattedTravelTime(): string | null {
    if (this.travelTimeInSeconds == null) return null;
    const minutes = Math.round(this.travelTimeInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${minutes}min`;
  }

  onPolygonLoaded(polygon: google.maps.LatLngLiteral[][]): void {
    this.polygonCoords = polygon[0];
  }

  onTravelTimeCalculated(seconds: number): void {
    this.travelTimeInSeconds = seconds;
    this.updateMapRoute(); // ponowne przeliczenie ceny po czasie
  }

  updateMapRoute(): void {
    if (
        this.pickupCoords &&
        this.dropoffCoords &&
        !this.routeWasCalculated &&
        !this.isRouteLoading // <- DODAJ TO
    ) {
      this.setRouteLoading(true);
      this.mapComponent.recalculateRoute();
    }
  }

  private lastCalculatedPolylineKey: string | null = null;
  private routeWasCalculated = false;



  isPointInPolygon(point: google.maps.LatLngLiteral): boolean {
    if (!point || !google.maps.geometry || this.polygonCoords.length === 0) return false;

    const latLng = new google.maps.LatLng(point.lat, point.lng);
    const path = this.polygonCoords.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
    const polygon = new google.maps.Polygon({ paths: path });

    return google.maps.geometry.poly.containsLocation(latLng, polygon);
  }

  updateDistancePolyline(polylinePath: google.maps.LatLngLiteral[] | null): void {
    if (!polylinePath || !google.maps.geometry) {
      this.price = null;
      return;
    }

    const polylineKey = JSON.stringify([
      polylinePath.length,
      polylinePath[0]?.lat,
      polylinePath[0]?.lng,
      polylinePath[polylinePath.length - 1]?.lat,
      polylinePath[polylinePath.length - 1]?.lng
    ]);

    if (this.lastCalculatedPolylineKey === polylineKey) return;

    this.lastCalculatedPolylineKey = polylineKey;
    this.routeWasCalculated = true;


    console.log('[DEBUG] Otrzymano polyline do wyceny:', polylinePath);
    this.setRouteLoading(false);

    const gdanskPolygon = new google.maps.Polygon({
      paths: this.mapComponent.gdanskCityCentreFixedPrices.map(coord => new google.maps.LatLng(coord.lat, coord.lng))
    });
    const sopotPolygon = new google.maps.Polygon({
      paths: this.mapComponent.sopotCityCenterFixedPrices.map(coord => new google.maps.LatLng(coord.lat, coord.lng))
    });
    const airportPolygon = new google.maps.Polygon({
      paths: this.mapComponent.airportFixedPrice.map(coord => new google.maps.LatLng(coord.lat, coord.lng))
    });

    const pickup = this.pickupCoords ? new google.maps.LatLng(this.pickupCoords.lat, this.pickupCoords.lng) : null;
    const dropoff = this.dropoffCoords ? new google.maps.LatLng(this.dropoffCoords.lat, this.dropoffCoords.lng) : null;

    const pickupInGdansk = pickup && google.maps.geometry.poly.containsLocation(pickup, gdanskPolygon);
    const dropoffInGdansk = dropoff && google.maps.geometry.poly.containsLocation(dropoff, gdanskPolygon);
    const pickupInSopot = pickup && google.maps.geometry.poly.containsLocation(pickup, sopotPolygon);
    const dropoffInSopot = dropoff && google.maps.geometry.poly.containsLocation(dropoff, sopotPolygon);
    const pickupInAirport = pickup && google.maps.geometry.poly.containsLocation(pickup, airportPolygon);
    const dropoffInAirport = dropoff && google.maps.geometry.poly.containsLocation(dropoff, airportPolygon);

    const fixedAirportToCityPrice =
        (pickupInAirport && (dropoffInGdansk || dropoffInSopot)) ||
        (dropoffInAirport && (pickupInGdansk || pickupInSopot));

    if (fixedAirportToCityPrice) {
      this.price = 100;
      return;
    }

    const cityPolygon = new google.maps.Polygon({
      paths: this.polygonCoords.map(coord => new google.maps.LatLng(coord.lat, coord.lng))
    });

    const pickupInPolygon = this.isPointInPolygon(this.pickupCoords!);
    const dropoffInPolygon = this.isPointInPolygon(this.dropoffCoords!);
    const isCompletelyInCity = pickupInPolygon && dropoffInPolygon;

    let totalDistance = 0;
    let inCityDistance = 0;
    let outCityDistance = 0;

    for (let i = 0; i < polylinePath.length - 1; i++) {
      const pointA = new google.maps.LatLng(polylinePath[i].lat, polylinePath[i].lng);
      const pointB = new google.maps.LatLng(polylinePath[i + 1].lat, polylinePath[i + 1].lng);
      const segmentLength = google.maps.geometry.spherical.computeDistanceBetween(pointA, pointB) / 1000;
      totalDistance += segmentLength;

      if (!isCompletelyInCity) {
        const midPoint = google.maps.geometry.spherical.interpolate(pointA, pointB, 0.5);
        const isInPolygon = google.maps.geometry.poly.containsLocation(midPoint, cityPolygon);
        if (isInPolygon) {
          inCityDistance += segmentLength;
        } else {
          outCityDistance += segmentLength;
        }
      }
    }

    if (isCompletelyInCity) {
      inCityDistance = totalDistance;
      outCityDistance = 0;
    }

    const startDate = new Date(this.taxiForm.get('date')?.value);
    const isImmediate = this.taxiForm.get('immediate')?.value;
    const startTime: Date = isImmediate ? new Date() : this.taxiForm.get('time')?.value;

    if (!startTime || !this.travelTimeInSeconds) {
      console.warn('[DEBUG] Brak startTime lub travelTimeInSeconds!');
      this.price = null;
      return;
    }

    startDate.setHours(startTime.getHours());
    startDate.setMinutes(startTime.getMinutes());

    const { daySeconds, nightSeconds } = this.splitTimeBetweenDayAndNight(startDate, this.travelTimeInSeconds);
    const totalTime = daySeconds + nightSeconds;
    const dayRatio = daySeconds / totalTime;
    const nightRatio = nightSeconds / totalTime;

    const dayInZoneRate = 3.90;
    const nightInZoneRate = 5.85;
    const dayOutZoneRate = 7.80;
    const nightOutZoneRate = 11.70;

    const finalPrice =
        inCityDistance * (dayRatio * dayInZoneRate + nightRatio * nightInZoneRate) +
        outCityDistance * (dayRatio * dayOutZoneRate + nightRatio * nightOutZoneRate) +
        9;

    this.price = parseFloat(finalPrice.toFixed(2));

    console.log('[DEBUG] pickupInPolygon:', pickupInPolygon);
    console.log('[DEBUG] dropoffInPolygon:', dropoffInPolygon);
    console.log('[DEBUG] isCompletelyInCity:', isCompletelyInCity);
    console.log('[DEBUG] totalDistance:', totalDistance.toFixed(2), 'km');
    console.log('[DEBUG] inCityDistance:', inCityDistance.toFixed(2), 'km');
    console.log('[DEBUG] outCityDistance:', outCityDistance.toFixed(2), 'km');
    console.log('[DEBUG] Sekundy dzień/noc:', daySeconds, nightSeconds);
    console.log('[DEBUG] Wyliczona cena:', this.price);
  }



  private getStartTime(): Date | null {
    const date = this.taxiForm.get('date')?.value;
    const time = this.taxiForm.get('time')?.value;
    if (!date || !time) return null;
    const start = new Date(date);
    start.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return start;
  }

  private splitTimeBetweenDayAndNight(startTime: Date, durationInSeconds: number): { daySeconds: number, nightSeconds: number } {
    const NIGHT_START = 22;
    const NIGHT_END = 6;

    const isSunday = startTime.getDay() === 0; // niedziela = 0

    if (isSunday) {
      return { daySeconds: 0, nightSeconds: durationInSeconds };
    }
    const MS = 1000;
    let remaining = durationInSeconds;
    let current = new Date(startTime.getTime());
    let day = 0, night = 0;

    while (remaining > 0) {
      const isNight = current.getHours() < NIGHT_END || current.getHours() >= NIGHT_START;
      const nextBoundary = new Date(current);
      if (isNight) {
        nextBoundary.setHours(current.getHours() < NIGHT_END ? NIGHT_END : 24, 0, 0, 0);
      } else {
        nextBoundary.setHours(NIGHT_START, 0, 0, 0);
      }

      const delta = Math.min((nextBoundary.getTime() - current.getTime()) / MS, remaining);
      if (isNight) night += delta;
      else day += delta;
      current = new Date(current.getTime() + delta * MS);
      remaining -= delta;
    }

    return { daySeconds: day, nightSeconds: night };
  }

  setRouteLoading(value: boolean) {
    this.ngZone.run(() => {
      this.isRouteLoading = value;
      this.cdr.detectChanges();
    });
  }

  handlePickupInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (!input.trim()) {
      this.pickupCoords = null;
      this.price = null;
      this.mapComponent.clearRoute();
    }
  }

  handleDropoffInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (!input.trim()) {
      this.dropoffCoords = null;
      this.price = null;
      this.mapComponent.clearRoute();
    }
  }


  submitOrder(): void {
    if (!this.taxiForm.valid) return;
    const formData = this.taxiForm.value;
    const payload = {
      ...formData,
      pickupCoords: this.pickupCoords,
      dropoffCoords: this.dropoffCoords,
      price: this.price,
      duration: this.formattedTravelTime
    };
    console.log('Zlecenie TAXI:', payload);
  }

  ngOnDestroy(): void {
    this.overlayClickSubscription?.unsubscribe();
  }
}
