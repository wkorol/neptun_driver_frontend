import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Hotel} from "../hotel-services/hotel.service";

export interface Region {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegionService {

  constructor(private http: HttpClient) { }


  getRegionList(): Observable<Region[]>
  {
    return this.http.get<Region[]>(`https://apineptun-ij5mx.ondigitalocean.app/region`);
  }
}
