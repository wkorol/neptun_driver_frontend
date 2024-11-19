import { Component } from '@angular/core';
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {NgForOf} from "@angular/common";

@Component({
  selector: 'app-region-manage',
  templateUrl: 'manage-regions.component.html',
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    FormsModule,
    MatButton,
    MatLabel,
    NgForOf
  ],
  styleUrls: ['manage-regions.component.css']
})
export class ManageRegionsComponent {
  newRegionId: string = '';
  newRegionName: string = '';
  regions: { id: string; name: string }[] = [];

  addRegion(): void {
    if (this.newRegionId && this.newRegionName) {
      this.regions.push({ id: this.newRegionId, name: this.newRegionName });
      this.newRegionId = '';
      this.newRegionName = '';
    }
  }
}
