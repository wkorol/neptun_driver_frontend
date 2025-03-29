import { Component } from '@angular/core';
import {MamTaxiAuthService} from "../services/mam-taxi-auth.service";
import { Order } from '../shared/order.model';
import {MatCard, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardHeader} from "@angular/material/card";
import {NgForOf, NgIf} from "@angular/common";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatButton} from "@angular/material/button";
import {LoginComponent} from "../login/login.component";
import {MamTaxiLoginComponent} from "../mam-taxi-login/mam-taxi-login.component";

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    NgIf,
    NgForOf,
    MatCardHeader,
    MatCardContent,
    MatProgressSpinner,
    MatButton,
    LoginComponent,
    MamTaxiLoginComponent
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent {
  orders: Order[] = [];
  isLoading = false;
  message = '';
  constructor(private authService: MamTaxiAuthService) {}

  ngOnInit(): void {
    this.authService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Błąd podczas pobierania zamówień:', err);
        this.isLoading = false;
      }
    });
  }

  formatDate(dateStr?: string): string {
    return dateStr ? new Date(dateStr).toLocaleString() : 'brak';
  }

  import(howMany: number) {
    this.isLoading = true;
    this.message = '';
    this.authService.importOrders(howMany).subscribe({
      next: () => {
        this.authService.getOrders().subscribe((orders) => {
          this.orders = orders;
          this.isLoading = false;
        });
      },
      error: (err) => {
        console.error('Import error', err);
        this.isLoading = false;
      }
    });
  }
}
