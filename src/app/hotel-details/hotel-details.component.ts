import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Hotel, HotelService} from '../hotel-services/hotel.service';
import {MatCard, MatCardContent} from "@angular/material/card";
import {JsonPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {MatButton} from "@angular/material/button";
import { Location } from '@angular/common';


@Component({
  selector: 'app-hotel-details',
  templateUrl: './hotel-details.component.html',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    NgForOf,
    NgIf,
    JsonPipe,
    MatButton,
    NgClass
  ],
  styleUrls: ['./hotel-details.component.css']
})
export class HotelDetailsComponent implements OnInit {
  hotelId: string | null = null;
  hotel: Hotel | null = null;
  lumpSums: any[] = [];

  constructor(
      private route: ActivatedRoute,
      private hotelService: HotelService,
      private location: Location
  ) {}

  ngOnInit(): void {
    this.hotelId = this.route.snapshot.paramMap.get('id')!;
    this.loadLumpSums();
  }

  loadLumpSums(): void {
    this.hotelService.getHotel(this.hotelId).subscribe(
        (data: Hotel) => {

          this.hotel = data;
          this.lumpSums = (data.lump_sums?.fixedValues || []).map((lumpSum: any) => ({
            ...lumpSum,
            expanded: false// Add an expanded property to each lump sum
          }));

          console.log(this.lumpSums);
        },
        (error) => {
          console.error('Error fetching lump sums:', error);
        }
    );
  }


  toggleLumpSum(lumpSum: any): void {
    lumpSum.expanded = !lumpSum.expanded; // Toggle the expanded state
  }

  goBack(): void {
    this.location.back();
  }
}
