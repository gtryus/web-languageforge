import { Injectable } from '@angular/core';
import { Record } from '@orbit/data';

import { JsonApiService } from 'xforge-common/json-api.service';
import { InputSystem } from 'xforge-common/models/input-system';
import { ProjectService } from 'xforge-common/project.service';
import { nameof } from 'xforge-common/utils';
import { SFProject } from './models/sfproject';
import { ProjectRole, SFProjectRoles } from './models/sfproject-roles';

@Injectable({
  providedIn: 'root'
})
export class SFProjectService extends ProjectService<SFProject> {
  private static readonly ROLES: ProjectRole[] = [
    { role: SFProjectRoles.ParatextAdministrator, displayName: 'Administrator' },
    { role: SFProjectRoles.ParatextTranslator, displayName: 'Translator' }
  ];

  constructor(jsonApiService: JsonApiService) {
    super(SFProject.TYPE, jsonApiService, SFProjectService.ROLES);
  }

  protected isSearchMatch(record: Record, value: string): boolean {
    if (super.isSearchMatch(record, value)) {
      return true;
    }

    const inputSystem = record.attributes[nameof<SFProject>('inputSystem')] as InputSystem;
    if (inputSystem != null && inputSystem.languageName.toLowerCase().includes(value)) {
      return true;
    }
    return false;
  }
}
