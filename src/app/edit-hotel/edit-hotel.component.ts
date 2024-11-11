import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {Hotel, HotelService} from "../hotel-services/hotel.service";
import {LumpSum} from "../shared/lump-sums.model";
import {FixedValue} from "../shared/fixed-value.model";
import {AdminPanelService} from "../admin-panel/admin-panel.service";
import {Region, RegionService} from "../region-service/region.service";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {MatButton} from "@angular/material/button";

@Component({
  selector: 'app-edit-hotel',
  templateUrl: './edit-hotel.component.html',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatInput,
    FormsModule,
    NgForOf,
    MatButton
  ],
  styleUrls: ['./edit-hotel.component.css']
})
export class EditHotelComponent implements OnInit {
  hotel: Hotel | null = null;
  hotelName = '';
  selectedRegionId: number | null = null;
  selectedLumpSumsId: string | undefined;
  lumpSums: LumpSum[] = [];
  regions: Region[] = [];

  // New LumpSum form fields
  newLumpSumName = '';
  newLumpSumFixedValues: FixedValue[] = []

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private adminPanelService: AdminPanelService,
      private hotelService: HotelService,
      private regionService: RegionService,
  ) {}

  ngOnInit(): void {
    const hotelId = this.route.snapshot.paramMap.get('id');
     this.regionService.getRegionList().subscribe(regions => {
       this.regions = regions;
     })
    this.adminPanelService.getLumpSums().subscribe(lumpSums => {
      this.lumpSums = lumpSums
    })
    if (hotelId) {
      this.loadHotel(hotelId);
    }
  }

  loadHotel(hotelId: string): void {
    this.hotelService.getHotel(hotelId).subscribe(hotel => {
      this.hotel = hotel;
      this.hotelName = hotel.name;
      this.selectedRegionId = hotel.region.id;
      this.selectedLumpSumsId = hotel.lump_sums.id;
    });
  }

  saveHotel(): void {
    if (this.hotel && this.selectedRegionId && this.selectedLumpSumsId) {
      const updatedHotel = {
        name: this.hotelName,
        regionId: this.selectedRegionId,
        lumpSumsId: this.selectedLumpSumsId
      };

      this.adminPanelService.editHotel(this.hotel.id, updatedHotel).subscribe({
        next: () => {
          alert('Hotel updated successfully!');
          this.router.navigate(['/admin']); // Redirect back to admin panel or hotel list
        },
        error: error => {
          console.error('Error updating hotel:', error);
          alert('Failed to update hotel.');
        }
      });
    }
  }

  addFixedValue(): void {
    this.newLumpSumFixedValues.push({
      name: '',
      tariff1: { tariffType: 1, carValue: 0, busValue: 0 },
      tariff2: { tariffType: 2, carValue: 0, busValue: 0 }
    });
  }

  removeFixedValue(index: number): void {
    this.newLumpSumFixedValues.splice(index, 1);
  }

  createNewLumpSum(): void {
    const newLumpSum: LumpSum = {
      name: this.newLumpSumName,
      fixedValues: this.newLumpSumFixedValues
    };

    this.adminPanelService.addLumpSum(newLumpSum).subscribe({
      next: response => {
        this.refreshLumpSums()
        this.selectedLumpSumsId = response.id; // Set the new LumpSum ID
        alert('New Lump Sum created and selected!');
        this.newLumpSumName = ''; // Reset the form fields
        this.newLumpSumFixedValues = [
          { name: '', tariff1: { tariffType: 1, carValue: 0, busValue: 0 }, tariff2: { tariffType: 2, carValue: 0, busValue: 0 } }
        ];
      },
      error: error => {
        console.error('Error creating lump sum:', error);
        alert('Failed to create new lump sum.');
      }
    });
  }

  refreshLumpSums(): void {
    this.adminPanelService.getLumpSums().subscribe(lumpSums => {
      this.lumpSums = lumpSums;
    });
  }
}
