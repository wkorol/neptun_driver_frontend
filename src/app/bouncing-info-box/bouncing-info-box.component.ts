import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-bouncing-info-box',
  templateUrl: './bouncing-info-box.component.html',
  styleUrls: ['./bouncing-info-box.component.scss'],
  standalone: true,
})
export class BouncingInfoBoxComponent implements OnInit {
  @Output() dismissed = new EventEmitter<void>();

  ngOnInit() {

  }

  openPdf() {
    window.open('walne.pdf', '_blank');
  }
}
