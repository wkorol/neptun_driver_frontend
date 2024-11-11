// search-bar.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { SharedService } from '../shared/shared.service';
import {SharedModule} from "../shared/shared.module";

@Component({
  selector: 'app-search-bar',
  templateUrl: `search-bar.component.html`,
  standalone: true,
  imports: [SharedModule],
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent {
  searchTerm: string = '';

  constructor(private sharedService: SharedService) {}

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.sharedService.setSearchTerm(this.searchTerm);
  }
}
