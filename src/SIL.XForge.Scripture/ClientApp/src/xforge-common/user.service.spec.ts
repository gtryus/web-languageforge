import { inject, TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';

import { UserService } from './user.service';

describe('UserService', () => {
  const oauthServiceStub = {
    getAccessToken() { return 'token'; }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: OAuthService, useValue: oauthServiceStub }
      ]
    });
  });

  it('should be created', inject([UserService], (service: UserService) => {
    expect(service).toBeTruthy();
  }));
});
