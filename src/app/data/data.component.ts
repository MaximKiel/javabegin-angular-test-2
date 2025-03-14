import {Component, OnInit} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import * as http from "http";
import {environment} from "../../environments/environment";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.css']
})

export class DataComponent implements OnInit {

  email = ""; // имя пользователя
  followers = 0;
  following = 0;


  constructor(
    private router: Router, // навигация, общие параметры перехода на веб страницу
    private http: HttpClient, // для веб запросов
    private activatedRoute: ActivatedRoute, // содержит служебные данные роута, через который попали на этот компонент
  ) {
  }

  ngOnInit(): void {

    // сразу при загрузке страницы - отображам данные с backend
    this.requestBackend();

    // считываем параметры входящего запроса
    this.activatedRoute.queryParams.subscribe(params => {

      this.email = params['email'];

    });
  }


  // запрос на backend для данных пользователя
  requestBackend() {
    const data = {email: this.email};
    const body = JSON.stringify(data);

    this.http.post<any>(environment.backendURL + "/user/data",
      body,
      {
        headers: {
          'Content-Type': 'application/json' // обязательно нужно указывать
        }
      }
    ).subscribe(
      {

        // успешное выполнение
        next: ((response: any) => {

          console.log(response);
          // console.log(response.data);

          this.followers = response.followers;
          this.following = response.following;

        }),

        // выполнение с ошибкой
        error: (error => {
          console.log(error);

        })
      }
    );
  }


  logout() {
    this.router.navigate(['/logout']);
  }
}
