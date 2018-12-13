import { Component } from '@angular/core';

import { NoticeService } from '@xforge-common/notice.service';
import { UserService } from '@xforge-common/user.service';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent {
  url: any = null;
  selectedFile: File;
  userName: string = '';
  headerTitle: string = 'My Account';

  chooseImageBtn: boolean = true;
  uploadImageBtn: boolean = false;
  constructor(private readonly userService: UserService, private readonly noticeService: NoticeService) {}

  onImageSelected(event: any): void {
    this.readUrl(event);
  }

  private readUrl(event: any): void {
    if (event.target.files && event.target.files[0]) {
      if (event.target.files.length <= 1) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent) => {
          this.url = (<FileReader>e.target).result;
        };
        reader.readAsDataURL(event.target.files[0]);
        this.selectedFile = event.target.files[0];
        this.chooseImageBtn = false;
        this.uploadImageBtn = true;
      } else {
        const uploadErrorMessage = 'Please choose only one image at a time';
        this.noticeService.push(NoticeService.SUCCESS, uploadErrorMessage);
      }
    }
  }

  handleDrop(event: any): void {
    this.handleInputChange(event);
  }

  private handleInputChange(e: any): void {
    if (e.dataTransfer.files.length <= 1) {
      const file = e.dataTransfer ? e.dataTransfer.files[0] : 'null';
      const pattern = /image-*/;
      const reader = new FileReader();
      if (!file.type.match(pattern)) {
        const uploadErrorMessage = 'Please choose valid images only';
        this.noticeService.push(NoticeService.SUCCESS, uploadErrorMessage);
        return;
      }
      reader.onload = this.handleReaderLoaded.bind(this);
      reader.readAsDataURL(file);
      this.chooseImageBtn = false;
      this.uploadImageBtn = true;
      this.selectedFile = file;
    } else {
      const uploadErrorMessage = 'Please choose only one image at a time';
      this.noticeService.push(NoticeService.SUCCESS, uploadErrorMessage);
    }
  }

  private handleReaderLoaded(e: any): void {
    const reader = e.target;
    this.url = reader.result;
  }

  dropzoneState($event: boolean): void {}

  onClearImage(): void {
    this.selectedFile = null;
    this.url = null;
    this.uploadImageBtn = false;
    this.chooseImageBtn = true;
  }

  async onAvatarUpload() {
    if (this.selectedFile) {
      const formData: FormData = new FormData();
      formData.append('Image', this.selectedFile);
      formData.append('UserName', 'admin');
      await this.userService.userAvatarUpload(formData).then(data => {
        if (data.fileName) {
          const uploadSuccessMessage = 'Image Uploaded Successfully';
          this.noticeService.push(NoticeService.SUCCESS, uploadSuccessMessage);
          this.chooseImageBtn = true;
          this.uploadImageBtn = false;
        }
      });
    }
  }
}
