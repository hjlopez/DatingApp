import { Component, OnInit } from '@angular/core';
import {AuthService} from '../_services/auth.service';
import {AlertifyService} from '../_services/alertify.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  model: any = {}; // gets the username and password values

  constructor(public authService: AuthService, private alertify: AlertifyService,
              private router: Router) { }

  // tslint:disable-next-line: typedef
  ngOnInit() {
  }

  login(): void{
    this.authService.login(this.model).subscribe(next => {
      this.alertify.success('Logged in successfully!');
      // this.router.navigate(['/members']);
    }, error => {
      this.alertify.error(error);
    }, () => {
      this.router.navigate(['/members']);
    });
  }

  loggedIn(): any{
    return this.authService.loggedIn();
  }

  logout(): any{
    localStorage.removeItem('token');
    this.alertify.message('logout');
    this.router.navigate(['/home']);
  }
}
