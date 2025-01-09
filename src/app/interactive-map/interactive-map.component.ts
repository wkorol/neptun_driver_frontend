import { Component } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-interactive-map',
  templateUrl: './interactive-map.component.html',
  standalone: true,
  imports: [
    NgForOf,
    NgIf
  ],
  styleUrl: './interactive-map.component.css'
})
export class InteractiveMapComponent {
  // List of regions with labels and descriptions
  regions = [
    { label: 'DN', description: 'Prezes Zarządu' },
    { label: 'B1', description: 'Brama nr 1' },
    { label: 'B2', description: 'Brama nr 2' },
    { label: 'WR', description: 'Kierownicy Projektów' },
    { label: 'WD', description: 'Główny Dyspozytor' },
    { label: 'NB', description: 'Dział BHP' },
    { label: 'ZS', description: 'Zespół ds. Ochrony Stoczni' },
    { label: 'TJ', description: 'Biuro Kontroli Jakości' },
    { label: 'WK', description: 'Szefostwo Kooperacji' },
    { label: 'W1/1', description: 'Wydział Siłowni Okrętowych I' },
    { label: 'W1/2', description: 'Wydział Siłowni Okrętowych II' },
    { label: 'W5', description: 'Zespół Prac Rurarskich' },
    { label: 'W7/1', description: 'Wydział Przygotowania Produkcji' },
    { label: 'W7/2', description: 'Zespół Prac Stalowych' },
    { label: 'W7/3', description: 'Zespół Prac Stalowych' },
    { label: 'W9', description: 'Zespół Prac Elektrycznych' },
    { label: 'W11', description: 'Wydział Obsługi i Dokowania Statków' },
    { label: 'W14', description: 'Zespół Prac Wyposażeniowych' },
  ];

  showScrollIndicator = true;

  // Show/hide scroll indicator based on scroll position
  onScroll(container: HTMLElement): void {
    const isAtBottom =
        container.scrollHeight - container.scrollTop === container.clientHeight;

    this.showScrollIndicator = !isAtBottom || container.scrollTop === 0;
  }
}