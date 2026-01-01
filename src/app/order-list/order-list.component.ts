import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { FormsModule } from "@angular/forms";
import { forkJoin } from 'rxjs';

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
        FormsModule,
        MatButtonModule,
        MatIconModule,
        NgClass
    ],
    templateUrl: './order-list.component.html',
    styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit, OnDestroy {
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
    private newOrderIds = new Set<number>();
    private hasLoadedOnce = false;

    constructor(private authService: MamTaxiAuthService) {}

    /** 🔥 phone → list of externalIds to exclude */
    buildPhonesPayload() {
        const all = [
            ...this.todayOrders,
            ...this.actualOrders,
            ...this.ordersForNext5Days
        ];

        const map: { [phone: string]: number[] } = {};

        all.forEach(order => {
            const phone = order.PhoneNumber;
            if (!phone) return;

            if (!map[phone]) map[phone] = [];
            map[phone].push(order.Id); // jeśli masz externalId w modelu to zmień
        });

        return map;
    }

    /** 🔥 Jeden BATCH request */
    loadAllPhoneHistories() {
        const payload = this.buildPhonesPayload();
        if (!Object.keys(payload).length) return;

        this.authService.getBatchPhoneHistory(payload).subscribe({
            next: (data) => {
                const all = [
                    ...this.todayOrders,
                    ...this.actualOrders,
                    ...this.ordersForNext5Days
                ];

                all.forEach(order => {
                    const phone = order.PhoneNumber;
                    if (phone && data[phone]) {
                        order._lastOrders = data[phone];
                    }
                });
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
        this.authService.checkSession().subscribe({
            next: (valid: boolean) => {
                this.isAuthenticated = valid;
                this.sessionChecked = true;

                if (valid) {
                    this.import(5);
                    this.startRealtime();
                }
            },
            error: () => {
                this.isAuthenticated = false;
                this.sessionChecked = true;
            }
        });

        this.reloadOrders();
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return 'brak';
        return dateStr.replace('T', ' ').substring(0, 16);
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

    import(howMany: number) {
        this.isLoading = true;
        this.message = '';

        this.authService.importOrders(howMany).subscribe({
            next: () => {
                this.reloadOrders();
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

    private reloadOrders() {
        /** 🔥 Załaduj wszystkie listy równolegle */
        forkJoin([
            this.authService.getOrdersForToday(),
            this.authService.getActualOrders(),
            this.authService.getOrdersForNext5Days()
        ]).subscribe({
            next: ([today, actual, next5]) => {
                const currentIds = new Set<number>();
                [...today, ...actual, ...next5].forEach(order => currentIds.add(order.Id));

                if (this.hasLoadedOnce) {
                    currentIds.forEach(id => {
                        if (!this.knownOrderIds.has(id)) {
                            this.markOrderAsNew(id);
                        }
                    });
                } else {
                    this.hasLoadedOnce = true;
                }

                this.knownOrderIds = currentIds;
                this.todayOrders = today;
                this.actualOrders = actual;
                this.ordersForNext5Days = next5;

                // 🔥 wykonaj tylko JEDEN batch request
                this.loadAllPhoneHistories();
                this.isLoading = false;
            },
            error: err => {
                console.error("Error loading orders:", err);
                this.isLoading = false;
            }
        });
    }

    private startRealtime() {
        if (this.eventSource) return;
        if (typeof EventSource === 'undefined') {
            console.warn('EventSource is not supported in this browser.');
            return;
        }

        this.eventSource = new EventSource(this.realtimeUrl, { withCredentials: true });

        this.eventSource.addEventListener('orders_updated', () => {
            if (!this.isAuthenticated) return;
            this.scheduleRealtimeReload();
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
            this.reloadOrders();
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
}
