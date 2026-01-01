import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, map, Observable} from 'rxjs';
import { tap } from 'rxjs/operators';
import {Router} from "@angular/router";
import { apiConfig } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('authToken'));

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${apiConfig.baseUrl}/login`, credentials).pipe(
        tap(response => {
          const token = response.token;
          localStorage.setItem('authToken', token);
          this.tokenSubject.next(token);
        })
    );
  }

  logout() {
    localStorage.removeItem('authToken');
    this.tokenSubject.next(null);
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!this.tokenSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.tokenSubject.asObservable().pipe(map(token => !!token));
  }
}
