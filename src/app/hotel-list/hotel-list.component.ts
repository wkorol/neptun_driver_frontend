import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {Hotel, HotelService} from '../hotel.service';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {NgForOf} from "@angular/common";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-hotel-list',
  templateUrl: './hotel-list.component.html',
  standalone: true,
  imports: [
    MatCard,
    MatCardSubtitle,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatLabel,
    NgForOf,
    MatFormField,
    MatInput,
    FormsModule
  ],
  styleUrls: ['./hotel-list.component.css']
})
export class HotelListComponent implements OnInit {
  hotels: Hotel[] = [];
  searchTerm: string = '';

  constructor(private hotelService: HotelService, private router: Router) {}

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.hotelService.getHotels().subscribe(
        (data) => {
          this.hotels = data;
        },
        (error) => {
          console.error('Error fetching hotels:', error);
        }
    );
  }

  viewHotelDetails(hotelId: string): void {
    this.router.navigate([`hotel/${hotelId}`]);
  }

  filteredHotels(): Hotel[] {
    if (!this.searchTerm) {
      return this.hotels;
    }
    return this.hotels.filter(hotel =>
        hotel.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
