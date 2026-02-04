import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {catchError, map, Observable} from "rxjs";
import { of } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { Order } from '../shared/order.model';


@Injectable({ providedIn: 'root' })
export class MamTaxiAuthService {
    private orderListToken: string | null = null;
    private orderListPublicToken: string | null = null;

    constructor(private http: HttpClient) {}

    setOrderListToken(token: string | null) {
        this.orderListToken = token;
    }

    setOrderListPublicToken(token: string | null) {
        this.orderListPublicToken = token;
    }

    private withOrderListToken(options: { headers?: HttpHeaders; params?: any; withCredentials?: boolean; responseType?: any } = {}) {
        if (!this.orderListToken && !this.orderListPublicToken) {
            return options;
        }

        let headers = options.headers ?? new HttpHeaders();
        if (this.orderListToken) {
            headers = headers.set('X-Order-List-Token', this.orderListToken);
        }
        if (this.orderListPublicToken) {
            headers = headers.set('X-Order-List-Public', this.orderListPublicToken);
        }

        return {
            ...options,
            headers
        };
    }

    login() {
        return this.http.get<any>(
            `${apiConfig.baseUrl}/api/proxy/login`,
            this.withOrderListToken({ withCredentials: true })
        );
    }

    getActualOrders() {
        return this.http.get<any[]>(
            `${apiConfig.baseUrl}/orders/now`,
            this.withOrderListToken({ withCredentials: true })
        );
    }

    getOrdersForToday() {
        return this.http.get<any[]>(
            `${apiConfig.baseUrl}/orders/scheduled/today`,
            this.withOrderListToken({ withCredentials: true })
        );
    }

    getOrdersForNext5Days() {
        return this.http.get<any[]>(
            `${apiConfig.baseUrl}/orders/scheduled/next5days`,
            this.withOrderListToken()
        );
    }

    getOrdersSummary() {
        return this.http.get<{
            today: Order[];
            actual: Order[];
            next5: Order[];
        }>(
            `${apiConfig.baseUrl}/orders/summary`,
            this.withOrderListToken({ withCredentials: true })
        );
    }

    getBatchPhoneHistory(payload: { [phone: string]: number[] }) {
        return this.http.post<any>(
            `${apiConfig.baseUrl}/orders/find-history-batch`,
            { phones: payload },
            this.withOrderListToken()
        );
    }

    getOrdersHistoryByDay(date: string, page: number, size: number) {
        return this.http.get<{
            items: Order[];
            total: number;
            page: number;
            size: number;
        }>(
            `${apiConfig.baseUrl}/orders/history/by-day`,
            this.withOrderListToken({
                params: {
                    date,
                    page,
                    size
                }
            })
        );
    }

    importOrders(howMany: number) {
        return this.http.get(
            `${apiConfig.baseUrl}/api/proxy/import-orders/${howMany}`,
            this.withOrderListToken({ withCredentials: true, responseType: 'text' })
        );
    }

    checkSession(): Observable<boolean> {
        return this.http.get(
            `${apiConfig.baseUrl}/api/session/check`,
            this.withOrderListToken({ withCredentials: true })
        ).pipe(
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
