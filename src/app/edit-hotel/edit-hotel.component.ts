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
import {NgForOf, NgIf} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";

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
    MatButton,
    NgIf,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
      MatExpansionPanelHeader
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

  currentLumpSum: LumpSum = {name: '', fixedValues: []};

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

  saveLumpSum() {
    if(this.currentLumpSum) {
      if (this.selectedLumpSumsId) {
        this.adminPanelService.updateLumpSum(this.selectedLumpSumsId, this.currentLumpSum).subscribe(() => {
          this.refreshLumpSums()
        });
      } else {
        this.adminPanelService.addLumpSum(this.currentLumpSum).subscribe(() => {
          this.refreshLumpSums()
        });
      }
    }
  }

  loadHotel(hotelId: string): void {
    this.hotelService.getHotel(hotelId).subscribe(hotel => {
      this.hotel = hotel;
      this.hotelName = hotel.name;
      this.selectedRegionId = hotel.region.id;
      this.selectedLumpSumsId = hotel.lump_sums.id;
      this.currentLumpSum = hotel.lump_sums
    });
  }

  onLumpSumSelect() {
    const selected = this.lumpSums.find(lumpSum => lumpSum.id === this.selectedLumpSumsId);
    if (selected) {
      this.currentLumpSum = JSON.parse(JSON.stringify(selected)); // Deep clone
    }
  }

  // saveAsNewLumpSum() {
  //   const clonedLumpSum = {
  //     ...this.currentLumpSum,
  //     id: Math.random().toString(36).substr(2, 9), // Generate a new ID
  //     name: this.currentLumpSum?.name + ' (Copy)'
  //   };
  //   this.lumpSums.push(clonedLumpSum);
  //   this.selectedLumpSumsId = clonedLumpSum.id;
  //   this.currentLumpSum = JSON.parse(JSON.stringify(clonedLumpSum));
  // }


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
    this.currentLumpSum.fixedValues.push({
      name: '',
      tariff1: { tariffType: 1, carValue: 0, bus5_6Value: 0, bus7_8Value: 0 },
      tariff2: { tariffType: 2, carValue: 0, bus5_6Value: 0, bus7_8Value: 0}
    });
  }

  removeFixedValue(index: number): void {
    this.currentLumpSum.fixedValues.splice(index, 1);
  }

  refreshLumpSums(): void {
    this.adminPanelService.getLumpSums().subscribe(lumpSums => {
      this.lumpSums = lumpSums;
    });
  }
}
