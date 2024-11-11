import {RouterModule, Routes} from '@angular/router';
import {HotelListComponent} from "./hotel-list/hotel-list.component";
import {HotelDetailsComponent} from "./hotel-details/hotel-details.component";
import {NgModule} from "@angular/core";

export const routes: Routes = [
    { path: '', component: HotelListComponent },
    {path: 'hotel/:id', component: HotelDetailsComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}