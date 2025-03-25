import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {DataResult, SearchValues, UserProfile} from "../dto/DtoObjects";


/*

Сокращения:
AT - access token
RT - refresh token
IT - id token
RS - resource server

 */

// отображение бизнес данных приложения
// на эту страницу попадаем уже после успешной авторизации в KeyCloak (или любом другом auth server)
@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.css']
})
export class DataComponent implements OnInit {

  dataResult!: DataResult; // бизнес-данные пользователя, может принимать null
  userProfile!: UserProfile; // данные о пользователе, может принимать null

  // внедрение объектов (Dependency Injection)
  constructor(
    private router: Router, // навигация, общие параметры перехода на веб страницу
    private http: HttpClient // для веб запросов
  ) {
  }

  // вызывается автоматически после инициализации компонента
  ngOnInit(): void {

    console.log("dataComponent - ngOnInit");

    // Параметры запроса нужны только 1 раз при первичном запросе
    // Поэтому сразу после использования - очищаем параметры URL запроса, чтобы при обновлении страницы они НЕ отправлялись повторно и не отображались в адресной строке браузера
    window.history.pushState({}, "", document.location.href.split("?")[0]);

    this.requestUserData(); // запрашиваем бизнес-данные с Resource Server

  }

  // получаем новые токены с помощью старого RT
  private exchangeRefreshToken() {

    console.log("dataComponent - exchangeRefreshToken");

    // обмен RT на AT
    this.http.get(environment.bffURI + '/exchange').subscribe(
      {

        // успешное выполнение
        next: (() => {
          this.requestUserData(); // сразу запрашиваем данные с RS
        }),


        // выполнение с ошибкой
        error: (error => {
          console.log(error);

          // если не смогли получить токены - выходим на страницу логина, чтобы запустить заново весь процесс авторизации
          this.redirectToLogin();

        })
      }
    );
  }

  // получаем данные конкретного пользователя из RS
  private requestUserData(): void {

    console.log("dataComponent - requestUserData");

    // в реальном приложении можете передавать любые данные для поиска
    const searchText = new SearchValues("текст для поиска"); // контейнер для данных по поиску

    const body = JSON.stringify(searchText); // преобразуем объект в текстовый JSON

    // DataResult должен быть таким же, как и класс в backend
    this.http.post<DataResult>(environment.bffURI + '/data', body, {
      headers: {
        'Content-Type': 'application/json' // обязательно нужно указывать
      }
    }).subscribe(
      {

        // успешное выполнение
        next: ((response: DataResult) => {

          this.dataResult = response; // после присвоения значения в переменную - оно тут же автоматически отобразится на HTML странице

          this.requestUserProfile(); // можем получить данные пользователя, чтобы отображать в frontend

        }),

        // выполнение с ошибкой
        error: (error => {
          console.log(error);

          // пытаемся обменять RT на AT
          this.exchangeRefreshToken();

        })

      }
    );
  }


  // запрос полных данных пользователя (профайл)
  private requestUserProfile(): void {

    console.log("dataComponent - requestUserProfile");

    this.http.get<UserProfile>(environment.bffURI + '/profile').subscribe(
      {

        // успешное выполнение
        next: ((response: UserProfile) => {

          this.userProfile = response;

        }),

        // выполнение с ошибкой
        error: (error => {
          console.log(error);

          this.redirectToLogin();

        })
      }
    );

  }

  // переходим на страницу авторизации
  private redirectToLogin() {
    console.log("dataComponent - redirectToLogin");

    this.router.navigate(['/login']);
  }


  // выход из системы (очищаем все значения и отправляем запрос logout в auth server, чтобы он тоже выполнил все свои внутренние действия)
  logout(): void {

    console.log("dataComponent - logout");

    this.http.get(environment.bffURI + '/logout').subscribe(
      // можно не обрабатывать next или error
    );

    //  в любом случае выходим на главную страницу
    this.redirectToLogin();


  }
}
