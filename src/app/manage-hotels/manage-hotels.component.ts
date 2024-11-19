import {Component, OnInit} from '@angular/core';
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatOption, MatSelect} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {Router} from "@angular/router";
import {Hotel, HotelService} from "../hotel-services/hotel.service";
import {AdminPanelService} from "../admin-panel/admin-panel.service";
import {Region} from "../region-service/region.service";
import {LumpSum} from "../shared/lump-sums.model";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-hotel-manage',
  templateUrl: 'manage-hotels.component.html',
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    MatSelect,
      MatLabel,
    FormsModule,
    MatOption,
    NgForOf,
    MatButton
  ],
  styleUrls: ['manage-hotels.component.css']
})
export class ManageHotelsComponent implements OnInit {
  newHotelName: string = '';
  selectedRegionId: number = 0;
  selectedLumpSumsId: string  = '';

  hotels: Hotel[] = [];
  regions: Region[] = [];
  lumpSums: LumpSum[] = [];

  constructor(private router: Router, private adminPanelService: AdminPanelService, private snackBar: MatSnackBar) {
  }

  addHotel(): void {
    if (this.newHotelName && this.selectedRegionId && this.selectedLumpSumsId) {
      this.adminPanelService.addHotel({
        regionId: this.selectedRegionId,
        lumpSumsId: this.selectedLumpSumsId,
        name: this.newHotelName
      }).subscribe({
        next: (response) => {
          // Show success message with response data
          this.snackBar.open(`${response.message}`, 'Close', {
            duration: 3000,  // Duration in milliseconds
            panelClass: ['snackbar-success']  // Custom styling class
          });

          // Refresh the hotels list or perform other actions
          this.adminPanelService.getHotels().subscribe(data => {
            this.hotels = data;
          });
        },
        error: (err) => {
          // Show error message in snackbar
          this.snackBar.open('Failed to add hotel. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });

      // Clear form fields after adding
      this.newHotelName = '';
      this.selectedRegionId = 0;
      this.selectedLumpSumsId = '';
    }
  }

  deleteHotel(hotelId: string): void {
    this.adminPanelService.removeHotel(hotelId).subscribe({
      next: (response) => {
        this.snackBar.open(`${response.message}`, 'Close', {
          duration: 3000,  // Duration in milliseconds
          panelClass: ['snackbar-success']  // Custom styling class
        });

        // Refresh the hotels list or perform other actions
        this.adminPanelService.getHotels().subscribe(data => {
          this.hotels = data;
        });
      }
    })
  }


  goToEditHotel(hotelId: string) {
    this.router.navigate([`/hotel/${hotelId}/edit`]);
  }

  ngOnInit(): void {
      this.adminPanelService.getHotels().subscribe(data => {
        this.hotels = data;
      })
      this.adminPanelService.getRegions().subscribe(data => {
        this.regions = data;
      })
    this.adminPanelService.getLumpSums().subscribe(data => {
      this.lumpSums = data;
    })
  }
}
