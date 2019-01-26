import { MdcDialog, MdcDialogConfig } from '@angular-mdc/web';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { Question, QuestionSource } from '../../core/models/question';
import { VerseRef } from '../../core/models/scripture/verse-ref';
import { QuestionService } from '../../core/question.service';
import { SFAdminAuthGuard } from '../../shared/sfadmin-auth.guard';
import { QuestionDialogComponent, QuestionDialogData } from '../question-dialog/question-dialog.component';

@Component({
  selector: 'app-checking-overview',
  templateUrl: './checking-overview.component.html',
  styleUrls: ['./checking-overview.component.scss']
})
export class CheckingOverviewComponent implements OnInit {
  isProjectAdmin$: Observable<boolean>;

  constructor(
    private readonly dialog: MdcDialog,
    private readonly adminAuthGuard: SFAdminAuthGuard,
    private readonly questionService: QuestionService
  ) {}

  ngOnInit() {
    this.isProjectAdmin$ = this.adminAuthGuard.allowTransition();
  }

  questionDialog(newMode = false) {
    const dialogConfig = {
      data: {
        newMode
      } as QuestionDialogData
    } as MdcDialogConfig;
    const dialogRef = this.dialog.open(QuestionDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result !== 'close') {
        const MAT_BOOK_NUM = 39;
        const question = new Question({
          source: QuestionSource.Created,
          scriptureStart: new VerseRef(MAT_BOOK_NUM, 3, 1),
          scriptureEnd: new VerseRef(MAT_BOOK_NUM, 3, 2),
          text: 'test question'
        });
        this.questionService.create(question).then(q => console.log('q', q));
      }
    });
  }
}
