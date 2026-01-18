import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {catchError, map, Observable} from "rxjs";
import { of } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { Order } from '../shared/order.model';


@Injectable({ providedIn: 'root' })
export class MamTaxiAuthService {
    constructor(private http: HttpClient) {}

    login() {
        return this.http.get<any>(`${apiConfig.baseUrl}/api/proxy/login`, { withCredentials: true });
    }

    getActualOrders() {
        return this.http.get<any[]>(`${apiConfig.baseUrl}/orders/now`, {
            withCredentials: true
        });
    }

    getOrdersForToday() {
        return this.http.get<any[]>(`${apiConfig.baseUrl}/orders/scheduled/today`, {
            withCredentials: true
        });
    }

    getOrdersForNext5Days() {
        return this.http.get<any[]>(`${apiConfig.baseUrl}/orders/scheduled/next5days`)
    }

    getOrdersSummary() {
        return this.http.get<{
            today: Order[];
            actual: Order[];
            next5: Order[];
        }>(`${apiConfig.baseUrl}/orders/summary`, {
            withCredentials: true
        });
    }

    getBatchPhoneHistory(payload: { [phone: string]: number[] }) {
        return this.http.post<any>(
            `${apiConfig.baseUrl}/orders/find-history-batch`,
            { phones: payload }
        );
    }

    getOrdersHistoryByDay(date: string, page: number, size: number) {
        return this.http.get<{
            items: Order[];
            total: number;
            page: number;
            size: number;
        }>(`${apiConfig.baseUrl}/orders/history/by-day`, {
            params: {
                date,
                page,
                size
            }
        });
    }

    importOrders(howMany: number) {
        return this.http.get(`${apiConfig.baseUrl}/api/proxy/import-orders/${howMany}`, {
            withCredentials: true,
            responseType: 'text'
        });
    }

    checkSession(): Observable<boolean> {
        return this.http.get(`${apiConfig.baseUrl}/api/session/check`, {
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

    cancelOrder(payload: {
        InternalOrderId: number;
        CorporationId: number;
        StatusCode: string;
        ReasonCode: number;
        ReasonMessage: string | null;
    }) {
        return this.http.post('https://api.mamtaxi.pl/api/ExtAppV1/CancelOrder', payload);
    }
}
