import { Component, OnDestroy, OnInit } from '@angular/core';
import { Hotel, HotelService } from '../hotel-services/hotel.service';
import { SharedService } from '../shared/shared.service';
import { ActivatedRoute, Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import {Location, NgForOf, NgIf} from "@angular/common";
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  templateUrl: './hotel-list.component.html',
  imports: [
    NgIf,
    MatCard,
    MatCardHeader,
    MatCardContent,
    NgForOf,
    MatCardTitle,
    MatCardSubtitle,
    MatButton
  ],
  styleUrls: ['./hotel-list.component.css']
})
export class HotelListComponent implements OnInit, OnDestroy {
  hotels: Hotel[] = [];
  filteredHotels: Hotel[] = [];
  displayedHotels: Hotel[] = [];
  searchTerm: string = '';
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
      private hotelService: HotelService,
      private sharedService: SharedService,
      private router: Router,
      private route: ActivatedRoute,
      private location: Location
  ) {}

  ngOnInit(): void {
    this.sharedService.currentSearchTerm.pipe(
        takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.filteredHotels = this.filterHotels(term);
      this.updateDisplayedHotels();
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
        if (!this.searchTerm) {
          this.updateDisplayedHotels();
        }
        this.isLoading = false;
      },
      error: error => {
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
        if (!this.searchTerm) {
          this.updateDisplayedHotels();
        }
        this.isLoading = false;
      },
      error: error => {
        this.isLoading = false;
      }
    });
  }

  viewHotelDetails(hotelId: string): void {
    if (!this.isLoading) {
      this.router.navigate([`hotel/${hotelId}`]);
    }
  }

  filterHotels(term: string): Hotel[] {
    if (!term) {
      return this.hotels;
    }

    const filtered = this.hotels.filter(hotel =>
        hotel.name.toLowerCase().includes(term.toLowerCase())
    );

    console.log('Filtered Hotels:', filtered);
    return filtered.length > 0 ? filtered : [];
  }

  updateDisplayedHotels(): void {
    this.displayedHotels = this.searchTerm ? this.filteredHotels : this.hotels;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.location.back();
  }
}
