import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Hotel, HotelService } from '../hotel-services/hotel.service';
import {Location, NgClass, NgForOf, NgIf} from '@angular/common';
import {MatCard, MatCardContent} from "@angular/material/card";
import {MatButton} from "@angular/material/button";
import {MatButtonToggle, MatButtonToggleGroup} from "@angular/material/button-toggle";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-hotel-details',
  templateUrl: './hotel-details.component.html',
  standalone: true,
  imports: [
    MatCard,
    NgForOf,
    NgClass,
    MatCardContent,
    MatButton,
    NgIf,
    MatButtonToggle,
    MatButtonToggleGroup,
    FormsModule,
    // Angular Material and Common Modules
  ],
  styleUrls: ['./hotel-details.component.css']
})
export class HotelDetailsComponent implements OnInit {
  hotelId: string | null = null;
  hotel: Hotel | null = null;
  lumpSums: any[] = [];
  showBusPrices: boolean = false; // Toggle between Osobowy and Bus for all

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
          this.lumpSums = data.lump_sums?.fixedValues || [];
        },
        (error) => {
          console.error('Error fetching lump sums:', error);
        }
    );
  }

  toggleAllPrices(): void {
    this.showBusPrices = !this.showBusPrices;
  }

  goBack(): void {
    this.location.back();
  }
}
