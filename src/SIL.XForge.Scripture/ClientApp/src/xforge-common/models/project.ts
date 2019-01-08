import { ProjectUserRef } from './project-user';
import { Resource, ResourceRef } from './resource';

export abstract class Project extends Resource {
  projectName?: string;
  users?: ProjectUserRef[];

  abstract get taskNames(): string[];
}

export abstract class ProjectRef extends ResourceRef {
  static readonly TYPE = Project.TYPE;

  constructor(id: string) {
    super(ProjectRef.TYPE, id);
  }
}
