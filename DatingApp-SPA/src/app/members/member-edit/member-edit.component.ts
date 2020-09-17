import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/_models/user';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { AuthService } from 'src/app/_services/auth.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.scss']
})
export class MemberEditComponent implements OnInit {
  @ViewChild('editForm', {static: true}) editForm: NgForm; // get form from html
  user: User;
  photoUrlEdit: string;
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): any{
    if (this.editForm.dirty){
      $event.returnValue = true;
    }
  }

  constructor(private route: ActivatedRoute, private alertify: AlertifyService,
              private userService: UserService, private authService: AuthService) { }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.user = data.user;
    });
    this.authService.currentPhotoUrl.subscribe(photoUrl => this.photoUrlEdit = photoUrl); // pass photurl value to photoUrlEdit
  }

  updateUser(): void{
    this.userService.updateUser(this.authService.decodedToken.nameid, this.user).subscribe(next => {
      this.alertify.success('Profile updated successfully!');
      this.editForm.reset(this.user); // parameter to retain value
    }, error => {
      this.alertify.error(error);
    });
  }

  updateMainPhoto(photoUrl: string): void{
    this.user.photoUrl = photoUrl;
  }

}