import {
  ChangeDetectionStrategy, Component, EventEmitter, HostListener,
  Input, Output,
} from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input({ required: true }) title!: string;
  @Input() size: ModalSize = 'md';
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc      = true;
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.closeOnEsc) this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) this.closed.emit();
  }

  stopPropagation(e: Event): void { e.stopPropagation(); }
}
