import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-market-info',
  standalone: true,
  imports: [
    NgForOf,
    NgIf
  ],
  templateUrl: './market-info.component.html',
  styleUrl: './market-info.component.css'
})
export class MarketInfoComponent {
  imageSrc = 'zmiana-organizacji.png'; // lub inna ścieżka
  modalOpen = false;

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }
}
