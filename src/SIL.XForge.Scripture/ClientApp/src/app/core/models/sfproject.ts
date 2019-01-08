import { SFProjectBase } from './sfproject.generated';

export class SFProject extends SFProjectBase {
  constructor(init?: Partial<SFProject>) {
    super(init);
  }

  get taskNames(): string[] {
    const names: string[] = [];
    if (this.checkingConfig != null && this.checkingConfig.enabled) {
      names.push('Community Checking');
    }
    if (this.translateConfig != null && this.translateConfig.enabled) {
      names.push('Translate');
    }
    return names;
  }
}
