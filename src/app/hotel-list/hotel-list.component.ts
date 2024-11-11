import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {Hotel, HotelService} from '../hotel.service';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {NgForOf} from "@angular/common";

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
    NgForOf
  ],
  styleUrls: ['./hotel-list.component.css']
})
export class HotelListComponent implements OnInit {
  hotels: Hotel[] = [];

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
}
