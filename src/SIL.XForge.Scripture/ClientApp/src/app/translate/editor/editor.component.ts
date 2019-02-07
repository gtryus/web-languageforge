import { AfterViewInit, Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  InteractiveTranslationSession,
  LatinWordTokenizer,
  MAX_SEGMENT_LENGTH,
  PhraseTranslationSuggester,
  RemoteTranslationEngine,
  Tokenizer,
  TranslationSuggester
} from '@sillsdev/machine';
import Quill, { DeltaStatic, RangeStatic } from 'quill';
import { switchMap, tap } from 'rxjs/operators';

import { NoticeService } from 'xforge-common/notice.service';
import { SubscriptionDisposable } from 'xforge-common/subscription-disposable';
import { SFProject } from '../../core/models/sfproject';
import { SFProjectUser } from '../../core/models/sfproject-user';
import { SFProjectUserService } from '../../core/sfproject-user.service';
import { SFProjectService } from '../../core/sfproject.service';
import { SFUserService } from '../../core/sfuser.service';
import { TextType } from '../../core/text.service';
import { Segment } from '../../shared/text/segment';
import { INITIAL_BLANK_TEXT, isBlankText, NORMAL_BLANK_TEXT, TextComponent } from '../../shared/text/text.component';
import { SuggestionComponent } from './suggestion.component';

const Delta: new () => DeltaStatic = Quill.import('delta');

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent extends SubscriptionDisposable implements OnInit, AfterViewInit {
  @HostBinding('class') classes = 'flex-column flex-grow';

  textId?: string;
  suggestion: string[] = [];
  suggestionConfidence: number = 0;
  targetModules: any;

  @ViewChild('source') source: TextComponent;
  @ViewChild('target') target: TextComponent;
  @ViewChild(SuggestionComponent) suggestionView: SuggestionComponent;

  private translationEngine: RemoteTranslationEngine;
  private isTranslating: boolean = false;
  private readonly sourceWordTokenizer: Tokenizer;
  private readonly targetWordTokenizer: Tokenizer;
  private translationSession?: InteractiveTranslationSession;
  private readonly translationSuggester: TranslationSuggester = new PhraseTranslationSuggester();
  private insertSuggestionEnd: number = -1;
  private projectUser: SFProjectUser;
  private project: SFProject;
  private sourceLoaded: boolean = false;
  private targetLoaded: boolean = false;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly userService: SFUserService,
    private readonly projectService: SFProjectService,
    private readonly projectUserService: SFProjectUserService,
    private readonly noticeService: NoticeService
  ) {
    super();
    const wordTokenizer = new LatinWordTokenizer();
    this.sourceWordTokenizer = wordTokenizer;
    this.targetWordTokenizer = wordTokenizer;

    this.translationSuggester.confidenceThreshold = 0.2;

    this.targetModules = {
      keyboard: { bindings: {} }
    };

    for (let i = -1; i < 9; i++) {
      const numKey = (i + 1).toString();
      this.targetModules.keyboard.bindings['insertSuggestion' + numKey] = {
        key: numKey,
        shortKey: true,
        handler: () => this.insertSuggestion(i)
      };
    }
  }

  get sourceLabel(): string {
    return this.project == null ? '' : this.project.translateConfig.sourceInputSystem.languageName;
  }

  get targetLabel(): string {
    return this.project == null ? '' : this.project.inputSystem.languageName;
  }

  get isTargetTextRight(): boolean {
    return this.projectUser == null ? true : this.projectUser.translateConfig.isTargetTextRight;
  }

  set isTargetTextRight(value: boolean) {
    if (this.isTargetTextRight !== value) {
      this.projectUser.translateConfig.isTargetTextRight = value;
      this.target.focus();
      this.projectUserService.update(this.projectUser);
    }
  }

  private get isSelectionAtSegmentEnd(): boolean {
    const selection = this.target.editor.getSelection();
    if (selection == null) {
      return false;
    }
    const selectionEndIndex = selection.index + selection.length;
    const segmentEndIndex = this.target.segment.range.index + this.target.segment.range.length;
    return selectionEndIndex === segmentEndIndex;
  }

  ngOnInit(): void {
    this.subscribe(
      this.activatedRoute.params.pipe(
        tap(params => {
          this.sourceLoaded = false;
          this.targetLoaded = false;
          this.noticeService.loadingStarted();
          this.textId = params['textId'];
          this.translationEngine = this.projectService.createTranslationEngine(params['projectId']);
        }),
        switchMap(params => this.projectService.get(params['projectId']))
      ),
      project => (this.project = project)
    );
  }

  ngAfterViewInit(): void {
    this.subscribe(
      this.activatedRoute.params.pipe(
        switchMap(params => this.projectUserService.get(params['projectId'], this.userService.currentUserId))
      ),
      pu => {
        this.projectUser = pu;
        if (this.projectUser != null) {
          const config = this.projectUser.translateConfig;
          if (config.isTargetTextRight == null) {
            config.isTargetTextRight = true;
          }
          if (config.selectedTextRef === this.textId && config.selectedSegment !== '') {
            this.target.switchSegment(config.selectedSegment, config.selectedSegmentChecksum, true);
          }
        }
      }
    );
  }

  async onTargetUpdated(segment: Segment, delta?: DeltaStatic, prevSegment?: Segment): Promise<void> {
    if (segment !== prevSegment) {
      this.source.switchSegment(this.target.segmentRef);

      this.insertSuggestionEnd = -1;
      if (
        this.projectUser != null &&
        this.target.segmentRef !== '' &&
        (this.projectUser.translateConfig.selectedTextRef !== this.textId ||
          this.projectUser.translateConfig.selectedSegment !== this.target.segmentRef)
      ) {
        this.projectUser.translateConfig.selectedTextRef = this.textId;
        this.projectUser.translateConfig.selectedSegment = this.target.segmentRef;
        this.projectUser.translateConfig.selectedSegmentChecksum = this.target.segmentChecksum;
        await this.projectUserService.update(this.projectUser);
      }
      this.onStartTranslating();
      try {
        await this.trainSegment(prevSegment);
        await this.translateSegment();
      } finally {
        this.onFinishTranslating();
      }
    } else {
      if (delta != null) {
        // insert a space if the user just inserted a suggestion and started typing
        if (
          delta.ops.length === 2 &&
          delta.ops[0].retain === this.insertSuggestionEnd &&
          delta.ops[1].insert != null &&
          delta.ops[1].insert.length > 0 &&
          !/^\s+$/.test(delta.ops[1].insert)
        ) {
          this.target.editor.insertText(this.insertSuggestionEnd, ' ', 'user');
          const selectIndex = this.insertSuggestionEnd + delta.ops[1].insert.length + 1;
          this.insertSuggestionEnd = -1;
          setTimeout(() => this.target.editor.setSelection(selectIndex, 0, 'user'));
        }
      } else if (this.insertSuggestionEnd !== -1) {
        const selection = this.target.editor.getSelection();
        if (selection == null || selection.length > 0 || selection.index !== this.insertSuggestionEnd) {
          this.insertSuggestionEnd = -1;
        }
      }
      this.updateSuggestions();
    }
  }

  onTextLoaded(textType: TextType): void {
    switch (textType) {
      case 'source':
        this.sourceLoaded = true;
        break;
      case 'target':
        this.targetLoaded = true;
        break;
    }
    if (this.sourceLoaded && this.targetLoaded) {
      this.noticeService.loadingFinished();
    }
  }

  insertSuggestion(suggestionIndex: number = -1): void {
    if (suggestionIndex >= this.suggestion.length) {
      return;
    }

    this.target.focus();
    const range = this.skipInitialWhitespace(this.target.editor.getSelection());

    const delta = new Delta();
    delta.retain(range.index);
    if (range.length > 0) {
      delta.delete(range.length);
    }

    const words = suggestionIndex === -1 ? this.suggestion : this.suggestion.slice(0, suggestionIndex + 1);
    // TODO: use detokenizer to build suggestion text
    let insertText = words.join(' ');
    if (!this.translationSession.isLastWordComplete) {
      const lastWord = this.translationSession.prefix[this.translationSession.prefix.length - 1];
      insertText = insertText.substring(lastWord.length);
    }
    if (this.insertSuggestionEnd !== -1) {
      insertText += ' ';
    }
    delta.insert(insertText);

    const selectIndex = range.index + insertText.length;
    this.insertSuggestionEnd = selectIndex;
    this.target.editor.updateContents(delta, 'user');
    setTimeout(() => this.target.editor.setSelection(selectIndex, 0, 'user'));
  }

  private onStartTranslating(): void {
    this.isTranslating = true;
    this.suggestion = [];
    setTimeout(() => this.showSuggestions());
  }

  private async translateSegment(): Promise<void> {
    const sourceSegment = this.source.segmentText;
    const words = this.sourceWordTokenizer.tokenizeToStrings(sourceSegment);
    if (words.length > MAX_SEGMENT_LENGTH) {
      this.translationSession = null;
      this.noticeService.show('This verse is too long to generate suggestions.');
      return;
    }

    const start = performance.now();
    this.translationSession = await this.translationEngine.translateInteractively(1, words);
    if (sourceSegment !== this.source.segmentText) {
      this.translationSession = null;
    }
    const finish = performance.now();
    console.log('Translated segment, length: %d, time: %dms', words.length, finish - start);
  }

  private onFinishTranslating(): void {
    this.isTranslating = false;
    this.updateSuggestions();
  }

  private updateSuggestions(): void {
    if (this.target.segment == null) {
      return;
    }

    // only bother updating the suggestion if the cursor is at the end of the segment
    if (!this.isTranslating && this.isSelectionAtSegmentEnd) {
      if (this.translationSession == null) {
        this.suggestion = [];
      } else {
        const range = this.skipInitialWhitespace(this.target.editor.getSelection());
        const text = this.target.editor.getText(
          this.target.segment.range.index,
          range.index - this.target.segment.range.index
        );

        const tokenRanges = this.targetWordTokenizer.tokenize(text);
        const prefix = tokenRanges.map(r => text.substring(r.start, r.end));
        const isLastWordComplete =
          tokenRanges.length === 0 || tokenRanges[tokenRanges.length - 1].end !== prefix.length;
        const results = this.translationSession.setPrefix(prefix, isLastWordComplete);
        if (results.length === 0) {
          this.suggestion = [];
        } else {
          const result = results[0];
          const suggestion = this.translationSuggester.getSuggestion(prefix.length, isLastWordComplete, result);
          this.suggestion = suggestion.targetWordIndices.map(j => result.targetSegment[j]);
          this.suggestionConfidence = suggestion.confidence;
        }
      }
    }
    setTimeout(() => {
      if ((this.isTranslating || this.suggestion.length > 0) && this.isSelectionAtSegmentEnd) {
        this.showSuggestions();
      } else {
        this.hideSuggestions();
      }
    });
  }

  private skipInitialWhitespace(range: RangeStatic): RangeStatic {
    let i: number;
    for (i = range.index; i < range.index + range.length; i++) {
      const ch = this.target.editor.getText(i, 1);
      if (ch === INITIAL_BLANK_TEXT[0] || ch === NORMAL_BLANK_TEXT[0] || !/\s/.test(ch)) {
        return { index: i, length: range.length - (i - range.index) };
      }
    }
    return { index: i, length: 0 };
  }

  private hideSuggestions(): void {
    this.suggestionView.hide();
  }

  private showSuggestions(): void {
    if (!this.isSelectionAtSegmentEnd) {
      return;
    }

    const selection = this.target.editor.getSelection();

    this.suggestionView.position(this.target.editor.getBounds(selection.index, selection.length));
    this.suggestionView.show();
  }

  private async trainSegment(segment: Segment): Promise<void> {
    if (!this.isSegmentUntrained(segment)) {
      return;
    }

    await this.translationSession.approve();
    segment.acceptChanges();
    console.log('Segment ' + segment.ref + ' of document ' + segment.textId + ' was trained successfully.');
  }

  private isSegmentUntrained(segment: Segment): boolean {
    return (
      segment != null &&
      segment.range.length > 0 &&
      !isBlankText(segment.text) &&
      this.isSegmentComplete(segment.range) &&
      segment.isChanged
    );
  }

  private isSegmentComplete(range: RangeStatic): boolean {
    return range.index + range.length !== this.target.length;
  }
}
