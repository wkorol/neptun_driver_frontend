import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MamTaxiAuthService {
    constructor(private http: HttpClient) {}

    sendSms(phone: string) {
        return this.http.get(`https://apineptun-ij5mx.ondigitalocean.app/api/proxy/send-sms/${phone}`, { withCredentials: true });
    }

    login(phone: string, code: string) {
        return this.http.get(`https://apineptun-ij5mx.ondigitalocean.app/api/proxy/login/${phone}/${code}`, { withCredentials: true });
    }

    getOrders() {
        return this.http.get<any[]>(`https://apineptun-ij5mx.ondigitalocean.app/orders/scheduled`, {
            withCredentials: true
        });
    }

    importOrders(howMany: number) {
        return this.http.get(`https://apineptun-ij5mx.ondigitalocean.app/api/proxy/import-orders/${howMany}`, {
            withCredentials: true,
            responseType: 'text'
        });
    }
}