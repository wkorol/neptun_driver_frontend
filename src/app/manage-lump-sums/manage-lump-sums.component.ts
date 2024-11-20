import {Component, OnInit} from '@angular/core';
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {NgForOf} from "@angular/common";
import {LumpSum} from "../shared/lump-sums.model";
import {AdminPanelService} from "../admin-panel/admin-panel.service";
import {Hotel} from "../hotel-services/hotel.service";
import {Region} from "../region-service/region.service";
import {FixedValue} from "../shared/fixed-value.model";

@Component({
  selector: 'app-lump-sums-manage',
  templateUrl: 'manage-lump-sums.component.html',
  standalone: true,
    imports: [
        MatFormField,
        MatInput,
        FormsModule,
        MatButton,
        MatLabel,
        NgForOf
    ],
  styleUrls: ['manage-lump-sums.component.css']
})
export class ManageLumpSumsComponent implements OnInit {
  hotel: Hotel | null = null;
  selectedLumpSumsId: string | undefined;
  lumpSums: LumpSum[] = [];
  regions: Region[] = [];

  newLumpSumName = '';
  newLumpSumFixedValues: FixedValue[] = []

  constructor(private adminPanelService: AdminPanelService) {

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

  editLumpSum(lumpSum: LumpSum): void {
    console.log('Editing Lump Sum:', lumpSum); // Debugging

    this.selectedLumpSumsId = lumpSum.id;
    this.newLumpSumName = lumpSum.name;

    this.newLumpSumFixedValues = lumpSum.fixedValues.map(fixedValue => ({
      name: fixedValue.name,
      tariff1: { ...fixedValue.tariff1 },
      tariff2: { ...fixedValue.tariff2 }
    }));

    console.log('New Fixed Values:', this.newLumpSumFixedValues); // Debugging
  }


  createOrUpdateLumpSum(): void {
    const lumpSum: LumpSum = {
      id: this.selectedLumpSumsId,
      name: this.newLumpSumName,
      fixedValues: this.newLumpSumFixedValues
    };

    if (this.selectedLumpSumsId) {
      // Update existing lump sum
      this.adminPanelService.updateLumpSum(this.selectedLumpSumsId, lumpSum).subscribe({
        next: () => {
          alert('Lump Sum updated successfully!');
          this.refreshLumpSums();
          this.resetForm();
        },
        error: error => {
          console.error('Error updating lump sum:', error);
          alert('Failed to update lump sum.');
        }
      });
    } else {
      // Create new lump sum
      this.adminPanelService.addLumpSum(lumpSum).subscribe({
        next: () => {
          alert('New Lump Sum created successfully!');
          this.refreshLumpSums();
          this.resetForm();
        },
        error: error => {
          console.error('Error creating lump sum:', error);
          alert('Failed to create new lump sum.');
        }
      });
    }
  }

  resetForm(): void {
    this.selectedLumpSumsId = undefined;
    this.newLumpSumName = '';
    this.newLumpSumFixedValues = [];
  }

  refreshLumpSums(): void {
    this.adminPanelService.getLumpSums().subscribe(lumpSums => {
      this.lumpSums = lumpSums;
    });
  }

  removeLumpSum(lumpSumId: string | undefined): void {
    if (lumpSumId) {
      if (confirm('Czy na pewno chcesz usunąć ten zestaw ryczałtów?')) {
        this.adminPanelService.deleteLumpSum(lumpSumId).subscribe({
          next: () => {
            // Remove the lump sum from the local list
            this.refreshLumpSums()
            alert('Zestaw ryczałtów poprawnie usunięty');
          },
          error: (error) => {
            console.error('Error removing lump sum:', error);
            alert('Failed to remove lump sum.');
          }
        });
      }
    }
  }

  ngOnInit(): void {
    this.adminPanelService.getLumpSums().subscribe(lumpSums => {
      this.lumpSums = lumpSums
    })
  }
}
