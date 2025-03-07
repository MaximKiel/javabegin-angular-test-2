import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DataComponent} from "./data/data.component";

const routes: Routes = [
  {path: 'data', component: DataComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
