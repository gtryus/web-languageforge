import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { JsonApiService, QueryObservable } from './json-api.service';
import { ProjectUser } from './models/project-user';
import { User } from './models/user';
import { ResourceService } from './resource.service';
import { nameof } from './utils';

@Injectable()
export abstract class UserService extends ResourceService {
  constructor(
    jsonApiService: JsonApiService,
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {
    super(User.TYPE, jsonApiService);
  }

  get currentUserId(): string {
    return this.authService.currentUserId;
  }

  async onlineChangePassword(newPassword: string): Promise<void> {
    const attrs: Partial<User> = { password: newPassword };
    await this.jsonApiService.onlineUpdateAttributes(this.identity(this.currentUserId), attrs);
  }

  onlineGetProjects(id: string): QueryObservable<ProjectUser[]> {
    return this.jsonApiService.onlineGetAllRelated(this.identity(id), nameof<User>('projects'));
  }

  async userAvatarUpload(params: any): Promise<any> {
    const result = await this.callApi('userAvatarUpload', params);
    return result;
  }

  private async callApi(endpoint: string, params: any): Promise<any> {
    return this.http.post('json-api/users/' + endpoint, params).toPromise();
  }
}
