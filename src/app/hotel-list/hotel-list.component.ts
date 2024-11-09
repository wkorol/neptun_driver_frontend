import {Component, OnInit} from '@angular/core';
import {HotelService} from "../hotel.service";
import {CommonModule, NgFor, NgIf} from "@angular/common";
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle
} from "@angular/material/card";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription, MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardHeader, MatCardTitle, MatExpansionPanelHeader,  MatCardSubtitle, MatCardContent, MatAccordion, MatExpansionPanel, MatExpansionPanelTitle, MatExpansionPanelDescription, MatCardActions, MatButton],
  templateUrl: './hotel-list.component.html',
  styleUrl: './hotel-list.component.css'
})
export class HotelListComponent implements OnInit {
  hotels: any[] = [];

  constructor(private hotelService: HotelService) { }

  ngOnInit(): void {
    this.fetchHotels();
  }

  fetchHotels(): void {
    this.hotelService.getHotels().subscribe(
        (data) => this.hotels = data,
        (error) => console.error('Error fetching hotels', error)
    );
  }
}