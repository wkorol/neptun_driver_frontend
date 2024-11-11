import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";

export interface Hotel {
  id:string;
  name: string;
  region: { name: string };
  lump_sums: {
    name: string;
    fixedValues: Array<{
      name: string;
      '1tariff': Array<{ busValue: number; carValue: number }>;
      '2tariff': Array<{ busValue: number; carValue: number }>;
    }>;
  };
  update_date: { date: string };
}

@Injectable({
  providedIn: 'root'
})
export class HotelService {

  constructor(private http: HttpClient) { }

  getHotels(): Observable<Hotel[]>
  {
    return this.http.get<Hotel[]>('https://apineptun-ij5mx.ondigitalocean.app/hotel');
  }

  getHotel(hotelId: string | null): Observable<Hotel>
  {
    return this.http.get<Hotel>(`https://apineptun-ij5mx.ondigitalocean.app/hotel/${hotelId}`)
  }

  getHotelsByRegion(regionId: number): Observable<Hotel[]>
  {
    return this.http.get<Hotel[]>(`https://apineptun-ij5mx.ondigitalocean.app/region/${regionId}/hotels`)
  }

}
