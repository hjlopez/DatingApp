import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../_services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  @Output() cancelRegister = new EventEmitter();
  model: any = {};

  constructor(private authService: AuthService) { }

  ngOnInit(): any {
  }

  register(): any{
    this.authService.register(this.model).subscribe(() => {
      console.log('Registration successful!');
    }, error => {
      console.log(error);
    });

  }

  cancel(): any{
    this.cancelRegister.emit(false);
    console.log('cancelled');
  }

}
