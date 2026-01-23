import { AfterViewChecked, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { MamTaxiAuthService } from "../services/mam-taxi-auth.service";
import { apiConfig } from '../config/api.config';
import { Order } from '../shared/order.model';
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatButton } from "@angular/material/button";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import {
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from "@angular/material/input";
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from "@angular/forms";
import { GoogleGeocodingService } from "../services/google-geocoding.service";
import { ZoneLookupService } from "../services/zone-lookup.service";

@Component({
    selector: 'app-order-list',
    standalone: true,
    imports: [
        MatExpansionPanelHeader,
        NgIf,
        NgForOf,
        MatProgressSpinner,
        MatButton,
        MatExpansionPanel,
        MatExpansionPanelTitle,
        MatAccordion,
        MatFormFieldModule,
        MatInput,
        MatSelectModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        NgClass
    ],
    templateUrl: './order-list.component.html',
    styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit, OnDestroy, AfterViewChecked {
    todayOrders: Order[] = [];
    actualOrders: Order[] = [];
    ordersForNext5Days: Order[] = [];
    isLoading = false;
    message = '';
    isAuthenticated = false;
    sessionChecked = false;
    private eventSource: EventSource | null = null;
    private realtimeReloadHandle: ReturnType<typeof setTimeout> | null = null;
    private pollingHandle: ReturnType<typeof setInterval> | null = null;
    private readonly realtimeUrl = `${apiConfig.baseUrl}/api/orders/stream`;
    private historyOpenIds = new Set<number>();
    private knownOrderIds = new Set<number>();
    private seenOrderIds = new Set<number>();
    private newOrderIds = new Set<number>();
    private hasLoadedOnce = false;
    private lastOrdersById = new Map<number, Order[]>();
    private pendingScrollRestore: { anchor: { id: number | null; offset: number }; scrollY: number; attempts: number } | null = null;
    private addressZoneCache = new Map<string, number | null>();
    private addressGeoCache = new Map<string, { lat: number; lng: number } | null>();
    private orderZoneById = new Map<number, number | null>();
    private zoneLookupReady = false;
    private geocodeQueue: Array<{ address: string; resolve: (coords: { lat: number; lng: number } | null) => void }> = [];
    private geocodeInFlight = 0;
    private readonly geocodeConcurrency = 2;
    private geocodePromises = new Map<string, Promise<{ lat: number; lng: number } | null>>();
    private pendingGeocodeAddresses = new Set<string>();
    private readonly maxGeocodePerRun = 20;
    private pendingAssignHandle: ReturnType<typeof setTimeout> | null = null;
    private persistHandle: ReturnType<typeof setTimeout> | null = null;
    private cacheDirty = false;
    private pendingZoneUpdates = new Map<number, { order: Order; zoneId: number | null }>();
    private zoneFlushHandle: ReturnType<typeof setTimeout> | null = null;
    private readonly geoCacheKey = 'zone-geo-cache-v1';
    private readonly zoneCacheKey = 'zone-by-address-cache-v1';
    private readonly geocodeBounds = {
        north: 54.6,
        south: 54.2,
        east: 18.9,
        west: 18.2
    };
    private filterCache = {
        term: '',
        todayRef: null as Order[] | null,
        actualRef: null as Order[] | null,
        nextRef: null as Order[] | null,
        today: [] as Order[],
        actual: [] as Order[],
        next: [] as Order[]
    };
    private groupCache = {
        term: '',
        todayRef: null as Order[] | null,
        nextRef: null as Order[] | null,
        today: [] as Array<{ zoneId: number | null; label: string; orders: Order[] }>,
        next: [] as Array<{ zoneId: number | null; label: string; orders: Order[] }>
    };
    zonesEnabled = true;
    historyOrders: Order[] = [];
    historyDate = '';
    historyPage = 1;
    historyPageSize = 10;
    historyPageSizeOptions = [5, 10, 50, 100];
    historyTotal = 0;
    historyLoading = false;
    historyPlaceholders = [0, 1, 2];

    constructor(
        private authService: MamTaxiAuthService,
        private zone: NgZone,
        private geocodingService: GoogleGeocodingService,
        private zoneLookup: ZoneLookupService
    ) {
        this.loadCachesFromStorage();
    }

    /** 🔥 phone → list of externalIds to exclude */
    private buildPhonesPayload(orders: Order[]) {
        const map: { [phone: string]: number[] } = {};

        orders.forEach(order => {
            const phone = order.PhoneNumber;
            if (!phone) return;

            if (!map[phone]) map[phone] = [];
            map[phone].push(order.Id); // jeśli masz externalId w modelu to zmień
        });

        return map;
    }

    /** 🔥 Jeden BATCH request */
    private loadPhoneHistories(orders: Order[], preserveScroll = false) {
        const payload = this.buildPhonesPayload(orders);
        if (!Object.keys(payload).length) return;

        this.authService.getBatchPhoneHistory(payload).subscribe({
            next: (data) => {
                const scrollState = preserveScroll ? this.captureScrollState() : null;
                orders.forEach(order => {
                    const phone = order.PhoneNumber;
                    if (phone && data[phone]) {
                        order._lastOrders = data[phone];
                        this.lastOrdersById.set(order.Id, data[phone]);
                    }
                });
                if (preserveScroll && scrollState) {
                    this.pendingScrollRestore = { ...scrollState, attempts: 2 };
                    requestAnimationFrame(() => this.restoreScrollState(scrollState));
                }
            },
            error: err => console.error("Batch history error:", err)
        });
    }

    searchTerm: string = '';

    panelOpenState = {
        actual: false,
        today: false,
        next5days: false
    };

    updatePanelStates() {
        const hasSearch = this.searchTerm.trim().length > 0;

        this.panelOpenState.actual = hasSearch && this.filteredActualOrders.length > 0;
        this.panelOpenState.today = hasSearch && this.filteredTodayOrders.length > 0;
        this.panelOpenState.next5days = hasSearch && this.filteredOrdersForNext5Days.length > 0;

        this.invalidateFilterCaches();
    }


    get filteredActualOrders(): Order[] {
        return this.getFilteredOrders('actual');
    }

    get filteredTodayOrders(): Order[] {
        return this.getFilteredOrders('today');
    }

    get filteredOrdersForNext5Days(): Order[] {
        return this.getFilteredOrders('next');
    }

    get groupedTodayOrders() {
        return this.getGroupedOrders('today');
    }

    get groupedOrdersForNext5Days() {
        return this.getGroupedOrders('next');
    }

    private fieldsToSearch = [
        'City', 'Street', 'House', 'From', 'Destination',
        'PhoneNumber', 'TaxiNumber', 'CompanyName', 'Notes', 'Status'
    ];

    private filterOrders(orders: Order[]): Order[] {
        if (!this.searchTerm.trim()) return orders;

        const term = this.searchTerm.toLowerCase();

        return orders.filter(order =>
            this.fieldsToSearch.some(key => {
                const value = (order as any)[key];
                return value && value.toString().toLowerCase().includes(term);
            })
        );
    }

    private getFilteredOrders(kind: 'today' | 'actual' | 'next'): Order[] {
        const term = this.searchTerm.trim().toLowerCase();
        if (kind === 'today') {
            if (this.filterCache.term === term && this.filterCache.todayRef === this.todayOrders) {
                return this.filterCache.today;
            }
            const filtered = term ? this.filterOrders(this.todayOrders) : this.todayOrders;
            this.filterCache.term = term;
            this.filterCache.todayRef = this.todayOrders;
            this.filterCache.today = filtered;
            return filtered;
        }
        if (kind === 'actual') {
            if (this.filterCache.term === term && this.filterCache.actualRef === this.actualOrders) {
                return this.filterCache.actual;
            }
            const filtered = term ? this.filterOrders(this.actualOrders) : this.actualOrders;
            this.filterCache.term = term;
            this.filterCache.actualRef = this.actualOrders;
            this.filterCache.actual = filtered;
            return filtered;
        }
        if (this.filterCache.term === term && this.filterCache.nextRef === this.ordersForNext5Days) {
            return this.filterCache.next;
        }
        const filtered = term ? this.filterOrders(this.ordersForNext5Days) : this.ordersForNext5Days;
        this.filterCache.term = term;
        this.filterCache.nextRef = this.ordersForNext5Days;
        this.filterCache.next = filtered;
        return filtered;
    }

    private getGroupedOrders(kind: 'today' | 'next') {
        const term = this.searchTerm.trim().toLowerCase();
        if (kind === 'today') {
            if (this.groupCache.term === term && this.groupCache.todayRef === this.filterCache.today) {
                return this.groupCache.today;
            }
            const grouped = this.groupOrdersByZone(this.getFilteredOrders('today'));
            this.groupCache.term = term;
            this.groupCache.todayRef = this.filterCache.today;
            this.groupCache.today = grouped;
            return grouped;
        }

        if (this.groupCache.term === term && this.groupCache.nextRef === this.filterCache.next) {
            return this.groupCache.next;
        }
        const grouped = this.groupOrdersByZone(this.getFilteredOrders('next'));
        this.groupCache.term = term;
        this.groupCache.nextRef = this.filterCache.next;
        this.groupCache.next = grouped;
        return grouped;
    }

    private invalidateFilterCaches() {
        this.filterCache.term = '';
        this.filterCache.todayRef = null;
        this.filterCache.actualRef = null;
        this.filterCache.nextRef = null;
        this.groupCache.term = '';
        this.groupCache.todayRef = null;
        this.groupCache.nextRef = null;
    }

    ngOnInit(): void {
        if (this.zonesEnabled) {
            this.zoneLookup.ensureLoaded().then(() => {
                this.zoneLookupReady = true;
                this.assignZones([
                    ...this.todayOrders,
                    ...this.actualOrders,
                    ...this.ordersForNext5Days
                ]);
            });
        }
        this.startRealtime();
        this.startPollingFallback();

        this.authService.checkSession().subscribe({
            next: (valid: boolean) => {
                this.isAuthenticated = valid;
                this.sessionChecked = true;

                if (valid) {
                    this.import(5);
                }
            },
            error: () => {
                this.isAuthenticated = false;
                this.sessionChecked = true;
            }
        });

        this.reloadOrders(false, false);
        this.historyDate = this.getLocalDateInput();
        this.loadHistory(1);
    }

    formatDate(dateValue?: string | Date | { date?: string } | number): string {
        if (!dateValue) return 'brak';
        if (dateValue instanceof Date) {
            const iso = dateValue.toISOString();
            return iso.replace('T', ' ').substring(0, 16);
        }
        if (typeof dateValue === 'string') {
            return dateValue.replace('T', ' ').substring(0, 16);
        }
        if (typeof dateValue === 'number') {
            const iso = new Date(dateValue).toISOString();
            return iso.replace('T', ' ').substring(0, 16);
        }
        if (typeof dateValue === 'object' && dateValue.date) {
            return dateValue.date.replace('T', ' ').substring(0, 16);
        }
        return 'brak';
    }

    formatCreatedAt(dateStr?: string): string {
        return this.formatDate(dateStr);
    }

    confirmCancel(order: Order) {
        const confirmed = window.confirm('Czy na pewno chcesz anulować to zlecenie?');

        if (confirmed) {
            const payload = {
                InternalOrderId: order.Id,
                CorporationId: 124,
                StatusCode: 'Cancelled',
                ReasonCode: 8,
                ReasonMessage: null
            };

            this.authService.cancelOrder(payload).subscribe({
                next: () => alert('Zlecenie zostało anulowane.'),
                error: err => {
                    console.error('Błąd anulowania:', err);
                    alert('Wystąpił błąd.');
                }
            });
        }
    }

    clearSearch() {
        this.searchTerm = '';
        this.updatePanelStates();
    }

    onHistoryDateChange() {
        this.historyPage = 1;
        this.loadHistory(this.historyPage);
    }

    onHistoryPageSizeChange() {
        this.historyPage = 1;
        this.loadHistory(this.historyPage);
    }

    get historyTotalPages(): number {
        return Math.max(1, Math.ceil(this.historyTotal / this.historyPageSize));
    }

    goToHistoryPage(page: number) {
        const safePage = Math.min(Math.max(page, 1), this.historyTotalPages);
        if (safePage === this.historyPage) return;
        this.loadHistory(safePage);
    }

    import(howMany: number) {
        this.message = '';

        this.authService.importOrders(howMany).subscribe({
            next: () => {
                this.reloadOrders(true, true);
            },
            error: err => {
                console.error('Import error', err);
                this.isLoading = false;
                if (err.status === 401) {
                    this.isAuthenticated = false;
                    this.message = 'Sesja wygasła.';
                }
            }
        });
    }

    ngOnDestroy(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.realtimeReloadHandle) {
            clearTimeout(this.realtimeReloadHandle);
            this.realtimeReloadHandle = null;
        }
        if (this.pollingHandle) {
            clearInterval(this.pollingHandle);
            this.pollingHandle = null;
        }
    }

    ngAfterViewChecked(): void {
        if (!this.pendingScrollRestore) return;
        this.restoreScrollState(this.pendingScrollRestore);
        this.pendingScrollRestore.attempts -= 1;
        if (this.pendingScrollRestore.attempts <= 0) {
            this.pendingScrollRestore = null;
        }
    }

    private reloadOrders(setLoading = false, preserveScroll = false) {
        if (setLoading) {
            this.isLoading = true;
        }
        const scrollState = preserveScroll ? this.captureScrollState() : null;
        const previousHistory = new Map<number, Order[]>();
        [...this.todayOrders, ...this.actualOrders, ...this.ordersForNext5Days].forEach(order => {
            if (order._lastOrders && order._lastOrders.length > 0) {
                previousHistory.set(order.Id, order._lastOrders);
            }
        });

        this.authService.getOrdersSummary().subscribe({
            next: ({ today, actual, next5 }) => {
                const currentIds = new Set<number>();
                [...today, ...actual, ...next5].forEach(order => currentIds.add(order.Id));

                if (this.hasLoadedOnce) {
                    currentIds.forEach(id => {
                        if (!this.seenOrderIds.has(id)) {
                            this.markOrderAsNew(id);
                        }
                        this.seenOrderIds.add(id);
                    });
                } else {
                    this.hasLoadedOnce = true;
                    currentIds.forEach(id => this.seenOrderIds.add(id));
                }

                this.knownOrderIds = currentIds;
                this.todayOrders = this.sortScheduledOrders(today);
                this.actualOrders = this.sortActualOrders(actual);
                this.ordersForNext5Days = this.sortScheduledOrders(next5);
                this.invalidateFilterCaches();

                const allOrders = [
                    ...this.todayOrders,
                    ...this.actualOrders,
                    ...this.ordersForNext5Days
                ];

                allOrders.forEach(order => {
                    const cached = this.lastOrdersById.get(order.Id) || previousHistory.get(order.Id);
                    if (cached) {
                        order._lastOrders = cached;
                    }
                });

                // 🔥 wykonaj tylko JEDEN batch request dla nowych numerow
                const ordersMissingHistory = allOrders.filter(order =>
                    !this.lastOrdersById.has(order.Id) && !order._lastOrders
                );
                this.loadPhoneHistories(ordersMissingHistory, preserveScroll);

                if (this.zonesEnabled) {
                    this.assignZones(allOrders);
                }
                if (setLoading) {
                    this.isLoading = false;
                }
                if (preserveScroll && scrollState) {
                    this.pendingScrollRestore = { ...scrollState, attempts: 2 };
                    requestAnimationFrame(() => this.restoreScrollState(scrollState));
                }
            },
            error: err => {
                console.error("Error loading orders:", err);
                if (setLoading) {
                    this.isLoading = false;
                }
            }
        });
    }

    formatZone(zoneId?: number | null): string {
        if (zoneId === null || zoneId === undefined) return 'brak';
        return `Rejon ${zoneId}`;
    }

    isQuickPickup(order: Order): boolean {
        return !!order.From && order.From.toLowerCase().includes('szybka łapka');
    }

    private groupOrdersByZone(orders: Order[]) {
        const groups = new Map<string, { zoneId: number | null; label: string; orders: Order[]; earliestTs: number }>();

        orders.forEach(order => {
            const zoneId = order.Zone ?? null;
            const label = zoneId === null ? 'Rejon ?' : `Rejon ${zoneId}`;
            const key = zoneId === null ? 'unknown' : String(zoneId);

            if (!groups.has(key)) {
                groups.set(key, { zoneId, label, orders: [], earliestTs: Number.POSITIVE_INFINITY });
            }
            const group = groups.get(key)!;
            group.orders.push(order);
            const ts = this.getOrderTimestamp(order);
            if (ts < group.earliestTs) {
                group.earliestTs = ts;
            }
        });

        const result = Array.from(groups.values());
        result.sort((a, b) => {
            if (a.earliestTs !== b.earliestTs) return a.earliestTs - b.earliestTs;
            if (a.zoneId === null && b.zoneId !== null) return 1;
            if (a.zoneId !== null && b.zoneId === null) return -1;
            return (a.zoneId ?? 0) - (b.zoneId ?? 0);
        });
        return result;
    }

    private getOrderTimestamp(order: Order): number {
        const planned = order.PlannedArrivalDate ? this.parseDateValue(order.PlannedArrivalDate) : null;
        if (planned !== null) return planned;
        const created = order.CreatedAt ? this.parseDateValue(order.CreatedAt) : null;
        return created ?? Number.POSITIVE_INFINITY;
    }

    private parseDateValue(value: string | Date | { date?: string } | number): number | null {
        if (!value) return null;
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = Date.parse(value);
            return Number.isNaN(parsed) ? null : parsed;
        }
        if (typeof value === 'object' && value.date) {
            const parsed = Date.parse(value.date);
            return Number.isNaN(parsed) ? null : parsed;
        }
        return null;
    }

    private async assignZones(orders: Order[]) {
        if (!orders.length) return;
        if (!this.zoneLookupReady) {
            await this.zoneLookup.ensureLoaded();
            this.zoneLookupReady = true;
        }

        let queuedThisRun = 0;

        for (const order of orders) {
            if (this.orderZoneById.has(order.Id)) {
                order.Zone = this.orderZoneById.get(order.Id) ?? null;
                continue;
            }

            const address = this.buildPickupAddress(order);
            if (!address) {
                this.setOrderZone(order, null);
                continue;
            }

            if (this.addressZoneCache.has(address)) {
                this.setOrderZone(order, this.addressZoneCache.get(address) ?? null);
                continue;
            }

            if (this.pendingGeocodeAddresses.has(address)) continue;
            if (queuedThisRun >= this.maxGeocodePerRun) {
                this.scheduleDeferredAssign(orders);
                break;
            }

            this.pendingGeocodeAddresses.add(address);
            queuedThisRun += 1;

            this.enqueueGeocode(address).then(coords => {
                this.pendingGeocodeAddresses.delete(address);
                console.log('[ZoneLookup] geocode', { address, coords });
                if (!coords) {
                    this.addressZoneCache.set(address, null);
                    this.schedulePersistCaches();
                    this.setOrderZone(order, null);
                    return;
                }

                let zoneId = this.zoneLookup.getZoneForPoint(coords.lat, coords.lng);
                if (zoneId === null) {
                    zoneId = this.zoneLookup.getNearestZoneForPoint(coords.lat, coords.lng);
                }
                console.log('[ZoneLookup] match', { address, coords, zoneId });
                this.addressZoneCache.set(address, zoneId);
                this.schedulePersistCaches();
                this.setOrderZone(order, zoneId);
            });
        }
    }

    private setOrderZone(order: Order, zoneId: number | null) {
        this.orderZoneById.set(order.Id, zoneId);
        this.pendingZoneUpdates.set(order.Id, { order, zoneId });
        this.scheduleZoneFlush();
    }

    private scheduleZoneFlush() {
        if (this.zoneFlushHandle) return;
        this.zoneFlushHandle = setTimeout(() => {
            this.zoneFlushHandle = null;
            const updates = Array.from(this.pendingZoneUpdates.values());
            this.pendingZoneUpdates.clear();
            if (!updates.length) return;
            this.zone.run(() => {
                updates.forEach(({ order, zoneId }) => {
                    order.Zone = zoneId;
                });
            });
        }, 250);
    }

    private buildPickupAddress(order: Order): string {
        const from = (order.From || '').trim();
        const street = [order.Street, order.House].filter(Boolean).join(' ').trim();
        const city = (order.City || '').trim();

        let address = '';

        if (street && city) {
            address = `${street}, ${city}`;
        } else if (street) {
            address = street;
        } else {
            address = from;
        }

        if (city && address && !address.toLowerCase().includes(city.toLowerCase())) {
            address = `${address}, ${city}`;
        } else if (!address && city) {
            address = city;
        }

        return address;
    }

    private enqueueGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
        const cached = this.addressGeoCache.get(address);
        if (cached !== undefined) {
            return Promise.resolve(cached);
        }

        const existing = this.geocodePromises.get(address);
        if (existing) return existing;

        const promise = new Promise<{ lat: number; lng: number } | null>(resolve => {
            this.geocodeQueue.push({ address, resolve });
            this.processGeocodeQueue();
        });

        this.geocodePromises.set(address, promise);
        return promise;
    }

    private processGeocodeQueue() {
        if (this.geocodeInFlight >= this.geocodeConcurrency) return;

        while (this.geocodeInFlight < this.geocodeConcurrency && this.geocodeQueue.length > 0) {
            const job = this.geocodeQueue.shift();
            if (!job) return;

            this.geocodeInFlight += 1;
            this.geocodingService
                .geocodeAddress(job.address, { bounds: this.geocodeBounds, region: 'pl' })
                .then(coords => {
                    this.addressGeoCache.set(job.address, coords);
                    this.schedulePersistCaches();
                    job.resolve(coords);
                })
                .catch(() => {
                    this.addressGeoCache.set(job.address, null);
                    this.schedulePersistCaches();
                    job.resolve(null);
                })
                .finally(() => {
                    this.geocodeInFlight -= 1;
                    this.geocodePromises.delete(job.address);
                    setTimeout(() => this.processGeocodeQueue(), 0);
                });
        }
    }

    private scheduleDeferredAssign(orders: Order[]) {
        if (this.pendingAssignHandle) return;
        this.pendingAssignHandle = setTimeout(() => {
            this.pendingAssignHandle = null;
            this.assignZones(orders);
        }, 1000);
    }

    private loadCachesFromStorage() {
        try {
            const geoRaw = localStorage.getItem(this.geoCacheKey);
            if (geoRaw) {
                const parsed = JSON.parse(geoRaw) as Record<string, { lat: number; lng: number } | null>;
                Object.entries(parsed).forEach(([key, value]) => this.addressGeoCache.set(key, value));
            }
        } catch (err) {
            console.warn('[ZoneLookup] Failed to load geo cache', err);
        }

        try {
            const zoneRaw = localStorage.getItem(this.zoneCacheKey);
            if (zoneRaw) {
                const parsed = JSON.parse(zoneRaw) as Record<string, number | null>;
                Object.entries(parsed).forEach(([key, value]) => this.addressZoneCache.set(key, value));
            }
        } catch (err) {
            console.warn('[ZoneLookup] Failed to load zone cache', err);
        }
    }

    private schedulePersistCaches() {
        this.cacheDirty = true;
        if (this.persistHandle) return;
        this.persistHandle = setTimeout(() => {
            this.persistHandle = null;
            if (!this.cacheDirty) return;
            this.cacheDirty = false;
            try {
                const geoObj: Record<string, { lat: number; lng: number } | null> = {};
                for (const [key, value] of this.addressGeoCache.entries()) geoObj[key] = value;
                localStorage.setItem(this.geoCacheKey, JSON.stringify(geoObj));
            } catch {}

            try {
                const zoneObj: Record<string, number | null> = {};
                for (const [key, value] of this.addressZoneCache.entries()) zoneObj[key] = value;
                localStorage.setItem(this.zoneCacheKey, JSON.stringify(zoneObj));
            } catch {}
        }, 2000);
    }

    private loadHistory(page: number) {
        if (!this.historyDate) return;
        this.historyLoading = true;

        this.authService.getOrdersHistoryByDay(this.historyDate, page, this.historyPageSize).subscribe({
            next: response => {
                this.historyOrders = response.items || [];
                this.historyTotal = response.total || 0;
                this.historyPage = response.page || page;
            },
            error: err => {
                console.error('Error loading history:', err);
            },
            complete: () => {
                this.historyLoading = false;
            }
        });
    }

    private startRealtime() {
        if (this.eventSource) return;
        if (typeof EventSource === 'undefined') {
            console.warn('EventSource is not supported in this browser.');
            return;
        }

        this.eventSource = new EventSource(this.realtimeUrl);

        this.eventSource.addEventListener('orders_updated', () => {
            this.zone.run(() => this.scheduleRealtimeReload());
        });

        this.eventSource.onerror = () => {
            if (!this.eventSource) return;
            console.warn('SSE connection error. Browser will retry automatically.');
        };
    }

    private startPollingFallback() {
        if (this.pollingHandle) return;
        this.pollingHandle = setInterval(() => {
            this.reloadOrders(false, false);
        }, 2000);
    }

    private scheduleRealtimeReload() {
        if (this.realtimeReloadHandle) return;
        this.realtimeReloadHandle = setTimeout(() => {
            this.realtimeReloadHandle = null;
            this.reloadOrders(false, true);
        }, 500);
    }

    trackByOrderId(_index: number, order: Order): number {
        return order.Id;
    }

    isHistoryOpen(orderId: number): boolean {
        return this.historyOpenIds.has(orderId);
    }

    setHistoryOpen(orderId: number, open: boolean): void {
        if (open) {
            this.historyOpenIds.add(orderId);
        } else {
            this.historyOpenIds.delete(orderId);
        }
    }

    isNewOrder(orderId: number): boolean {
        return this.newOrderIds.has(orderId);
    }

    private markOrderAsNew(orderId: number): void {
        if (this.newOrderIds.has(orderId)) return;
        this.newOrderIds.add(orderId);
        setTimeout(() => this.newOrderIds.delete(orderId), 5000);
    }

    private captureScrollState(): { anchor: { id: number | null; offset: number }; scrollY: number } {
        return {
            anchor: this.captureScrollAnchor(),
            scrollY: window.scrollY
        };
    }

    private captureScrollAnchor(): { id: number | null; offset: number } {
        const elements = Array.from(
            document.querySelectorAll<HTMLElement>('.order-box[data-order-id]')
        );
        if (!elements.length) {
            return { id: null, offset: 0 };
        }

        const viewportHeight = window.innerHeight;
        let candidate: { el: HTMLElement; top: number } | null = null;

        for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > viewportHeight) continue;
            if (!candidate || rect.top < candidate.top) {
                candidate = { el, top: rect.top };
            }
        }

        if (!candidate) {
            const last = elements[elements.length - 1];
            const rect = last.getBoundingClientRect();
            return { id: this.getOrderIdFromElement(last), offset: rect.top };
        }

        return { id: this.getOrderIdFromElement(candidate.el), offset: candidate.top };
    }

    private restoreScrollState(state: { anchor: { id: number | null; offset: number }; scrollY: number }) {
        if (state.anchor.id == null) {
            window.scrollTo({ top: state.scrollY });
            return;
        }
        const el = document.querySelector<HTMLElement>(
            `.order-box[data-order-id="${state.anchor.id}"]`
        );
        if (!el) {
            window.scrollTo({ top: state.scrollY });
            return;
        }
        const rect = el.getBoundingClientRect();
        const delta = rect.top - state.anchor.offset;
        if (Math.abs(delta) < 1) return;
        window.scrollTo({ top: window.scrollY + delta });
    }

    private getOrderIdFromElement(el: HTMLElement): number | null {
        const value = el.dataset['orderId'];
        if (!value) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private getLocalDateInput(date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private sortActualOrders(orders: Order[]): Order[] {
        return orders.slice().sort((a, b) => {
            const aTime = this.toTime(a.CreatedAt, 0);
            const bTime = this.toTime(b.CreatedAt, 0);
            if (aTime !== bTime) return bTime - aTime;
            return b.Id - a.Id;
        });
    }

    private sortScheduledOrders(orders: Order[]): Order[] {
        return orders.slice().sort((a, b) => {
            const aTime = this.toTime(a.PlannedArrivalDate || a.CreatedAt, Number.POSITIVE_INFINITY);
            const bTime = this.toTime(b.PlannedArrivalDate || b.CreatedAt, Number.POSITIVE_INFINITY);
            if (aTime !== bTime) return aTime - bTime;
            return a.Id - b.Id;
        });
    }

    private toTime(
        value?: string | number | Date | { date?: string } | null,
        missing = 0
    ): number {
        if (value == null) return missing;
        if (typeof value === 'number') return Number.isFinite(value) ? value : missing;
        if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : missing;
        if (typeof value === 'object' && 'date' in value && value.date) {
            return this.toTime(value.date, missing);
        }
        if (typeof value !== 'string') return missing;

        const trimmed = value.trim();
        if (!trimmed) return missing;

        // Normalize common "YYYY-MM-DD HH:mm[:ss]" to ISO-like for reliable parsing.
        const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
        const time = Date.parse(normalized);
        return Number.isFinite(time) ? time : missing;
    }
}
