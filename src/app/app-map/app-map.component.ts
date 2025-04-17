import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  GoogleMap,
  MapDirectionsRenderer,
  MapPolygon
} from '@angular/google-maps';
import {NgForOf, NgIf} from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-app-map',
  standalone: true,
  imports: [GoogleMap, MapDirectionsRenderer, NgIf, MapPolygon, NgForOf],
  templateUrl: './app-map.component.html',
  styleUrl: './app-map.component.css'
})
export class AppMapComponent {
  @Input() origin!: google.maps.LatLngLiteral;
  @Input() destination!: google.maps.LatLngLiteral;
  @Input() center: google.maps.LatLngLiteral = { lat: 54.3520, lng: 18.6466 };
  @Input() polygonCoords: google.maps.LatLngLiteral[][] = [];

  @Output() distanceCalculated = new EventEmitter<google.maps.LatLngLiteral[] | null>();
  @Output() polygonLoaded = new EventEmitter<google.maps.LatLngLiteral[][]>();
  @Output() routeLoading = new EventEmitter<boolean>();

  @ViewChild(MapDirectionsRenderer) directionsRenderer!: MapDirectionsRenderer;

  @Output() travelTimeCalculated = new EventEmitter<number>(); // czas przejazdu w sekundach

  directions: google.maps.DirectionsResult | null = null;
  mapCenter!: google.maps.LatLngLiteral;
  isLoadingRoute: boolean = false;

  polygonOptions = {
    strokeColor: '#00BFFF',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#00BFFF',
    fillOpacity: 0.15
  };

  private kowaleCoords: google.maps.LatLngLiteral[] = [
    { lat: 54.2854146365508, lng: 18.601215504948414 },
    { lat: 54.284276585749126, lng: 18.572340057706214 },
    { lat: 54.313189760511335, lng: 18.54312939506633 },
    { lat: 54.328731387055285, lng: 18.584915629061243 },
    { lat: 54.309246435958585, lng: 18.624003030863776 },
    { lat: 54.28553747199902, lng: 18.601214809862057 }
  ];

  gdanskCityCentreFixedPrices: google.maps.LatLngLiteral[] = [
    { lat: 54.36260223043774, lng: 18.645315470185977 },
    { lat: 54.36253600655993, lng: 18.643002662036608 },
    { lat: 54.36233797333567, lng: 18.640712149683313 },
    { lat: 54.362010039819644, lng: 18.638466013347703 },
    { lat: 54.361555367254276, lng: 18.63628590421142 },
    { lat: 54.360978338507316, lng: 18.63419283514708 },
    { lat: 54.36028451570382, lng: 18.632206977690164 },
    { lat: 54.35948058646651, lng: 18.63034746723258 },
    { lat: 54.35857429929002, lng: 18.628632218334957 },
    { lat: 54.35757438867943, lng: 18.627077751951827 },
    { lat: 54.3564904907836, lng: 18.625699036243013 },
    { lat: 54.355333050345266, lng: 18.624509342507526 },
    { lat: 54.35411321987371, lng: 18.623520117624 },
    { lat: 54.352842752019775, lng: 18.622740874216426 },
    { lat: 54.35153388619888, lng: 18.62217909958726 },
    { lat: 54.35019923056063, lng: 18.62184018427398 },
    { lat: 54.34885164044816, lng: 18.62172737089145 },
    { lat: 54.34750409452219, lng: 18.621841723723733 },
    { lat: 54.34616956974536, lng: 18.6221821193266 },
    { lat: 54.34486091643189, lng: 18.622745258198506 },
    { lat: 54.34359073456484, lng: 18.623525697374912 },
    { lat: 54.3423712525693, lng: 18.624515903600624 },
    { lat: 54.34121420970443, lng: 18.625706326539234 },
    { lat: 54.34013074320093, lng: 18.627085491289222 },
    { lat: 54.339131281223416, lng: 18.62864010929515 },
    { lat: 54.33822544268001, lng: 18.630355206570393 },
    { lat: 54.337421944835114, lng: 18.63221426798717 },
    { lat: 54.33672851960512, lng: 18.634199396241204 },
    { lat: 54.33615183933426, lng: 18.636291483963436 },
    { lat: 54.335697452755866, lng: 18.63847039733081 },
    { lat: 54.33536973174733, lng: 18.64071516942344 },
    { lat: 54.335171829384535, lng: 18.643004201486782 },
    { lat: 54.335105649693226, lng: 18.645315470185977 },
    { lat: 54.335171829384535, lng: 18.647626738885172 },
    { lat: 54.33536973174733, lng: 18.649915770948517 },
    { lat: 54.335697452755866, lng: 18.652160543041145 },
    { lat: 54.33615183933426, lng: 18.654339456408522 },
    { lat: 54.33672851960512, lng: 18.656431544130754 },
    { lat: 54.337421944835114, lng: 18.658416672384785 },
    { lat: 54.33822544268001, lng: 18.660275733801562 },
    { lat: 54.339131281223416, lng: 18.661990831076803 },
    { lat: 54.34013074320093, lng: 18.663545449082733 },
    { lat: 54.34121420970443, lng: 18.664924613832724 },
    { lat: 54.3423712525693, lng: 18.66611503677133 },
    { lat: 54.34359073456484, lng: 18.667105242997046 },
    { lat: 54.34486091643189, lng: 18.667885682173452 },
    { lat: 54.34616956974536, lng: 18.66844882104536 },
    { lat: 54.34750409452219, lng: 18.668789216648225 },
    { lat: 54.34885164044816, lng: 18.668903569480506 },
    { lat: 54.35019923056063, lng: 18.668790756097977 },
    { lat: 54.35153388619888, lng: 18.668451840784698 },
    { lat: 54.352842752019775, lng: 18.66789006615553 },
    { lat: 54.35411321987371, lng: 18.667110822747954 },
    { lat: 54.355333050345266, lng: 18.666121597864432 },
    { lat: 54.3564904907836, lng: 18.664931904128945 },
    { lat: 54.35757438867943, lng: 18.663553188420128 },
    { lat: 54.35857429929002, lng: 18.661998722036998 },
    { lat: 54.35948058646651, lng: 18.660283473139376 },
    { lat: 54.36028451570382, lng: 18.65842396268179 },
    { lat: 54.360978338507316, lng: 18.656438105224876 },
    { lat: 54.361555367254276, lng: 18.654345036160535 },
    { lat: 54.362010039819644, lng: 18.652164927024252 },
    { lat: 54.36233797333567, lng: 18.649918790688645 },
    { lat: 54.36253600655993, lng: 18.64762827833535 },
    { lat: 54.36260223043774, lng: 18.645315470185977 }
  ];

  airportFixedPrice: google.maps.LatLngLiteral[] = [
    { lat: 54.3827851, lng: 18.4612494 },
    { lat: 54.3848844, lng: 18.4656268 },
    { lat: 54.3842846, lng: 18.4710341 },
    { lat: 54.3827351, lng: 18.4794455 },
    { lat: 54.3813855, lng: 18.485282 },
    { lat: 54.379586, lng: 18.4882861 },
    { lat: 54.3774364, lng: 18.4894019 },
    { lat: 54.3754867, lng: 18.4918052 },
    { lat: 54.3729869, lng: 18.4942084 },
    { lat: 54.3719369, lng: 18.4932643 },
    { lat: 54.371337, lng: 18.4927493 },
    { lat: 54.370587, lng: 18.4909468 },
    { lat: 54.369587, lng: 18.4848529 },
    { lat: 54.3729869, lng: 18.4748965 },
    { lat: 54.3743868, lng: 18.4705191 },
    { lat: 54.3755367, lng: 18.4670001 },
    { lat: 54.3774364, lng: 18.462966 },
    { lat: 54.3778363, lng: 18.4576445 },
    { lat: 54.3797859, lng: 18.4516364 },
    { lat: 54.3811856, lng: 18.4494048 },
    { lat: 54.3823353, lng: 18.4466582 },
    { lat: 54.383235, lng: 18.4495765 },
    { lat: 54.383135, lng: 18.4526664 },
    { lat: 54.3825852, lng: 18.4565287 },
    { lat: 54.3827851, lng: 18.458932 },
    { lat: 54.3827351, lng: 18.4609919 },
    { lat: 54.3827851, lng: 18.4612494 } // zamknięcie polygonu
  ];


  sopotCityCenterFixedPrices: google.maps.LatLngLiteral[] = [
    { lat: 54.434189957033595, lng: 18.577902414472675 },
    { lat: 54.429780274742086, lng: 18.585526593181157 },
    { lat: 54.43224424415433,  lng: 18.589497461249522 },
    { lat: 54.44593957053311,  lng: 18.572897864133296 },
    { lat: 54.4519634612013,   lng: 18.56672451795788 },
    { lat: 54.45413733285676,  lng: 18.565194419805124 },
    { lat: 54.45347383014868,  lng: 18.559420951944475 },
    { lat: 54.43943984972185,  lng: 18.55701130480736 },
    { lat: 54.43424928858167,  lng: 18.577979917823114 },
    { lat: 54.434189957033595, lng: 18.577902414472675 } // zamknięcie polygonu
  ];





  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPolygon();
  }

  private lastOrigin: google.maps.LatLngLiteral | null = null;
  private lastDestination: google.maps.LatLngLiteral | null = null;

  private coordsAreEqual(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): boolean {
    return a.lat === b.lat && a.lng === b.lng;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
        !this.origin || !this.destination ||
        (this.origin.lat === 0 && this.origin.lng === 0) ||
        (this.destination.lat === 0 && this.destination.lng === 0)
    ) {
      return;
    }

    const originChanged = !this.lastOrigin || !this.coordsAreEqual(this.lastOrigin, this.origin);
    const destinationChanged = !this.lastDestination || !this.coordsAreEqual(this.lastDestination, this.destination);

    if (originChanged || destinationChanged) {
      this.lastOrigin = { ...this.origin };
      this.lastDestination = { ...this.destination };
      this.recalculateRoute();
    }
  }


  loadPolygon(): void {
    const urls = [
      'https://polygons.openstreetmap.fr/get_geojson.py?id=2723259&params=0',
      'https://polygons.openstreetmap.fr/get_geojson.py?id=1553144&params=0',
      'https://polygons.openstreetmap.fr/get_geojson.py?id=12581551&params=0'
    ];

    Promise.all(urls.map(url => this.http.get<any>(url).toPromise()))
        .then((geojsons) => {
          const allPolygons: google.maps.LatLngLiteral[][] = [];

          geojsons.forEach(geojson => {
            if (geojson.type === 'MultiPolygon') {
              geojson.coordinates.forEach((polygon: [number, number][][]) => {
                const coords = polygon[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));
                allPolygons.push(coords);
              });
            } else if (geojson.type === 'Polygon') {
              const coords = geojson.coordinates[0].map(([lng, lat]: [number, number]) => ({ lat, lng }));
              allPolygons.push(coords);
            }
          });

          allPolygons.push(this.kowaleCoords);
          this.polygonCoords = allPolygons;
          this.polygonLoaded.emit(this.polygonCoords);
        })
        .catch(err => console.error('[MAP] Błąd ładowania polygonów:', err));
  }

  private isCalculatingRoute = false;


  recalculateRoute(): void {
    if (this.isCalculatingRoute) return;

    this.isCalculatingRoute = true;
    this.routeLoading.emit(true);
    this.calculateRoute();
  }

  private calculateRoute(): void {
    if (
        !this.origin || !this.destination ||
        (this.origin.lat === 0 && this.origin.lng === 0) ||
        (this.destination.lat === 0 && this.destination.lng === 0)
    ) {
      console.warn('[MAP] Nieprawidłowe współrzędne');
      this.directions = null;
      this.distanceCalculated.emit(null);
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
        {
          origin: this.origin,
          destination: this.destination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true // Żądanie alternatywnych tras
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
            const shortestRoute = result.routes.reduce((prev, curr) => {
              const prevDistance = prev.legs[0].distance?.value ?? Infinity;
              const currDistance = curr.legs[0].distance?.value ?? Infinity;
              return currDistance < prevDistance ? curr : prev;
            });

            this.directions = {
              ...result,
              routes: [shortestRoute] // Ustawiamy tylko najkrótszą trasę
            };

            const leg = shortestRoute.legs[0];

            if (leg.duration?.value != null) {
              this.travelTimeCalculated.emit(leg.duration.value);
            }

            const path = google.maps.geometry.encoding.decodePath(shortestRoute.overview_polyline);
            const literalPath = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
            this.distanceCalculated.emit(literalPath);
          } else {
            console.error('[MAP] Błąd trasy:', status);
            this.directions = null;
            this.distanceCalculated.emit(null);
          }

          this.isLoadingRoute = false;
          this.isCalculatingRoute = false;
          this.routeLoading.emit(false);
        }
    );
  }

  clearRoute(): void {
    if (this.directionsRenderer?.directionsRenderer) {
      this.directionsRenderer.directionsRenderer.setDirections(null);
    }
    this.directions = null;
    this.distanceCalculated.emit(null);
  }
}
