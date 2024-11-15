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
  isLoading = true;


  constructor(
      private regionService: RegionService,
      private sharedService: SharedService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.isOnRegionRoute = this.router.url.includes('/');
    this.loadRegions();
    this.sharedService.currentSearchTerm.subscribe(term => {
      if (term) {
        this.router.navigate(['/hotel']);
      } else if (this.isOnRegionRoute) {
        this.router.navigate(['/']);
      }
    });
  }

  loadRegions(): void {
    this.isLoading = true;
    this.regionService.getRegionList().subscribe({
      next: data => {
        this.regions = data;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error fetching regions:', error);
        this.isLoading = false;
      }
    });
  }

  viewHotelsByRegion(regionId: number): void {
    if (!this.isLoading) { // Only navigate if data is loaded
      this.router.navigate(['hotel'], { queryParams: { regionId: regionId } });
    }
  }
}
