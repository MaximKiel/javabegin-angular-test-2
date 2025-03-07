import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrl: './data.component.css'
})
export class DataComponent implements OnInit {

  name = "Test name";
  disabled = false;

  constructor() {
  }

  ngOnInit(): void {
    }

  changeName() {
    this.name = "New test name";
  }

  changeDisabled() {
    this.disabled = !this.disabled;
  }
}
