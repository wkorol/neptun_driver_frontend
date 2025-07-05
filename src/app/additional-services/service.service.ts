import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Service {
    id: string;
    name: string;
    description: string | null;
    price: string;
}

@Injectable({
    providedIn: 'root'
})
export class ServiceService {
    private readonly baseUrl = 'https://apineptun-ij5mx.ondigitalocean.app';

    constructor(private http: HttpClient) {}

    getServices(): Observable<Service[]> {
        return this.http.get<Service[]>(`${this.baseUrl}/service`);
    }
}
