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
export class AcademyMapComponent implements AfterViewInit {
    isMapModalVisible: boolean = false;

    @ViewChild('mapContent') mapContent!: ElementRef<HTMLDivElement>;

    // Zmienne dla obsługi zoomu i przesuwania
    private scale: number = 1;
    private startX: number = 0;
    private startY: number = 0;
    private currentX: number = 0;
    private currentY: number = 0;
    private isDragging: boolean = false;
    private previousDistance: number | null = null;

    ngAfterViewInit() {
        // Nic do inicjalizacji na start
    }

    showFullMap() {
        this.isMapModalVisible = true;
        this.resetZoomAndPosition();

        // Automatyczny zoom dla widoku mobilnego
        if (window.innerWidth <= 768) {
            this.scale = 2; // Ustaw zoom na wartość 2x
            const mapElement = this.mapContent.nativeElement;
            mapElement.style.transform = `translate(0px, 0px) scale(${this.scale})`;
        }
    }

    closeFullMap() {
        this.isMapModalVisible = false;
    }

    resetZoomAndPosition() {
        const mapElement = this.mapContent.nativeElement;
        this.scale = 1;
        this.currentX = 0;
        this.currentY = 0;
        mapElement.style.transform = `translate(0px, 0px) scale(1)`;
    }

    onTouchStart(event: TouchEvent) {
        if (event.touches.length === 1) {
            // Start dragging
            this.isDragging = true;
            this.startX = event.touches[0].clientX - this.currentX;
            this.startY = event.touches[0].clientY - this.currentY;
        }
    }

    onTouchMove(event: TouchEvent) {
        const mapElement = this.mapContent.nativeElement;

        if (event.touches.length === 1 && this.isDragging) {
            // Dragging
            this.currentX = event.touches[0].clientX - this.startX;
            this.currentY = event.touches[0].clientY - this.startY;
            mapElement.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.scale})`;
        } else if (event.touches.length === 2) {
            // Pinch-to-zoom
            event.preventDefault();
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            if (this.previousDistance === null) {
                this.previousDistance = distance;
                return;
            }

            const scaleChange = distance / this.previousDistance;
            this.scale = Math.min(Math.max(this.scale * scaleChange, 1), 3); // Limit zoom between 1 and 3
            mapElement.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.scale})`;

            this.previousDistance = distance;
        }
    }

    onTouchEnd() {
        this.isDragging = false;
        this.previousDistance = null; // Reset distance after touch ends
    }
}