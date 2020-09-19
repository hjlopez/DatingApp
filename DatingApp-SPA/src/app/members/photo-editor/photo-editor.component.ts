import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Photo } from 'src/app/_models/photo';
import { FileUploader } from 'ng2-file-upload';
import { environment } from '../../../environments/environment';
import { AuthService } from 'src/app/_services/auth.service';
import { UserService } from 'src/app/_services/user.service';
import { AlertifyService } from 'src/app/_services/alertify.service';

@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.scss']
})
export class PhotoEditorComponent implements OnInit {
  @Input() photos: Photo[];
  @Output() getMemberPhotoChange = new EventEmitter<string>();
  baseUrl = environment.apiUrl;
  uploader: FileUploader;
  hasBaseDropZoneOver: boolean;
  response: string;
  currentMain: Photo;

  constructor(private authService: AuthService, private userService: UserService, private alertify: AlertifyService) { }

  ngOnInit(): void {
    this.initializeUploader();
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  initializeUploader(): void{
    this.uploader = new FileUploader({
      url: this.baseUrl + 'users/' + this.authService.decodedToken.nameid + '/photos',
      authToken: 'Bearer ' + localStorage.getItem('token'),
      isHTML5: true,
      allowedFileType: ['image'], // only images are allowed
      removeAfterUpload: true, // remove from queue after upload
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024
    });

    this.uploader.onAfterAddingFile = (file) => {file.withCredentials = false; }; // to remove CORS policy error in file upload

    // creating a photo object after successful upload
    this.uploader.onSuccessItem = (item, response, status, headers) => {
      if (response){
        const res: Photo = JSON.parse(response); // convert to object the response
        const photo = { // new object
          id: res.id,
          url: res.url,
          dateAdded: res.dateAdded,
          description: res.description,
          isMain: res.isMain
        };

        this.photos.push(photo);

        if (photo.isMain){ // if first photo uploaded by user automatically set it in nav photo and left side photo
          this.authService.changeMemberPhoto(photo.url); // to match thumbnail photo and photo on left side
          this.authService.currentUser.photoUrl = photo.url; // pass the new url to the user var
          localStorage.setItem('user', JSON.stringify(this.authService.currentUser));
        }
      }
    };
  }

  setMainPhoto(photo: Photo): any{
    this.userService.setMainPhoto(this.authService.decodedToken.nameid, photo.id).subscribe(() => {
      this.currentMain = this.photos.filter(p => p.isMain === true)[0]; // get photo with main = true
      this.currentMain.isMain = false;
      photo.isMain = true; // set selected photo to main
      this.authService.changeMemberPhoto(photo.url); // to match thumbnail photo and photo on left side
      this.authService.currentUser.photoUrl = photo.url; // pass the new url to the user var
      localStorage.setItem('user', JSON.stringify(this.authService.currentUser));
    }, error => {
      this.alertify.error(error);
    });
  }

  deletePhoto(id: number): void{
    this.alertify.confirm('Are you sure you want to delete this photo?', () => {
      this.userService.deletePhoto(this.authService.decodedToken.nameid, id).subscribe(() => {
        this.photos.splice(this.photos.findIndex(p => p.id === id), 1);
        this.alertify.success('Photo has been deleted!');
      }, error => {
        this.alertify.error('Failed to delete photo!');
      });
    });
  }

}
