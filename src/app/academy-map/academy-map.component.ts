import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
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

    @ViewChild('mapContent') mapContent!: ElementRef<HTMLDivElement>;

    // Zmienne do obsługi zoomu i przesuwania
    private scale: number = 2; // Skalowanie mapy (domyślny zoom)
    private startX: number = 0; // Pozycja startowa X podczas przesuwania
    private startY: number = 0; // Pozycja startowa Y podczas przesuwania
    private currentX: number = -200; // Aktualna pozycja X mapy
    private currentY: number = -150; // Aktualna pozycja Y mapy
    private isDragging: boolean = false; // Czy przesuwanie jest aktywne?

    showFullMap() {
        this.isMapModalVisible = true;

        // Automatyczny zoom i pozycja mapy
        setTimeout(() => {
            const mapElement = this.mapContent.nativeElement;
            mapElement.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.scale})`;
        });
    }

    closeFullMap() {
        this.isMapModalVisible = false;
        this.resetZoomAndPosition();
    }

    resetZoomAndPosition() {
        const mapElement = this.mapContent.nativeElement;
        this.scale = 1; // Resetuj skalowanie
        this.currentX = 0; // Resetuj pozycję X
        this.currentY = 0; // Resetuj pozycję Y
        mapElement.style.transform = `translate(0px, 0px) scale(1)`;
    }

    onTouchStart(event: TouchEvent) {
        if (event.touches.length === 1) {
            // Rozpocznij przesuwanie
            this.isDragging = true;
            this.startX = event.touches[0].clientX - this.currentX;
            this.startY = event.touches[0].clientY - this.currentY;
        }
    }

    onTouchMove(event: TouchEvent) {
        if (this.isDragging && event.touches.length === 1) {
            // Przesuwanie mapy
            const mapElement = this.mapContent.nativeElement;
            this.currentX = event.touches[0].clientX - this.startX;
            this.currentY = event.touches[0].clientY - this.startY;
            mapElement.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.scale})`;
        }
    }

    onTouchEnd() {
        this.isDragging = false; // Zakończ przesuwanie
    }
}