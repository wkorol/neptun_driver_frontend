import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private apiUrl = 'https://apineptun-ij5mx.ondigitalocean.app/hotel';

  constructor(private http: HttpClient) { }

  getHotels(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
