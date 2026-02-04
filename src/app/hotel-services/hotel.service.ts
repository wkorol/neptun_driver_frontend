import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {Region} from "../region-service/region.service";
import {LumpSum} from "../shared/lump-sums.model";
import { apiConfig } from '../config/api.config';

export interface Hotel {
  id: string;
  name: string;
  oldName?: string | null;
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
    return this.http.get<Hotel[]>(`${apiConfig.baseUrl}/hotel`);
  }

  getHotel(hotelId: string | null): Observable<Hotel>
  {
    return this.http.get<Hotel>(`${apiConfig.baseUrl}/hotel/${hotelId}`)
  }

  getHotelsByRegion(regionId: number): Observable<Hotel[]>
  {
    return this.http.get<Hotel[]>(`${apiConfig.baseUrl}/region/${regionId}/hotels`)
  }
}
