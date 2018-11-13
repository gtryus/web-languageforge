import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { IdentityService } from '@identity/identity.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IdentityVerifyTokenGuard implements CanActivate {
  constructor(private readonly identityService: IdentityService) {
    alert(window.location.href.split('=')[1]);
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    alert(12345);
    // this.identityService.resetPassword({ key: keyToken, password: '' });
    return true;
  }
}
