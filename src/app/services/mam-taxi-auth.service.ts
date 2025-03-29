import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {catchError, map, Observable} from "rxjs";
import { of } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class MamTaxiAuthService {
    constructor(private http: HttpClient) {}

    login() {
        return this.http.get<any>(`https://apineptun-ij5mx.ondigitalocean.app/api/proxy/login`, { withCredentials: true });
    }

    getActualOrders() {
        return this.http.get<any[]>(`https://apineptun-ij5mx.ondigitalocean.app/orders/now`, {
            withCredentials: true
        });
    }

    getOrdersForToday() {
        return this.http.get<any[]>(`https://apineptun-ij5mx.ondigitalocean.app/orders/scheduled/today`, {
            withCredentials: true
        });
    }

    getOrdersForNext5Days() {
        return this.http.get<any[]>(`https://apineptun-ij5mx.ondigitalocean.app/orders/scheduled/next5days`)
    }

    importOrders(howMany: number) {
        return this.http.get(`https://apineptun-ij5mx.ondigitalocean.app/api/proxy/import-orders/${howMany}`, {
            withCredentials: true,
            responseType: 'text'
        });
    }

    checkSession(): Observable<boolean> {
        return this.http.get('https://apineptun-ij5mx.ondigitalocean.app/api/session/check', {
            withCredentials: true
        }).pipe(
            map(() => true),
            catchError(() =>
                this.login().pipe(
                    map(() => true),
                    catchError(() => of(false))
                )
            )
        );
    }
}