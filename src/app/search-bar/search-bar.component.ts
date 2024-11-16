import { Component } from '@angular/core';
import { SharedService } from '../shared/shared.service';
import {MatFormField} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {SharedModule} from "../shared/shared.module";

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    SharedModule
  ],
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent {
  searchTerm = '';

  constructor(private sharedService: SharedService) {}

  onSearch(term: string): void {
    this.sharedService.updateSearchTerm(term);
  }
}
