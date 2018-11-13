import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { IdentityVerifyTokenGuard } from '@identity/identity-verify-token.guard';
import { ResetPasswordComponent } from '@identity/reset-password/reset-password.component';
import { LogInComponent } from './log-in/log-in.component';

const routes: Routes = [
  { path: 'log-in', component: LogInComponent },
  { path: 'reset-password', component: ResetPasswordComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IdentityRoutingModule { }
