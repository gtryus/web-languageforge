import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import Quill from 'quill';

import { TextComponent } from '../../shared/text/text.component';

@Component({
  selector: 'app-suggestion',
  templateUrl: './suggestion.component.html',
  styleUrls: ['./suggestion.component.scss']
})
export class SuggestionComponent implements AfterViewInit {
  @Input() suggestion: string[] = [];
  @Input() confidence: number;
  @Input() text: TextComponent;
  @Output() selected = new EventEmitter();

  showSuggestionHelp: boolean = false;

  private top: number;

  constructor(private readonly elemRef: ElementRef) {}

  get isLoading(): boolean {
    return this.suggestion.length === 0;
  }

  get confidencePercentage(): number {
    return Math.round(this.confidence * 100);
  }

  get suggestionStyle(): any {
    const maxOpacity = 1;
    const minOpacity = 0.3;
    const opacity = this.confidence * (maxOpacity - minOpacity) + minOpacity;
    return { opacity };
  }

  private get editor(): Quill {
    return this.text.editor;
  }

  private get root(): HTMLElement {
    return this.elemRef.nativeElement;
  }

  private get boundsContainer(): HTMLElement {
    return document.body;
  }

  ngAfterViewInit(): void {
    if (this.editor.root === this.editor.scrollingContainer) {
      this.editor.root.addEventListener('scroll', () => {
        this.updateVisibility();
      });
    }
    this.hide();
  }

  toggleHelp(): void {
    this.showSuggestionHelp = !this.showSuggestionHelp;
  }

  selectAll(): void {
    this.selected.emit();
  }

  hide(): void {
    this.root.classList.add('hidden');
  }

  position(reference: any): number {
    const left = reference.left + 1;
    // root.scrollTop should be 0 if scrollContainer !== root
    this.top = reference.bottom + this.editor.root.scrollTop + 1;
    this.root.style.left = left + 'px';
    this.root.style.top = this.top + 'px';
    this.root.classList.remove('flip');
    const containerBounds = this.boundsContainer.getBoundingClientRect();
    const rootBounds = this.root.getBoundingClientRect();
    let shift = 0;
    if (rootBounds.right > containerBounds.right) {
      shift = containerBounds.right - rootBounds.right;
      this.root.style.left = left + shift + 'px';
    }
    if (rootBounds.left < containerBounds.left) {
      shift = containerBounds.left - rootBounds.left;
      this.root.style.left = left + shift + 'px';
    }
    if (rootBounds.bottom > containerBounds.bottom) {
      const height = rootBounds.bottom - rootBounds.top;
      const verticalShift = reference.bottom - reference.top + height;
      this.top -= verticalShift;
      this.root.style.top = this.top + 'px';
      this.root.classList.add('flip');
    }
    this.updateVisibility();
    return shift;
  }

  show(): void {
    this.root.classList.remove('hidden');
  }

  private updateVisibility(): void {
    const marginTop = -this.editor.root.scrollTop;
    const offsetTop = marginTop + this.top;
    const offsetBottom = offsetTop + this.root.clientHeight;
    if (offsetTop < 0 || offsetBottom > this.editor.scrollingContainer.clientHeight) {
      if (this.root.style.visibility !== 'hidden') {
        this.root.style.visibility = 'hidden';
        this.root.style.marginTop = -this.top + 'px';
      }
    } else {
      this.root.style.marginTop = marginTop + 'px';
      this.root.style.visibility = '';
    }
  }
}
