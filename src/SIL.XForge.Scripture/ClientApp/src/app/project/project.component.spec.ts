import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { RecordIdentity } from '@orbit/data';
import { QueryResults } from '@xforge-common/json-api.service';
import { Resource } from '@xforge-common/models/resource';
import { ProjectService } from '@xforge-common/project.service';
import { UICommonModule } from '@xforge-common/ui-common.module';
import { of } from 'rxjs';
import { instance, mock, when } from 'ts-mockito';
import { SFProject } from '../core/models/sfproject';
import { ProjectComponent } from './project.component';

describe('ProjectComponent', () => {
  let env: TestEnvironment;
  beforeEach(() => {
    env = new TestEnvironment();
    env.fixture.detectChanges();
  });

  it('can load a project', () => {
    expect(env.getProjectHeading()).toEqual('Project 01');
  });

  it('questions are displaying', () => {
    expect(env.getQuestions().children.length).toEqual(2);
  });

  it('can select a question', () => {
    const question = env.selectQuestion(1);
    expect(question.classes['mdc-list-item--activated']).toBeTruthy();
  });

  it('question status change to read', done => {
    const question = env.selectQuestion(2);
    // Wait for the 1 second time out before the state of the question changes
    setTimeout(function() {
      env.fixture.detectChanges();
      expect(question.classes['question-read']).toBeTruthy();
      done();
    }, 1001);
  });

  it('question status change to answered', done => {
    let question = env.selectQuestion(2);
    // Wait for the 1 second time out before the state of the question changes
    setTimeout(function() {
      question = env.selectQuestion(1);
      question = env.selectQuestion(2);
      setTimeout(function() {
        env.fixture.detectChanges();
        expect(question.classes['question-answered']).toBeTruthy();
        done();
      }, 1001);
    }, 1001);
  });

  it('question shows answers icon and total', done => {
    let question = env.selectQuestion(2);
    // Wait for the 1 second time out before the state of the question changes
    setTimeout(function() {
      question = env.selectQuestion(1);
      question = env.selectQuestion(2);
      setTimeout(function() {
        env.fixture.detectChanges();
        expect(question.query(By.css('.view-answers span')).nativeElement.textContent).toEqual('1');
        done();
      }, 1001);
    }, 1001);
  });
});

class TestQueryResults<T> implements QueryResults<T> {
  constructor(public readonly results: T, public readonly totalPagedCount?: number) {}

  getIncluded<TInclude extends Resource>(identity: RecordIdentity): TInclude {
    return undefined;
  }

  getManyIncluded<TInclude extends Resource>(identities: RecordIdentity[]): TInclude[] {
    return [];
  }
}

class TestEnvironment {
  component: ProjectComponent;
  fixture: ComponentFixture<ProjectComponent>;

  mockedRouter: Router;
  mockedProjectService: ProjectService;
  constructor() {
    this.mockedRouter = mock(Router);
    this.mockedProjectService = mock(ProjectService);

    TestBed.configureTestingModule({
      declarations: [ProjectComponent],
      imports: [UICommonModule],
      providers: [
        { provide: Router, useFactory: () => instance(this.mockedRouter) },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: 'project01' }) }
        },
        { provide: ProjectService, useFactory: () => instance(this.mockedProjectService) }
      ]
    });
    this.setupProjectData();
    this.fixture = TestBed.createComponent(ProjectComponent);
    this.component = this.fixture.componentInstance;
  }

  setupProjectData(): void {
    when(this.mockedProjectService.get('project01')).thenReturn(
      of(
        new TestQueryResults<SFProject>(
          new SFProject({
            id: 'project01',
            projectName: 'Project 01'
          })
        )
      )
    );
  }

  getProjectHeading(): string {
    return this.fixture.debugElement.query(By.css('h1')).nativeElement.textContent;
  }

  getQuestions(): DebugElement {
    return this.fixture.debugElement.query(By.css('#questions-panel .mdc-list-item'));
  }

  selectQuestion(questionNumber: number): DebugElement {
    const question = this.fixture.debugElement.query(
      By.css('#questions-panel .mdc-list-item:nth-child(' + questionNumber + ')')
    );
    question.nativeElement.click();
    this.fixture.detectChanges();
    return question;
  }
}
