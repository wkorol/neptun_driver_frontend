import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';

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
    private readonly baseUrl = apiConfig.baseUrl;

    constructor(private http: HttpClient) {}

    getServices(): Observable<Service[]> {
        return this.http.get<Service[]>(`${this.baseUrl}/service`);
    }
}
