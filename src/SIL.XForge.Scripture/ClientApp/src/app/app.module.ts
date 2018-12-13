import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';

import { IdentityModule } from '@identity/identity.module';
import { InviteDialogComponent } from '@xforge-common/email-invite/invite-dialog.component';
// import { ImageDragDropDirective } from '@xforge-common/image-drag-drop/image-drag-drop.directive';
import { DetailSnackBarComponent } from '@xforge-common/notice/detail-snack-bar.component';
import { UICommonModule } from '@xforge-common/ui-common.module';
import { XForgeCommonModule } from '@xforge-common/xforge-common.module';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConnectProjectComponent } from './connect-project/connect-project.component';
import { CoreModule } from './core/core.module';
import { CounterComponent } from './counter/counter.component';
import { FetchDataComponent } from './fetch-data/fetch-data.component';
import { HomeComponent } from './home/home.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { RealtimeComponent } from './realtime/realtime.component';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    HomeComponent,
    CounterComponent,
    FetchDataComponent,
    ConnectProjectComponent,
    RealtimeComponent,
    MyAccountComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    BrowserAnimationsModule,
    CoreModule,
    HttpClientModule,

    // not ready for production yet - 2018-11 IJH
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.pwaTest }), // || environment.production }),
    SharedModule,
    IdentityModule,
    UICommonModule,
    XForgeCommonModule
  ],
  entryComponents: [DetailSnackBarComponent, InviteDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
