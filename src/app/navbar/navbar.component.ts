import {Component, OnInit} from '@angular/core';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MatToolbar} from "@angular/material/toolbar";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import {AsyncPipe, NgClass, NgIf} from "@angular/common";
import {SearchBarComponent} from "../search-bar/search-bar.component";
import {filter, Observable} from "rxjs";
import {AuthService} from "../services/auth.service";
import {BouncingInfoBoxComponent} from "../bouncing-info-box/bouncing-info-box.component";

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
    NgClass,
    AsyncPipe,
    BouncingInfoBoxComponent
  ],
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit{
  isLoggedIn$: Observable<boolean>;
  showSearchBar: boolean = true;
  showInfoBox = false;
  constructor(private router: Router, private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }
  isSidenavOpen = false; // Set the sidenav to be closed by default

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  closeSidenav(): void {
    this.isSidenavOpen = false;
  }

  ngOnInit(): void {
    this.showNewHotelInfo();
    // Listen to route changes and set search bar visibility
    this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const urlWithoutQueryParams = event.url.split('?')[0]; // Strip query parameters

      // Determine if search bar should be shown
      this.showSearchBar = urlWithoutQueryParams === '/hotel' || // Matches `/hotel`
          urlWithoutQueryParams === '/' || // Matches `/`
          (urlWithoutQueryParams === '/hotel' && event.url.includes('regionId'));
    });
  }

  showNewHotelInfo() {
    this.showInfoBox = true;
  }

  hideInfoBox() {
    this.showInfoBox = false;
  }

  showAlert() {
    alert('W trakcie programowania');
  }

  logout() {
    this.closeSidenav();
    this.authService.logout();
  }
}
