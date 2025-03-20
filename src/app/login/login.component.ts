import {Component, OnInit} from '@angular/core';
import * as CryptoES from 'crypto-es';
import {environment} from "../../environments/environment";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpClient, HttpParams} from "@angular/common/http";




// реализация OAuth2, авторизация, GrantType

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // внедрение объектов (Dependency Injection)
  constructor(
    private activatedRoute: ActivatedRoute, // для считывания параметров входящего запроса
    private router: Router, // для навигации
    private http: HttpClient // для веб запросов
  ) {
  }

  // вызывается автоматически после инициализации компонента
  ngOnInit(): void {

    console.log("loginComponent - ngOnInit");

    // считываем параметры входящего запроса
    this.activatedRoute.queryParams.subscribe(params => {

      // если в запросе пришел параметр code - значит его отправил auth server (потому что в redirect_uri указывали текущую страницу)
      // значит code теперь можем обменять на токены
      if (params['code']) {

        const code = params['code']; // его будем обменить на токены
        const state = params['state']; // нужен для сравнения с первоначальным значением

        // Параметры нужны только 1 раз при первичном запросе
        // Поэтому сразу после использование - очищаем параметры URL запроса, чтобы при обновлении страницы они не отправились повторно и не отображались в адресной строке браузера
        window.history.pushState({}, "", document.location.href.split("?")[0]);

        console.log(code);
        console.log(state);

        // получаем токены (access, refresh, id) - в зависимости от указанных ранее значений scope из первичного запроса в auth server
        this.getTokens(code, state);

        return; // обязательно выходим из метода, чтобы не выполнялся дальнейший код

      }

      console.log("start pkce from begin")

      // если никакие другие условия выше не сработали
      this.startPKCE(); // запускаем зановог весь цикл PKCE для получения токенов

    });

  }

  // запускаем зановог весь цикл PKCE для получения токенов
  private startPKCE() {

    console.log("loginComponent - startPKCE");

    // обязатиельные параметры для работы PKCE
    const state = this.randomString(40);
    const codeVerifier = this.randomString(128);


    // сохраняем временные значения, чтобы затем сверять их при получении ответа от auth server
    localStorage.setItem('state', state); // для проверки на стороне клиента, что пришел ответ от auth server именно на его запрос
    localStorage.setItem('codeVerifier', codeVerifier); // для проверки на стороне auth server, что запрос пришел именно от этого клиента

    // получаем хеш значение на основе  codeVerifier (используем готовую крипто библиотеку)
    // заменяем символы согласно требованиям RFC https://datatracker.ietf.org/doc/html/rfc7636#section-4
    const codeChallenge = CryptoES.default.SHA256(codeVerifier).toString(CryptoES.default.enc.Base64)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');


    // параметры для запроса на получение authorization code
    const params = [
      'response_type=code', // хотим получить auth code, который затем поменяем на токены
      'state=' + state, // защита клиента - что ответ от auth server пришел именно на его запрос
      'client_id=' + environment.kcClientID, // настройки из KC
      'scope=openid', // какие именно данные хотим получить от auth server (какие токены и пр.)
      'code_challenge=' + codeChallenge, //  в след. запросе на получение токенов - значение codeChallenge будет сравниваться в auth server со значением на основе code_verifier - чтобы убедиться, что оба запроса пришли от того же пользователя
      'code_challenge_method=S256',
      'redirect_uri=' + encodeURIComponent(environment.clientLoginURL),
    ];

    // итоговый URL вместе с параметрами
    let url = environment.kcBaseURL + '/auth' + '?' + params.join('&');

    console.log(url);

    // откроется окно авторизации
    window.open(url, '_self'); // self - значит в этом же окне

  }

  // генератор случайных символов - для state (параметр запроса PKCE)
  private randomString(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }


  // получение токенов (обмен authorization code на токены)
  private getTokens(code: string, state: string) {
    console.log("loginComponent - getTokens");

    // если state от auth server совпадает со старым сохраненным значением - значит ответ пришел именно на наш запрос
    if (state !== localStorage.getItem('state') as string) {
      console.log('Invalid state');
      return; // выходим и дальше ничего не выполняем (state обязательног должны совпадать)
    }

    // удаляем сохраненный state, уже не нужен
    localStorage.removeItem('state');

    // для запроса понадобится исходное значение codeVerifier
    // auth server будет генерировать codeChallenge и сравнивать переданным codeVerifier
    // таким образом auth server убеждается, что запрос поступил именно от этого пользователя (который авторизовался)
    const codeVerifier = localStorage.getItem('codeVerifier') as string;
    localStorage.removeItem('codeVerifier'); // удаляем, нужен только 1 раз при запросе

    // параметры запроса для получения токенов
    const body = new HttpParams()
      .append('grant_type', 'authorization_code') // флаг, что обмениваем на токены полученный ранее code
      .append('code', code) // полученный code после успешной авторизации
      .append('code_verifier', codeVerifier) // для проверки, что запрос пришел именно от пользователя, который авторизовался ранее
      .append('redirect_uri', environment.clientLoginURL) // куда будут отправлены токены
      .append('client_id', environment.kcClientID); // из настроек KC


    // выполнение запроса
    this.http.post(environment.kcBaseURL + '/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded' // обязательно нужно указывать
      }
    }).subscribe({

      next: ((response: any) => {

        // сохраняем полученные токены (access token можно не сохранять, достаточно будет refresh token)
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('id_token', response.id_token);
        //localStorage.setItem('access_token', response.access_token); // показано для примера, не нужно сохранять


        // передаем access token на страницу с данными, чтобы их можно было получить из Resource Server
        this.router.navigate(['/data'], {queryParams: {token: response.access_token}});

      }),

      error: ((error:any) => {
        console.log(error);
      })


    });


  }

}
