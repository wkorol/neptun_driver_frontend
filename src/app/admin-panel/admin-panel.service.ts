import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Hotel} from "../hotel-services/hotel.service";
import {LumpSum} from "../shared/lump-sums.model";
import {Region} from "../region-service/region.service";


@Injectable({
    providedIn: 'root'
})
export class AdminPanelService {
    private hotelUrl = 'https://apineptun-ij5mx.ondigitalocean.app/hotel';
    private lumpSumUrl = 'https://apineptun-ij5mx.ondigitalocean.app/lump_sums';
    private regionUrl = 'https://apineptun-ij5mx.ondigitalocean.app/region';
    private addHotelUrl = 'https://apineptun-ij5mx.ondigitalocean.app/hotel/add';
    private lumpSumAddUrl = 'https://apineptun-ij5mx.ondigitalocean.app/lump_sums/add';
    private hotelEditUrl = 'https://apineptun-ij5mx.ondigitalocean.app/hotel';
    private deleteHotelUrl = 'https://apineptun-ij5mx.ondigitalocean.app/hotel';

    constructor(private http: HttpClient) {}

    getHotels(): Observable<Hotel[]> {
        return this.http.get<Hotel[]>(this.hotelUrl);
    }

    getLumpSums(): Observable<LumpSum[]> {
        return this.http.get<LumpSum[]>(this.lumpSumUrl);
    }

    getRegions(): Observable<Region[]> {
        return this.http.get<Region[]>(this.regionUrl);
    }

    addHotel(hotelData: { regionId: number; lumpSumsId: string; name: string }): Observable<{message: string, error: string}> {
        return this.http.post<{message: string, error: string}>(this.addHotelUrl, hotelData);
    }

    updateLumpSum(lumpSumId: string, lumpSum: LumpSum): Observable<void>
    {
        return this.http.put<void>(`${this.lumpSumUrl}/${lumpSumId}/edit`, lumpSum);
    }

    deleteLumpSum(lumpSumId: string): Observable<{message: string}>
    {
        return this.http.delete<{message: string}>(`${this.lumpSumUrl}/${lumpSumId}/delete`);
    }

    addLumpSum(lumpSum: LumpSum): Observable<{id: string}> {
        return this.http.post<{id: string}>(this.lumpSumAddUrl, lumpSum);
    }

    editHotel(hotelId: string, hotelData: { name: string; regionId: number; lumpSumsId: string }): Observable<void> {
        return this.http.put<void>(`${this.hotelEditUrl}/${hotelId}/edit`, hotelData);
    }

    removeHotel(hotelId: string): Observable<{message: string}> {
        return this.http.delete<{message: string}>(`${this.deleteHotelUrl}/${hotelId}/delete`)
    }
}
