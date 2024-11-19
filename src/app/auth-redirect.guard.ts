import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthRedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      // If the user is already logged in, redirect to the home page
      this.router.navigate(['/']);
      return false;
    }
    // Allow access to /login if the user is not logged in
    return true;
  }
}
