import { Component, OnInit } from '@angular/core';
import {AuthService} from '../_services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  model: any = {}; // gets the username and password values

  constructor(private authService: AuthService) { }

  // tslint:disable-next-line: typedef
  ngOnInit() {
  }

  login(): void{
    this.authService.login(this.model).subscribe(next => {
      console.log('Logged in successfully!');
    }, error => {
      console.log('Failed login');
    });
  }

  loggedIn(): any{
    const token = localStorage.getItem('token');
    return !!token;
  }

  logout(): any{
    localStorage.removeItem('token');
    console.log('logout');
  }
}
