import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IdentityService } from '@identity/identity.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  constructor(private readonly formBuilder: FormBuilder, private readonly identityService: IdentityService) { }
  get formControls() { return this.changePasswordForm.controls; }

  ngOnInit() {
    this.changePasswordForm = this.formBuilder.group({
      newPassword: ['', Validators.compose([Validators.required, Validators.minLength(7)])],
      confirmPassword: ['', Validators.compose([Validators.required, Validators.minLength(7)])],
    });
  }

  onVerficationToken() {
    const token = window.location.href.split('=')[1];
    if (token) {
      this.identityService.resetPassword({key: token, password: ''}).then(response => {

      });
    }
  }
}
