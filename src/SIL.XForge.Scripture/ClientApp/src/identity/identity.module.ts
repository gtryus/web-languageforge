import { CommonModule, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';

import { IdentityVerifyTokenGuard } from '@identity/identity-verify-token.guard';
import { LocationService } from '@xforge-common/location.service';
import { UICommonModule } from '@xforge-common/ui-common.module';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';
import { IdentityRoutingModule } from './identity-routing.module';
import { IdentityService } from './identity.service';
import { LogInComponent } from './log-in/log-in.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

@NgModule({
  declarations: [LogInComponent, ResetPasswordComponent],
  imports: [
    CommonModule,
    IdentityRoutingModule,
    UICommonModule,
    PasswordStrengthMeterModule
  ],
  providers: [IdentityService]
})
export class IdentityModule { }
