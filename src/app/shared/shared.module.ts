import { NgModule } from '@angular/core';
import {CommonModule, NgForOf} from '@angular/common';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {FormsModule} from "@angular/forms";



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatCard,
    MatCardSubtitle,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatLabel,
    NgForOf,
    MatFormField,
    MatInput,
    FormsModule
  ],
  exports: [
    CommonModule,
    MatCard,
    MatCardSubtitle,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatLabel,
    NgForOf,
    MatFormField,
    MatInput,
    FormsModule
  ]
})
export class SharedModule { }
