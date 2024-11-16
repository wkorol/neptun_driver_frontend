import {Component, OnInit} from '@angular/core';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MatToolbar} from "@angular/material/toolbar";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {NgClass, NgIf} from "@angular/common";
import {SearchBarComponent} from "../search-bar/search-bar.component";
import {filter} from "rxjs";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    MatSidenavContent,
    MatToolbar,
    MatSidenavContainer,
    MatSidenav,
    MatIcon,
    MatIconButton,
    RouterLink,
    RouterLinkActive,
    NgIf,
    RouterOutlet,
    SearchBarComponent,
    NgClass
  ],
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit{
  showSearchBar: boolean = true;
  constructor(private router: Router) {
  }
  isSidenavOpen = false; // Set the sidenav to be closed by default

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  closeSidenav(): void {
    this.isSidenavOpen = false;
  }

  ngOnInit(): void {
    // Listen to route changes and set search bar visibility
    this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Hide search bar on the `HotelDetailsComponent` route
      this.showSearchBar = !event.url.includes('/hotel/');
    });
  }
}
