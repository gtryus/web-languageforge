import { OverlayContainer } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { UICommonModule } from '@xforge-common/ui-common.module';
import { of } from 'rxjs';
import { anything, instance, mock, when } from 'ts-mockito/lib/ts-mockito';

import { UserService } from '@xforge-common/user.service';
import { MyAccountComponent } from './my-account.component';

class MyAccountTestEnvironment {
  component: MyAccountComponent;
  fixture: ComponentFixture<MyAccountComponent>;

  mockedUserService: UserService;
  overlayContainer: OverlayContainer;

  constructor() {
    this.mockedUserService = mock(UserService);
    when(this.mockedUserService.userAvatarUpload(anything())).thenResolve(of(null));

    TestBed.configureTestingModule({
      imports: [UICommonModule, HttpClientTestingModule],
      declarations: [MyAccountComponent],
      providers: [{ provide: UserService, useFactory: () => instance(this.mockedUserService) }]
    });
    this.fixture = TestBed.createComponent(MyAccountComponent);
    this.component = this.fixture.componentInstance;
    this.fixture.detectChanges();
    this.overlayContainer = TestBed.get(OverlayContainer);
  }

  get chooseFileButton(): DebugElement {
    return this.fixture.debugElement.query(By.css('#choose-image-btn'));
  }

  get uploadFileButton(): DebugElement {
    return this.fixture.debugElement.query(By.css('#upload-image-btn'));
  }

  get clearFileButton(): DebugElement {
    return this.fixture.debugElement.query(By.css('#clear-image-btn'));
  }

  clickElement(element: HTMLElement | DebugElement): void {
    if (element instanceof DebugElement) {
      element = (element as DebugElement).nativeElement as HTMLElement;
    }

    element.click();
    tick();
    this.fixture.detectChanges();
  }
}

describe('MyAccountComponent', () => {
  const event = {
    target: {
      files: [
        {
          name: 'test.png',
          size: 5000,
          type: 'image/png'
        }
      ]
    }
  };

  it('choose picture button should be shown when form load', fakeAsync(() => {
    const env = new MyAccountTestEnvironment();
    env.fixture.detectChanges();

    const choosePictureBtn = env.chooseFileButton;
    expect(choosePictureBtn.nativeElement.innerText).toBe('Choose Picture');
    expect(env.component.chooseImageBtn).toBe(true);
    expect(env.component.uploadImageBtn).toBe(false);
    flush();
  }));

  it('click choose picture button should be shown upload and clear button', fakeAsync(() => {
    const env = new MyAccountTestEnvironment();
    env.fixture.detectChanges();
    env.clickElement(env.chooseFileButton);
    env.component.onImageSelected(event);
    env.fixture.detectChanges();
    expect(env.component.chooseImageBtn).toBe(true);
    expect(env.component.uploadImageBtn).toBe(false);
    flush();
  }));
});
