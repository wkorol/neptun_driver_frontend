import { Component } from '@angular/core';
import {MamTaxiAuthService} from "../services/mam-taxi-auth.service";
import { Order } from '../shared/order.model';
import {MatCard, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardHeader} from "@angular/material/card";
import {NgForOf, NgIf} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatButton} from "@angular/material/button";
import {LoginComponent} from "../login/login.component";
import {MamTaxiLoginComponent} from "../mam-taxi-login/mam-taxi-login.component";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
      MatExpansionPanelHeader,
    NgIf,
    NgForOf,
    MatProgressSpinner,
    MatButton,
    MamTaxiLoginComponent,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatAccordion
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

  ngOnInit(): void {
    this.authService.checkSession().subscribe({
      next: (valid: boolean) => {
        this.isAuthenticated = valid;
        this.sessionChecked = true;

        if (valid) {
          this.import(25);
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
    return dateStr ? new Date(dateStr).toLocaleString() : 'brak';
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
