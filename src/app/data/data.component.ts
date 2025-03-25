import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {HttpClient, HttpParams} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {jwtDecode} from "jwt-decode";


// отображение бизнес данных приложения
// на эту страницу попадаем уже после успешной авторизации в KeyCloak (или любом другом auth server)
@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.css']
})
export class DataComponent implements OnInit {

  // данные с Resource Server, которые нужно отобразить на странице (поэтому не ставим private)
  data = "";

  // для временного глобального хранения значений токенов (будут доступны только врнутри класса)
  // к ним нельзя обратиться со страницы HTML (только с помощью отдельного метода get)
  private accessToken: any = "";
  private refreshToken: any = "";
  private idToken: any = "";
  private jwt: any = "";

  // внедрение объектов (Dependency Injection)
  constructor(
    private router: Router, // навигация, общие параметры перехода на веб страницу
    private http: HttpClient, // для веб запросов
    private activatedRoute: ActivatedRoute, // содержит служебные данные роута, через который попали на этот компонент
  ) {
  }

  // вызывается автоматически после инициализации компонента
  ngOnInit(): void {

    console.log("dataComponent - ngOnInit");

    // считываем параметры входящего запроса
    this.activatedRoute.queryParams.subscribe(params => {

      // пытаемся считать параметр - если он будет не пустым, значит его прислали из страницы login после успешной авторизации
      this.accessToken = params['token'];

      this.idToken = localStorage.getItem('id_token') as string;
      if (this.idToken) {
        this.jwt = jwtDecode(this.idToken); // получаем не JSON, а сразу готовый объект, у которого можно запрашивать любые поля
      }


      if (this.accessToken) {

        console.log("using access token from param");

        // Параметры нужны только 1 раз при первичном запросе
        // Поэтому сразу после использование - очищаем параметры URL запроса, чтобы при обновлении страницы они не отправились повторно и не отображались в адресной строке браузера
        window.history.pushState({}, "", document.location.href.split("?")[0]);

        this.getUserData(this.accessToken); // запрашиваем бизнес-данные с Resource Server
        return; // выходим обязательно, чтоыб далее код не выполнялся

      }

      // пытаемся считать сохраненные токены (если были)
      this.refreshToken = localStorage.getItem('refresh_token') as string;

      if (this.refreshToken) {

        console.log("dataComponent - using refresh token from LS")

        // получаем новые токены в обмен на старый refresh token
        this.exchangeRefreshToken(this.refreshToken);

        return; // выходим обязательно, чтоыб далее код не выполнялся
      }


      // если никакие из условий не выполнились - отправляем на страницу login, чтобы получить новые токены
      this.router.navigate(['/login']);


    });


  }


  // получение email из claims jwt (id token)
  // похожим способом можем получить любые данные из jwt, для каждого нужно создать свой get и к нему можно обращаться с HTML страницы
  get email() {
    return this.jwt.email;
  }



  // получаем новые токены с помощью старого refresh token
  private exchangeRefreshToken(refreshToken: string) {

    console.log("dataComponent - exchangeRefreshToken");


    const body = new HttpParams()
      .append('grant_type', 'refresh_token')
      .append('client_id', environment.kcClientID)
      .append('refresh_token', refreshToken); // вкладываем старый refreshToken

    this.http.post<any>(environment.kcBaseURL+'/token', body).subscribe(

      {

        // успешное выполнение
        next: ((response: any) => {
          // обновляем сохраненные токены
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('id_token', response.id_token);

          this.getUserData(response.access_token); // заново вызываем resource server

        }),

        // выполнение с ошибкой
        error: (error => {
          console.log(error);

          this.redirectToLogin();

        })
      }
    );
  }

  // очищаем все данные и переходим на страницу авторизации (что-то пошло не так)
  private redirectToLogin() {
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');

    // если никакие из условий не выполнились - отправляем на страницу login
    this.router.navigate(['/login']);
  }


  // запрос в Resource Server - ради чего и "затевалось" приложение
  // получаем данные конкретного пользователя
  private getUserData(token: string): void {

    const data = {email: this.email}; // данные, которые хотим отправить на сервер (могут быть данные для поиска)
    const body = JSON.stringify(data);

    this.http.post<any>(environment.backendURL + '/user/data', body, {
      headers: {
        'Authorization': 'Bearer ' + token, // добавляем access token, иначе сервер не пропустит запрос)
        'Content-Type': 'application/json' // обязательно нужно указывать
      }
    }).subscribe(
      {

        // успешное выполнение
        next: ((response: any) => {

          this.data = response.data; // после присвоения значения в переменную - оно тут же автоматически отобразится на HTML странице

        }),

        // выполнение с ошибкой
        error: (error => {
          console.log(error);

          this.redirectToLogin();

        })

      }
    );
  }


  // выход из системы (очищаем все значения и отправляем запрос logout в auth server, чтобы он тоже выполнил все свои внутренние действия)
  logout(): void {

    // обязательные параметры для logout апроса в auth server
    const params = [
      'post_logout_redirect_uri=' + environment.clientLoginURL, // куда переходить после logout
      'id_token_hint=' + this.idToken, // должны приложить idToken, чтобы auth serve понял для кого выполняем logout
      'client_id=' + environment.kcClientID
    ];

    // собираем итоговый запрос
    let logoutURL = environment.kcBaseURL+'/logout' + '?' + params.join('&');

    // открываем окно с запросом, которое после выполнения автоматически закроется и запрнос перенаправится согласно значению post_logout_redirect_uri
    window.open(logoutURL, '_self'); // self - значит в этом же окне

    // очищаем все данные
    this.accessToken = "";
    this.idToken = ""
    this.refreshToken = ""

    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');

  }


}



