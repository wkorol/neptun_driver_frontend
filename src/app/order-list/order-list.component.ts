import { Component } from '@angular/core';
import {MamTaxiAuthService} from "../services/mam-taxi-auth.service";
import { Order } from '../shared/order.model';
import {NgClass, NgForOf, NgIf} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatButton} from "@angular/material/button";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";

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
export class OrderListComponent {
  todayOrders: Order[] = [];
  actualOrders: Order[] = [];
  ordersForNext5Days: Order[] = [];
  isLoading = false;
  message = '';
  isAuthenticated = false;
  sessionChecked = false;


  constructor(private authService: MamTaxiAuthService) {}

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
        }
      },
      error: () => {
        this.isAuthenticated = false;
        this.sessionChecked = true;
      }
    });
    this.loadTodayOrders();
    this.loadActualOrders();
    this.loadOrdersForNext5Days();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'brak';

    // Remove timezone offset if present, just for consistent substring
    const clean = dateStr.replace('T', ' ').substring(0, 16);
    return clean;
  }

  confirmCancel(order: Order) {
    const confirmed = window.confirm('Czy na pewno chcesz anulować to zlecenie?');

    if (confirmed) {
      const payload = {
        InternalOrderId: order.Id, // czyli internalExternalId
        CorporationId: 124,
        StatusCode: 'Cancelled',
        ReasonCode: 8, // możesz to zmieniać w zależności od sytuacji
        ReasonMessage: null
      };

      this.authService.cancelOrder(payload).subscribe({
        next: () => {
          alert('Zlecenie zostało pomyślnie anulowane.');
        },
        error: (err) => {
          console.error('Błąd anulowania zlecenia:', err);
          alert('Wystąpił błąd podczas anulowania zlecenia.');
        }
      });
    }
  }


  loadTodayOrders() {
    this.authService.getOrdersForToday().subscribe({
      next: (orders) => this.todayOrders = orders,
      error: (err) => console.error('Błąd podczas pobierania zamówień na dziś:', err)
    });
  }

  loadOrdersForNext5Days() {
    this.authService.getOrdersForNext5Days().subscribe({
      next: (orders) => this.ordersForNext5Days = orders,
      error: (err) => console.error('Błąd podczas pobierania zamówień na 5 dni w przód:', err)
    });
  }

  loadActualOrders() {
    this.authService.getActualOrders().subscribe({
      next: (orders) => this.actualOrders = orders,
      error: (err) => console.error('Błąd podczas pobierania aktualnych zamówień:', err)
    });
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
        this.loadTodayOrders();
        this.loadActualOrders();
        this.loadOrdersForNext5Days()
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Import error', err);
        this.isLoading = false;

        if (err.status === 401) {
          this.isAuthenticated = false;
          this.message = 'Sesja wygasła. Zaloguj się ponownie.';
        }
      }
    });
  }
}
