import { async, ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { RemoteTranslationEngine } from '@sillsdev/machine';
import Quill, { DeltaStatic } from 'quill';
import { Observable, of } from 'rxjs';
import { Snapshot } from 'sharedb/lib/client';
import { instance, mock, when } from 'ts-mockito';

import { NoticeService } from 'xforge-common/notice.service';
import { RealtimeDoc } from 'xforge-common/realtime-doc';
import { RealtimeOfflineStore } from 'xforge-common/realtime-offline-store';
import { UICommonModule } from 'xforge-common/ui-common.module';
import { SFProject } from '../../core/models/sfproject';
import { SFProjectUser, TranslateProjectUserConfig } from '../../core/models/sfproject-user';
import { TextData } from '../../core/models/text-data';
import { SFProjectUserService } from '../../core/sfproject-user.service';
import { SFProjectService } from '../../core/sfproject.service';
import { SFUserService } from '../../core/sfuser.service';
import { TextService, TextType } from '../../core/text.service';
import { SharedModule } from '../../shared/shared.module';
import { EditorComponent } from './editor.component';
import { SuggestionComponent } from './suggestion.component';

describe('EditorComponent', () => {
  it('should start with no selection', async(async () => {
    const env = new TestEnvironment();
    env.setTranslateConfig({});
    env.fixture.detectChanges();
    await env.fixture.whenStable();
    expect(env.component.sourceLabel).toEqual('Source');
    expect(env.component.targetLabel).toEqual('Target');
    const selection = env.component.target.editor.getSelection();
    expect(selection).toBeNull();
  }));

  it('should select last segment', async(async () => {
    const env = new TestEnvironment();
    env.setTranslateConfig({ selectedTextRef: 'text01', selectedSegment: 'verse_1_1' });
    env.fixture.detectChanges();
    await env.fixture.whenStable();
    expect(env.component.sourceLabel).toEqual('Source');
    expect(env.component.targetLabel).toEqual('Target');
    expect(env.component.target.segmentRef).toEqual('verse_1_1');
    const selection = env.component.target.editor.getSelection();
    expect(selection.index).toEqual(29);
    expect(selection.length).toEqual(0);
  }));
});

const Delta: new () => DeltaStatic = Quill.import('delta');

class MockRealtimeDoc implements RealtimeDoc {
  readonly version: number = 1;
  readonly type: string = 'rich-text';
  readonly pendingOps: any[] = [];

  constructor(public readonly id: string, public readonly data: DeltaStatic) {}

  idle(): Observable<void> {
    return of();
  }

  fetch(): Promise<void> {
    return Promise.resolve();
  }

  ingestSnapshot(_snapshot: Snapshot): Promise<void> {
    return Promise.resolve();
  }

  subscribe(): Promise<void> {
    return Promise.resolve();
  }

  submitOp(_data: any, _source?: any): Promise<void> {
    return Promise.resolve();
  }

  remoteChanges(): Observable<any> {
    return of();
  }

  destroy(): Promise<void> {
    return Promise.resolve();
  }
}

class TestEnvironment {
  readonly component: EditorComponent;
  readonly fixture: ComponentFixture<EditorComponent>;

  mockedSFProjectService = mock(SFProjectService);
  mockedSFUserService = mock(SFUserService);
  mockedSFProjectUserService = mock(SFProjectUserService);
  mockedTextService = mock(TextService);
  mockedNoticeService = mock(NoticeService);
  mockedActivatedRoute = mock(ActivatedRoute);
  mockedRemoteTranslationEngine = mock(RemoteTranslationEngine);
  mockedRealtimeOfflineStore = mock(RealtimeOfflineStore);

  constructor() {
    when(
      this.mockedTextService.connect(
        'text01',
        'source'
      )
    ).thenResolve(this.createTextData('source'));
    when(
      this.mockedTextService.connect(
        'text01',
        'target'
      )
    ).thenResolve(this.createTextData('target'));
    when(this.mockedActivatedRoute.params).thenReturn(of({ projectId: 'project01', textId: 'text01' }));
    when(this.mockedSFUserService.currentUserId).thenReturn('user01');
    when(this.mockedSFProjectService.get('project01')).thenReturn(
      of(
        new SFProject({
          id: 'project01',
          inputSystem: { languageName: 'Target' },
          translateConfig: { enabled: true, sourceInputSystem: { languageName: 'Source' } }
        })
      )
    );
    when(this.mockedSFProjectService.createTranslationEngine('project01')).thenReturn(
      instance(this.mockedRemoteTranslationEngine)
    );

    TestBed.configureTestingModule({
      declarations: [EditorComponent, SuggestionComponent],
      imports: [RouterTestingModule, SharedModule, UICommonModule],
      providers: [
        { provide: SFProjectService, useFactory: () => instance(this.mockedSFProjectService) },
        { provide: SFProjectUserService, useFactory: () => instance(this.mockedSFProjectUserService) },
        { provide: SFUserService, useFactory: () => instance(this.mockedSFUserService) },
        { provide: TextService, useFactory: () => instance(this.mockedTextService) },
        { provide: NoticeService, useFactory: () => instance(this.mockedNoticeService) },
        { provide: ActivatedRoute, useFactory: () => instance(this.mockedActivatedRoute) }
      ]
    });
    this.fixture = TestBed.createComponent(EditorComponent);
    this.component = this.fixture.componentInstance;
  }

  setTranslateConfig(translateConfig: TranslateProjectUserConfig): void {
    when(this.mockedSFProjectUserService.get('project01', 'user01')).thenReturn(
      of(
        new SFProjectUser({
          id: 'projectuser01',
          translateConfig
        })
      )
    );
  }

  private createTextData(textType: TextType): TextData {
    const delta = new Delta();
    delta.insert({ chapter: 1 }, { chapter: { style: 'c' } });
    delta.insert({ verse: 1 }, { verse: { style: 'v' } });
    delta.insert(`${textType}: chapter 1, verse 1.`);
    delta.insert({ verse: 2 }, { verse: { style: 'v' } });
    delta.insert(`${textType}: chapter 1, verse 2.`);
    delta.insert('\n', { para: { style: 'p' } });
    delta.insert({ chapter: 2 }, { chapter: { style: 'c' } });
    delta.insert({ verse: 1 }, { verse: { style: 'v' } });
    delta.insert(`${textType} chapter 1, verse 1.`);
    delta.insert({ verse: 2 }, { verse: { style: 'v' } });
    delta.insert(`${textType} chapter 1, verse 2.`);
    delta.insert('\n', { para: { style: 'p' } });
    delta.insert('\n');
    const doc = new MockRealtimeDoc('text01:' + textType, delta);
    return new TextData(doc, instance(this.mockedRealtimeOfflineStore));
  }
}
