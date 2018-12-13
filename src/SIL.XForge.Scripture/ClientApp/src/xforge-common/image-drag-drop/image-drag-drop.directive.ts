import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appImageDragDrop]'
})
export class ImageDragDropDirective {
  @Output() filesDropped = new EventEmitter<FileList>();
  @Output() filesHovered = new EventEmitter();
  constructor() {}

  @HostListener('drop', ['$event'])
  ondrop($event: any) {
    event.preventDefault();
    this.filesDropped.emit($event);
    this.filesHovered.emit(false);
  }

  @HostListener('dragover', ['$event'])
  ondragover() {
    event.preventDefault();
    this.filesHovered.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  ondragleave() {
    this.filesHovered.emit(false);
  }
}
