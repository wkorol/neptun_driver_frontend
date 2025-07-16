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

  set zoomLevel(value: number) {
    const clamped = Math.max(1, Math.min(3, value));
    if (this._zoomLevel === 1 && clamped > 1) {
      this.centerOnFirstZoom(clamped);
    } else {
      this._zoomLevel = clamped;
    }
  }
  get zoomLevel(): number {
    return this._zoomLevel;
  }
  private _zoomLevel = 1;

  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  translateX = 0;
  translateY = 0;

  initialPinchDistance = 0;
  initialZoomLevel = 1;

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
    if (this.zoomLevel >= 3) return;

    const newZoom = parseFloat((this.zoomLevel + 0.1).toFixed(2));

    if (this.zoomLevel === 1 && newZoom > 1) {
      this.centerOnFirstZoom(newZoom);
    } else {
      this.zoomLevel = newZoom;
    }
  }


  zoomOut(): void {
    if (this.zoomLevel <= 1) return;

    const newZoom = parseFloat((this.zoomLevel - 0.1).toFixed(2));
    if (newZoom < 1) {
      this.zoomLevel = 1;
      this.translateX = 0;
      this.translateY = 0;
      return;
    }

    const wrapper = document.querySelector('.modal-image-wrapper')?.getBoundingClientRect();
    if (!wrapper) return;

    const originX = wrapper.width / 2;
    const originY = wrapper.height / 2;

    const ratio = newZoom / this.zoomLevel;
    this.translateX = originX - (originX - this.translateX) * ratio;
    this.translateY = originY - (originY - this.translateY) * ratio;

    this.zoomLevel = newZoom;
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

  startTouch(event: TouchEvent): void {
    if (this.zoomLevel <= 1) return;
    this.isDragging = true;
    const touch = event.touches[0];
    this.dragStartX = touch.clientX - this.translateX;
    this.dragStartY = touch.clientY - this.translateY;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || this.zoomLevel <= 1) return;
    const touch = event.touches[0];
    this.translateX = touch.clientX - this.dragStartX;
    this.translateY = touch.clientY - this.dragStartY;
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // pojedynczy palec — drag
      this.startTouch(event);
    } else if (event.touches.length === 2) {
      // gest pinch
      const distance = this.getPinchDistance(event);
      this.initialPinchDistance = distance;
      this.initialZoomLevel = this.zoomLevel;
    }
  }

  centerOnFirstZoom(newZoom: number): void {
    const wrapper = document.querySelector('.modal-image-wrapper')?.getBoundingClientRect();
    const image = document.querySelector('.modal-image') as HTMLImageElement;
    if (!wrapper || !image) return;

    // Wyliczamy aktualne dopasowanie (contain)
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const aspectImage = naturalWidth / naturalHeight;
    const aspectWrapper = wrapper.width / wrapper.height;

    let fittedWidth, fittedHeight;

    if (aspectImage > aspectWrapper) {
      fittedWidth = wrapper.width;
      fittedHeight = wrapper.width / aspectImage;
    } else {
      fittedHeight = wrapper.height;
      fittedWidth = wrapper.height * aspectImage;
    }

    const scaledWidth = fittedWidth * newZoom;
    const scaledHeight = fittedHeight * newZoom;

    this.translateX = (wrapper.width - scaledWidth) / 2;
    this.translateY = (wrapper.height - scaledHeight) / 2;
    this._zoomLevel = newZoom;
  }


  onTouchMovePinch(event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    const touches = Array.from(event.touches);
    const [touch1, touch2] = touches;
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    const wrapper = document.querySelector('.modal-image-wrapper')?.getBoundingClientRect();
    if (!wrapper) return;

    const originX = centerX - wrapper.left;
    const originY = centerY - wrapper.top;

    const newDistance = this.getPinchDistance(event);
    const scaleChange = newDistance / this.initialPinchDistance;
    const newZoom = this.initialZoomLevel * scaleChange;

    const clampedZoom = Math.min(3, Math.max(1, parseFloat(newZoom.toFixed(2))));
    if (clampedZoom === this.zoomLevel) return;

    // Adjust translateX/Y so the center of the pinch stays fixed
    const ratio = clampedZoom / this.zoomLevel;
    this.translateX = originX - (originX - this.translateX) * ratio;
    this.translateY = originY - (originY - this.translateY) * ratio;
    this.zoomLevel = clampedZoom;

    event.preventDefault();
  }


  onWheelZoom(event: WheelEvent): void {
    if (!event.ctrlKey && event.deltaY !== 0) {
      event.preventDefault();

      const wrapper = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const originX = event.clientX - wrapper.left;
      const originY = event.clientY - wrapper.top;

      const zoomDirection = event.deltaY < 0 ? 1 : -1;
      const zoomFactor = 0.1;
      const newZoom = Math.min(3, Math.max(1, this.zoomLevel + zoomDirection * zoomFactor));

      if (newZoom === this.zoomLevel) return;

      // przeliczenie przesunięcia tak, by punkt (originX, originY) pozostał w miejscu
      const scaleChange = newZoom / this.zoomLevel;

      this.translateX = originX - (originX - this.translateX) * scaleChange;
      this.translateY = originY - (originY - this.translateY) * scaleChange;
      this.zoomLevel = parseFloat(newZoom.toFixed(2));
    }
  }


  getPinchDistance(event: TouchEvent): number {
    const touches = Array.from(event.touches);
    if (touches.length < 2) return 0;

    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;

    return Math.sqrt(dx * dx + dy * dy);
  }
}
