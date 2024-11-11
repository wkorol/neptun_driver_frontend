// region.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegionService } from '../region-service/region.service';
import { SharedService } from '../shared/shared.service';
import { Region } from '../region-service/region.service';
import {SharedModule} from "../shared/shared.module";

@Component({
  selector: 'app-region',
  standalone: true,
  templateUrl: './region.component.html',
  styleUrls: ['./region.component.css'],
  imports: [SharedModule]
})
export class RegionComponent implements OnInit {
  regions: Region[] | null = null;
  private isOnRegionRoute = false;

  constructor(
      private regionService: RegionService,
      private sharedService: SharedService,
      private router: Router
  ) {}

  ngOnInit(): void {
    // Set a flag to detect if we're currently on the /regions route
    this.isOnRegionRoute = this.router.url.includes('/');

    // Load regions initially
    this.loadRegions();

    // Subscribe to search term changes
    this.sharedService.currentSearchTerm.subscribe(term => {
      if (term) {
        // Navigate to HotelListComponent (e.g., `/`) when search term is present
        this.router.navigate(['/hotel']);
      } else if (this.isOnRegionRoute) {
        // Only navigate back to `/regions` if we were initially on the `/regions` route
        this.router.navigate(['/']);
      }
    });
  }

  loadRegions(): void {
    this.regionService.getRegionList().subscribe({
      next: data => this.regions = data,
      error: error => console.error('Error fetching regions:', error)
    });
  }

  viewHotelsByRegion(regionId: number): void {
    // Navigate to /hotel with regionId as a query parameter
    this.router.navigate(['/hotel'], { queryParams: { regionId: regionId } });
  }
}
