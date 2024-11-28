import { Component, OnInit, OnDestroy } from '@angular/core';
import { RegionService } from '../region-service/region.service';
import { Region } from '../region-service/region.service';
import { SharedModule } from "../shared/shared.module";
import {Route, Router} from "@angular/router";
import {BouncingInfoBoxComponent} from "../bouncing-info-box/bouncing-info-box.component";

@Component({
  selector: 'app-region',
  standalone: true,
  templateUrl: './region.component.html',
  styleUrls: ['./region.component.css'],
    imports: [SharedModule, BouncingInfoBoxComponent]
})
export class RegionComponent implements OnInit {
  regions: Region[] | null = null;
  isLoading = true;


  constructor(private regionService: RegionService, private router: Router) {}

  ngOnInit(): void {
    this.loadRegions();
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
