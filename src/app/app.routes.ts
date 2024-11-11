import {RouterModule, Routes} from '@angular/router';
import {HotelListComponent} from "./hotel-list/hotel-list.component";
import {HotelDetailsComponent} from "./hotel-details/hotel-details.component";
import {NgModule} from "@angular/core";
import {RegionComponent} from "./region/region.component";
import {AdminPanelComponent} from "./admin-panel/admin-panel.component";
import {EditHotelComponent} from "./edit-hotel/edit-hotel.component";

export const routes: Routes = [
    { path: '', component: RegionComponent },
    {path: 'hotel/:id', component: HotelDetailsComponent},
    {path: 'hotel/:id/edit', component: EditHotelComponent},
    {path: 'hotel', component: HotelListComponent},
    {path: 'admin', component: AdminPanelComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}