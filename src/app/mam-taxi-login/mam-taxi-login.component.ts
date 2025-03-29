import {Component, EventEmitter, Output} from '@angular/core';
import {MamTaxiAuthService} from "../services/mam-taxi-auth.service";
import {NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-mam-taxi-login',
  standalone: true,
  imports: [
    NgIf,
    FormsModule
  ],
  templateUrl: './mam-taxi-login.component.html',
  styleUrl: './mam-taxi-login.component.css'
})
export class MamTaxiLoginComponent {
  phone = '';
  code = '';
  message = '';
  error = '';

  @Output() loginSuccess = new EventEmitter<void>();

  constructor(private authService: MamTaxiAuthService) {
  }

  login() {
    this.authService.login().subscribe({
      next: () => {
        this.message = 'Zalogowano!';
        this.error = '';
        this.loginSuccess.emit();
      },
      error: () => {
        this.error = 'Błąd logowania';
        this.message = '';
      }
    });
  }
}
