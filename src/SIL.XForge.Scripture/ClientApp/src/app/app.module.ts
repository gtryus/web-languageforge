import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatGridListModule, MatInputModule, MatListModule, MatOptionModule,
  MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule, MatSelectModule, MatSnackBarModule, MatTableModule
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { ChangePasswordComponent } from '@xforge-common/change-password/change-password.component';
import { XForgeCommonModule } from '@xforge-common/xforge-common.module';
import { AppComponent } from './app.component';
import { ConnectProjectComponent } from './connect-project/connect-project.component';
import { CoreModule } from './core/core.module';
import { CounterComponent } from './counter/counter.component';
import { FetchDataComponent } from './fetch-data/fetch-data.component';
import { HomeComponent } from './home/home.component';
import { MyprojectsComponent } from './myprojects/myprojects.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';

// import { DetailSnackBarComponent } from './notice/detail-snack-bar.component';
import { CdkTableModule } from '@angular/cdk/table';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';
import { ConnectToParatextComponent } from './connect-to-paratext/connect-to-paratext.component';
// import { NoticeComponent } from './notice/notice.component';
import { ProjectComponent } from './project/project.component';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    CounterComponent,
    FetchDataComponent,
    ConnectProjectComponent,
    // NoticeComponent,
    ConnectProjectComponent,
    MyprojectsComponent,
    ConnectToParatextComponent,
    ProjectComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    BrowserAnimationsModule,
    CoreModule,
    FormsModule,
    FlexLayoutModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    // NgbModule,
    PasswordStrengthMeterModule,
    CdkTableModule,
    MatGridListModule,
    MatInputModule,
    MatListModule,
    MatPaginatorModule,
    MatTableModule,
    ReactiveFormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'counter', component: CounterComponent },
      { path: 'fetch-data', component: FetchDataComponent },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: 'connect-project', component: ConnectProjectComponent },
      { path: 'myprojects', component: MyprojectsComponent },
      { path: 'connect-to-Paratext', component: ConnectToParatextComponent },
      { path: 'project', component: ProjectComponent }
    ]),
    XForgeCommonModule
  ],
  providers: [],
  entryComponents: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
