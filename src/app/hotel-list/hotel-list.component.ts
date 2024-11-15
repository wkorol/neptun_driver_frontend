// hotel-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Hotel, HotelService } from '../hotel-services/hotel.service';
import { SharedService } from '../shared/shared.service';
import {ActivatedRoute, Router} from "@angular/router";
import {SharedModule} from "../shared/shared.module";

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  templateUrl: './hotel-list.component.html',
  styleUrls: ['./hotel-list.component.css'],
  imports: [SharedModule]
})
export class HotelListComponent implements OnInit {
  hotels: Hotel[] = [];
  filteredHotels: Hotel[] = [];
  searchTerm: string = ''; // Track search term
  isLoading = true;

  constructor(
      private hotelService: HotelService,
      private sharedService: SharedService,
      private router: Router,
      private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Subscribe to search term changes without any navigation logic
    this.sharedService.currentSearchTerm.subscribe(term => {
      this.filteredHotels = term ? this.filterHotels(term) : this.hotels;
    });

    this.route.queryParams.subscribe(params => {
      const regionId = +params['regionId'];
      if (regionId) {
        this.getHotelsByRegion(regionId);
      } else {
        this.getHotels();
      }
    });
  }

  getHotels(): void {
    this.isLoading = true;
    this.hotelService.getHotels().subscribe({
      next: data => {
        this.hotels = data;
        this.filteredHotels = data;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error fetching hotels:', error);
        this.isLoading = false;
      }
    });
  }

  getHotelsByRegion(regionId: number): void {
    this.isLoading = true;
    this.hotelService.getHotelsByRegion(regionId).subscribe({
      next: data => {
        this.hotels = data;
        this.filteredHotels = data;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error fetching hotels by region:', error);
        this.isLoading = false;
      }
    });
  }

  viewHotelDetails(hotelId: string): void {
    if (!this.isLoading) { // Only navigate if data is loaded
      this.router.navigate([`hotel/${hotelId}`]);
    }
  }

  filterHotels(term: string): Hotel[] {
    if (!term) {
      return this.hotels;
    }
    return this.hotels.filter(hotel =>
        hotel.name.toLowerCase().includes(term.toLowerCase())
    );
  }

  get displayedHotels(): Hotel[] {
    return this.searchTerm ? this.filteredHotels : this.hotels;
  }
}




