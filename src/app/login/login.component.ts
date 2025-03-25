import {Component, Input, OnInit} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "../../environments/environment";

// реализация OAuth2, авторизация, GrantType

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // внедрение объектов (Dependency Injection)
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private http: HttpClient) {
  }

  // вызывается автоматически после инициализации компонента
  ngOnInit(): void {

    console.log("loginComponent - ngOnInit");

    // считываем параметры входящего запроса
    this.activatedRoute.queryParams.subscribe(params => {

      // если в запросе "прилетел" параметр code - значит его отправил auth server (потому что в redirect_uri указывали текущую страницу)
      // значит code теперь можем обменять на токены
      if (params['code']) {

        const code = params['code'];
        const state = params['state'];

        // Параметры нужны только 1 раз при первичном запросе
        // Поэтому сразу после использование - очищаем параметры URL запроса, чтобы при обновлении страницы они не отправились повторно и не отображались в адресной строке браузера
        window.history.pushState({}, "", document.location.href.split("?")[0]);

        // получаем токены (access, refresh, id) - в зависимости от указанных ранее значений scope из первичного запроса в auth server
        this.sendToBFF(code, state);

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

    // обязательные параметры для работы PKCE
    const state = this.randomString(40);
    localStorage.setItem('state', state);


    // параметры для запроса на получение authorization code
    const params = [
      'response_type=code',
      'state=' + state, // защита клиента - что ответ от auth server пришел именно на его запрос
      'client_id=' + environment.kcClientID,
      'scope=openid', // какие именно данные хотим получить от auth server (какие токены и пр.)
      'redirect_uri=' + encodeURIComponent(environment.clientLoginURL),
    ];

    // итоговый URL вместе с параметрами
    let url = environment.kcBaseURL +'/auth' +'?' + params.join('&');

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
  private sendToBFF(code: string, state: string) {
    console.log("loginComponent - sendToBFF");

    // если state от auth server совпадает со старым сохраненным значением - значит ответ пришел именно на наш запрос
    if (state !== localStorage.getItem('state') as string) {
      console.log('Invalid state');
      return; // выходим и дальше ничего не выполняем (state обязательног должны совпадать)
    }

    // удаляем сохраненный state, уже не нужен
    localStorage.removeItem('state');


    console.log(code);

    this.http.post(environment.bffURI + '/token', code, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8' // обязательно нужно указывать
      }
    }).subscribe({
      next: ((response: any) => {

        // если запрос на получение токенов в BFF выполнился успешно - значит токены будут сохранены в безопасные куки и будут автоматически отправляться с каждым запросом на BFF

        // и можно переходить на страницу для запроса данных
        this.router.navigate(['/data']);
      }),

      error: (error => {
        console.log(error);
      })
    });

  }
}
