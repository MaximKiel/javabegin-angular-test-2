import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  email = "";

  constructor(
    private router: Router // навигация, общие параметры перехода на веб страницу
  ) {
  }

  ngOnInit(): void {

  }

  openDataPage() {
    this.router.navigate(['/data'], {queryParams: {email: this.email}});

  }
}
