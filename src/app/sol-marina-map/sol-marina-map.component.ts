import { Component } from '@angular/core';
import {NgIf} from "@angular/common";
import {ZoomableImageComponent} from "../components/zoomable-image/zoomable-image.component";

@Component({
  selector: 'app-sol-marina-map',
  standalone: true,
    imports: [
        NgIf,
        ZoomableImageComponent
    ],
  templateUrl: './sol-marina-map.component.html',
  styleUrl: './sol-marina-map.component.css'
})
export class SolMarinaMapComponent {
    imageSrc = 'mapa_sol.jpeg';
    modalOpen = false;

    openModal(): void {
        this.modalOpen = true;
    }
}
