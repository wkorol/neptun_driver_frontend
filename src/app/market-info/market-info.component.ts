import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { ZoomableImageComponent } from '../components/zoomable-image/zoomable-image.component';

@Component({
  selector: 'app-market-info',
  standalone: true,
  imports: [NgIf, ZoomableImageComponent],
  templateUrl: './market-info.component.html',
  styleUrl: './market-info.component.css',
})
export class MarketInfoComponent {
  imageSrc = 'zmiana-organizacji.png';
  modalOpen = false;

  openModal(): void {
    this.modalOpen = true;
  }
}
