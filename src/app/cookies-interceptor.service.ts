import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

// для настройки всех исходящих запросов
@Injectable()
export class CookiesInterceptor implements HttpInterceptor {

  constructor() {}

  // intercept - это аналог фильтров в веб приложении
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    request = request.clone({
      withCredentials: true, // браузер будет добавлять куки
    });

    return next.handle(request);
  }
}
