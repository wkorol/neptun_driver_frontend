import { Component } from '@angular/core';
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

    showFullMap() {
        this.isMapModalVisible = true;
    }

    closeFullMap() {
        this.isMapModalVisible = false;
    }
}
