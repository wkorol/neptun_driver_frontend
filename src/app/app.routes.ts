import {RouterModule, Routes} from '@angular/router';
import {HotelListComponent} from "./hotel-list/hotel-list.component";
import {HotelDetailsComponent} from "./hotel-details/hotel-details.component";
import {NgModule} from "@angular/core";
import {RegionComponent} from "./region/region.component";
import {AdminPanelComponent} from "./admin-panel/admin-panel.component";
import {EditHotelComponent} from "./edit-hotel/edit-hotel.component";
import {LoginComponent} from "./login/login.component";
import {AuthRedirectGuard} from "./auth-redirect.guard";
import {ManageRegionsComponent} from "./manage-regions/manage-regions.component";
import {ManageHotelsComponent} from "./manage-hotels/manage-hotels.component";
import {ManageLumpSumsComponent} from "./manage-lump-sums/manage-lump-sums.component";
import {ShipyardMapComponent} from "./shipyard-map/shipyard-map.component";
import {AcademyMapComponent} from "./academy-map/academy-map.component";
import {LumpSumCancellationsComponent} from "./lump-sum-cancellations/lump-sum-cancellations.component";
import {OrderListComponent} from "./order-list/order-list.component";

export const routes: Routes = [
    { path: '', component: RegionComponent },
    {path: 'hotel/:id', component: HotelDetailsComponent},
    {path: 'hotel/:id/edit', component: EditHotelComponent},
    {path: 'hotel', component: HotelListComponent},
    {path: 'login', component: LoginComponent, canActivate: [AuthRedirectGuard]},
    { path: 'manage-regions', component: ManageRegionsComponent },
    { path: 'manage-hotels', component: ManageHotelsComponent },
    { path: 'manage-lump-sums', component: ManageLumpSumsComponent },
    { path: 'mapa-stocznia', component: ShipyardMapComponent },
    { path: 'mapa-akademia', component: AcademyMapComponent },
    { path: 'odwolane-loty', component: LumpSumCancellationsComponent },
    { path: 'admin', component: AdminPanelComponent },
    { path: 'test', component: OrderListComponent },

];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}