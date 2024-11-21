import { Component, OnInit } from '@angular/core';
import { AdminPanelService } from './admin-panel.service';

import {NgForOf} from "@angular/common";
import {Hotel} from "../hotel-services/hotel.service";
import {LumpSum} from "../shared/lump-sums.model";
import {Region, RegionService} from "../region-service/region.service";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {FixedValue} from "../shared/fixed-value.model";
import {Router} from "@angular/router";
import {MatCard, MatCardContent, MatCardTitle} from "@angular/material/card";

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  standalone: true,
  imports: [
    NgForOf,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    FormsModule,
    MatButton,
    MatLabel,
    MatCard,
    MatCardTitle,
    MatCardContent
  ],
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  hotels: Hotel[] = [];
  lumpSums: LumpSum[] = [];
  regions: Region[] = [];

  newHotelName = '';
  selectedRegionId: number | null = null;
  selectedLumpSumsId: string | null = null;

  // LumpSum Form fields
  newLumpSumName = '';
  fixedValues: FixedValue[] = [];


  newRegionId: number | undefined;
  newRegionName: string | undefined;

  constructor(private adminPanelService: AdminPanelService, private router: Router, private regionService: RegionService) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.adminPanelService.getHotels().subscribe(hotels => (this.hotels = hotels));
    this.adminPanelService.getLumpSums().subscribe(lumpSums => (this.lumpSums = lumpSums));
    this.adminPanelService.getRegions().subscribe(regions => (this.regions = regions));
  }

  addRegion() {
    const newRegion = { id: this.newRegionId, name: this.newRegionName };
    this.regionService.addRegion(newRegion).subscribe(response => {
      // Handle success, e.g., clear inputs and refresh region list
      this.newRegionId = 0;
      this.newRegionName = '';
      this.loadRegions(); // Assuming you have a method to refresh the regions list
    });
  }

  loadRegions(): void
  {
     this.regionService.getRegionList().subscribe(regions => {
       this.regions = regions;
     })
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  addHotel(): void {
    if (this.selectedRegionId && this.selectedLumpSumsId && this.newHotelName) {
      const newHotel = {
        regionId: this.selectedRegionId,
        lumpSumsId: this.selectedLumpSumsId,
        name: this.newHotelName
      };

      this.adminPanelService.addHotel(newHotel).subscribe({
        next: () => {
          alert('Hotel added successfully!');
          this.fetchData(); // Refresh hotel list
          this.resetForm();
        },
        error: (error) => {
          console.error('Error adding hotel:', error);
          alert('Failed to add hotel.');
        }
      });
    } else {
      alert('Please fill in all fields.');
    }
  }


  showAlert() {
    alert('W trakcie programowania');
  }

  addFixedValue(): void {
    this.fixedValues.push({
      name: '',
      tariff1: { tariffType: 1, carValue: 0, busValue: 0 },
      tariff2: { tariffType: 2, carValue: 0, busValue: 0 }
    });
  }

  removeFixedValue(index: number): void {
    this.fixedValues.splice(index, 1);
  }

  addLumpSum(): void {
    const newLumpSum: LumpSum = {
      name: this.newLumpSumName,
      fixedValues: this.fixedValues
    };

    this.adminPanelService.addLumpSum(newLumpSum).subscribe({
      next: () => {
        alert('Lump Sum added successfully!');
        this.fetchData(); // Refresh lump sum list
        this.resetLumpSumForm();
      },
      error: (error) => {
        console.error('Error adding lump sum:', error);
        alert('Failed to add lump sum.');
      }
    });
  }



  resetForm(): void {
    this.newHotelName = '';
    this.selectedRegionId = null;
    this.selectedLumpSumsId = null;
  }

  resetLumpSumForm(): void {
    this.newLumpSumName = '';
    this.fixedValues = [
      { name: '', tariff1: { tariffType: 1, carValue: 0, busValue: 0 }, tariff2: { tariffType: 2, carValue: 0, busValue: 0 } }
    ];
  }

  goToEditHotel(hotelId: string): void {
    this.router.navigate([`/hotel/${hotelId}/edit`]);
  }
}
