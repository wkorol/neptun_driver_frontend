import {RouterModule, Routes} from '@angular/router';
import {HotelListComponent} from "./hotel-list/hotel-list.component";
import {HotelDetailsComponent} from "./hotel-details/hotel-details.component";
import {NgModule} from "@angular/core";
import {RegionComponent} from "./region/region.component";

export const routes: Routes = [
    { path: '', component: RegionComponent },
    {path: 'hotel/:id', component: HotelDetailsComponent},
    {path: 'hotel', component: HotelListComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}