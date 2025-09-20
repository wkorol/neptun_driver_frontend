import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Hotel} from "../hotel-services/hotel.service";

export interface Region {
  id: number;
  name: string;
  imgLink: string;
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

  addRegion(regionData: { name: string | undefined, id: number | undefined }): Observable<void>
  {
    return this.http.post<void>(`https://apineptun-ij5mx.ondigitalocean.app/region/add`, regionData);
  }
}
