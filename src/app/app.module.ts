import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClientModule, HTTP_INTERCEPTORS} from "@angular/common/http";
import { LoginComponent } from './login/login.component';
import { DataComponent } from './data/data.component';
import {CookiesInterceptor} from "./cookies-interceptor.service";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DataComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CookiesInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
