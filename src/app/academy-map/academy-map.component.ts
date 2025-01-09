import {Component, HostListener} from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-academy-map',
  standalone: true,
    imports: [
        NgIf
    ],
  templateUrl: './academy-map.component.html',
  styleUrl: './academy-map.component.css'
})
export class AcademyMapComponent {
    isMapModalVisible: boolean = false;
    isMobile: boolean = false;

    // Słuchaj zmiany rozmiaru okna
    @HostListener('window:resize', [])
    onResize() {
        this.isMobile = window.innerWidth <= 768;
    }

    constructor() {
        this.onResize(); // Ustaw początkowy stan
    }

    showFullMap() {
        this.isMapModalVisible = true;
    }

    closeFullMap() {
        this.isMapModalVisible = false;
    }
}
