import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { JsonApiService } from './json-api.service';
import { Project } from './models/project';
import { ProjectUser } from './models/project-user';
import { ResourceService } from './resource.service';
import { nameof } from './utils';

@Injectable()
export abstract class ProjectUserService<T extends ProjectUser = ProjectUser> extends ResourceService {
  constructor(
    type: string,
    jsonApiService: JsonApiService,
    private readonly projectType: string,
    private readonly userType: string
  ) {
    super(type, jsonApiService);
  }

  onlineCreate(projectId: string, userId: string, role?: string): Promise<T> {
    const init: Partial<ProjectUser> = {
      project: this.jsonApiService.newResourceRef({ type: this.projectType, id: projectId }),
      user: this.jsonApiService.newResourceRef({ type: this.userType, id: userId }),
      role
    };
    return this.jsonApiService.onlineCreate(this.jsonApiService.newResource(this.type, init) as T);
  }

  onlineDelete(id: string): Promise<void> {
    return this.jsonApiService.onlineDelete(this.identity(id));
  }

  async onlineUpdateRole(id: string, role: string): Promise<void> {
    await this.jsonApiService.onlineUpdateAttributes<ProjectUser>(this.identity(id), { role });
  }

  get(projectId: string, userId: string): Observable<T> {
    return this.jsonApiService
      .getAllRelated<T>({ type: this.projectType, id: projectId }, nameof<Project>('users'))
      .pipe(map(r => r.results.find(pu => pu.user.id === userId)));
  }

  update(projectUser: T): Promise<T> {
    return this.jsonApiService.update(projectUser);
  }
}
