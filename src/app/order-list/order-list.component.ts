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
    private readonly realtimeUrl = `${apiConfig.baseUrl}/api/orders/stream`;
    private historyOpenIds = new Set<number>();
    private knownOrderIds = new Set<number>();
    private seenOrderIds = new Set<number>();
    private newOrderIds = new Set<number>();
    private hasLoadedOnce = false;
    private lastOrdersById = new Map<number, Order[]>();
    private pendingScrollRestore: { anchor: { id: number | null; offset: number }; scrollY: number; attempts: number } | null = null;
    historyOrders: Order[] = [];
    historyDate = '';
    historyPage = 1;
    historyPageSize = 10;
    historyPageSizeOptions = [5, 10, 50, 100];
    historyTotal = 0;
    historyLoading = false;
    historyPlaceholders = [0, 1, 2];

    constructor(private authService: MamTaxiAuthService, private zone: NgZone) {}

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
    }

    get filteredActualOrders(): Order[] {
        return this.filterOrders(this.actualOrders);
    }

    get filteredTodayOrders(): Order[] {
        return this.filterOrders(this.todayOrders);
    }

    get filteredOrdersForNext5Days(): Order[] {
        return this.filterOrders(this.ordersForNext5Days);
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

    ngOnInit(): void {
        this.startRealtime();

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
            const aTime = this.toTime(a.CreatedAt);
            const bTime = this.toTime(b.CreatedAt);
            if (aTime !== bTime) return bTime - aTime;
            return a.Id - b.Id;
        });
    }

    private sortScheduledOrders(orders: Order[]): Order[] {
        return orders.slice().sort((a, b) => {
            const aTime = this.toTime(a.PlannedArrivalDate || a.CreatedAt);
            const bTime = this.toTime(b.PlannedArrivalDate || b.CreatedAt);
            if (aTime !== bTime) return aTime - bTime;
            return a.Id - b.Id;
        });
    }

    private toTime(value?: string): number {
        if (!value) return 0;
        const time = Date.parse(value);
        return Number.isFinite(time) ? time : 0;
    }
}
