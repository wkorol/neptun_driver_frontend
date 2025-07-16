import { Component, HostListener } from '@angular/core';
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-market-info',
  standalone: true,
  imports: [
    NgIf,
    FormsModule
  ],
  templateUrl: './market-info.component.html',
  styleUrl: './market-info.component.css'
})
export class MarketInfoComponent {
  imageSrc = 'zmiana-organizacji.png';
  modalOpen = false;
  zoomLevel = 1;

  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  translateX = 0;
  translateY = 0;

  openModal(): void {
    this.modalOpen = true;
    this.zoomLevel = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel = parseFloat((this.zoomLevel + 0.1).toFixed(1));
      this.centerImage();
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 1) {
      this.zoomLevel = parseFloat((this.zoomLevel - 0.1).toFixed(1));
      if (this.zoomLevel === 1) {
        this.translateX = 0;
        this.translateY = 0;
      } else {
        this.centerImage();
      }
    }
  }

  centerImage(): void {
    const wrapper = document.querySelector('.modal-image-wrapper') as HTMLElement;
    const image = document.querySelector('.modal-image') as HTMLImageElement;

    if (!wrapper || !image) return;

    const wrapperRect = wrapper.getBoundingClientRect();

    // Ustal proporcje dopasowanego obrazka
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const wrapperWidth = wrapperRect.width;
    const wrapperHeight = wrapperRect.height;

    const imageAspect = naturalWidth / naturalHeight;
    const wrapperAspect = wrapperWidth / wrapperHeight;

    let fittedWidth: number, fittedHeight: number;

    if (imageAspect > wrapperAspect) {
      // Dopasowujemy szerokość
      fittedWidth = wrapperWidth;
      fittedHeight = wrapperWidth / imageAspect;
    } else {
      // Dopasowujemy wysokość
      fittedHeight = wrapperHeight;
      fittedWidth = wrapperHeight * imageAspect;
    }

    // Powiększone rozmiary
    const scaledWidth = fittedWidth * this.zoomLevel;
    const scaledHeight = fittedHeight * this.zoomLevel;

    // Centrowanie
    this.translateX = (wrapperWidth - scaledWidth) / 2;
    this.translateY = (wrapperHeight - scaledHeight) / 2;
  }



  startDrag(event: MouseEvent): void {
    if (this.zoomLevel <= 1) return;
    this.isDragging = true;
    this.dragStartX = event.clientX - this.translateX;
    this.dragStartY = event.clientY - this.translateY;
  }

  onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.translateX = event.clientX - this.dragStartX;
    this.translateY = event.clientY - this.dragStartY;
  }

  endDrag(): void {
    this.isDragging = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(): void {
    if (this.modalOpen) {
      this.closeModal();
    }
  }

  getTransform(): string {
    if (this.zoomLevel === 1) {
      return `translate(0px, 0px)`; // brak skalowania, brak przesunięcia
    }
    return `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
  }
}
