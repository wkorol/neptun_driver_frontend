import { Component } from '@angular/core';
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {NgForOf} from "@angular/common";

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
export class ManageLumpSumsComponent {
  newLumpSumName: string = '';
  fixedValues: any[] = [];
  lumpSums: { id: string; name: string }[] = [];

  addFixedValue(): void {
    this.fixedValues.push({
      name: '',
      tariff1: { carValue: null, busValue: null },
      tariff2: { carValue: null, busValue: null }
    });
  }

  removeFixedValue(index: number): void {
    this.fixedValues.splice(index, 1);
  }

  addLumpSum(): void {
    if (this.newLumpSumName) {
      this.lumpSums.push({ id: Date.now().toString(), name: this.newLumpSumName });
      this.newLumpSumName = '';
      this.fixedValues = [];
    }
  }
}
