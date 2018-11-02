import { Injectable } from '@angular/core';

import { GetAllParameters, JSONAPIService } from '@xforge-common/jsonapi.service';
import { LiveQueryObservable } from '@xforge-common/live-query-observable';
import { ResourceService } from '@xforge-common/resource.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable } from 'rxjs';
import { SFProject } from '../app/shared/models/sfproject';
import { SFProjectUser } from '../app/shared/models/sfproject-user';
import { SFUser, SFUserRef } from '../app/shared/models/sfuser';
import { Project } from './models/project';
import { nameof } from '@xforge-common/utils';

@Injectable()
export class ProjectService<T extends Project = Project> extends ResourceService {
  constructor(jsonApiService: JSONAPIService, public readonly oauthService: OAuthService) {
    super(Project.TYPE, jsonApiService);
  }

  getAll(parameters?: GetAllParameters<T>, include?: string[]): LiveQueryObservable<T[]> {
    return this.jsonApiService.getAll(this.type, parameters, include);
  }

  update(project: T): Promise<void> {
    return this.jsonApiService.update(project);
  }

  onlineCreate(project: T): Promise<string> {
    return this.jsonApiService.onlineCreate(project);
  }

  get currentUserId(): string {
    const claims = this.oauthService.getIdentityClaims();
    return claims['sub'];
  }

  onlineGetAllProject(): Observable<any> {
    return this.jsonApiService.onlineGetAllRelated({ id: this.currentUserId, type: SFUser.TYPE }, nameof<SFUser>('projects'));
  }

  onlineAddAsMember(): Promise<any> {
    const attrs: Partial<Project> = {  projectName: 'test',  };
    return this.jsonApiService.onlineUpdateAttributes( { id: '5bd087621c9d4456b26a6f88', type: SFProject.TYPE }, attrs, false);
  }
}
