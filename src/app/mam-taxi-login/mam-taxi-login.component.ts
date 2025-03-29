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

  sendSms() {
    this.authService.sendSms(this.phone).subscribe({
      next: () => this.message = 'SMS wysłany!',
      error: () => this.error = 'Nie udało się wysłać SMS-a',
    });
  }

  login() {
    this.authService.login(this.phone, this.code).subscribe({
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
