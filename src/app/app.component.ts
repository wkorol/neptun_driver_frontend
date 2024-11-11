import {Component, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {HotelListComponent} from "./hotel-list/hotel-list.component";
import {RegionComponent} from "./region/region.component";
import {SearchBarComponent} from "./search-bar/search-bar.component";
import {filter} from "rxjs";
import {NgIf} from "@angular/common";
import {NavbarComponent} from "./navbar/navbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HotelListComponent, RegionComponent, SearchBarComponent, NgIf, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {


  constructor(private router: Router) {}

  ngOnInit(): void {
  }
}
