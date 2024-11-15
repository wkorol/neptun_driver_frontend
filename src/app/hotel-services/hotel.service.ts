import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Region} from "../region-service/region.service";
import {LumpSum} from "../shared/lump-sums.model";

export interface Hotel {
  id: string;
  name: string;
  region:  Region;
  lump_sums: LumpSum;
  update_date: Date;
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
