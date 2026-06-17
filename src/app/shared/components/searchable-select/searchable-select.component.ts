import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  HostListener, Input, OnChanges, Output, SimpleChanges, signal, computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.scss',
})
export class SearchableSelectComponent implements OnChanges {
  @Input({ required: true }) options!: SelectOption[];
  @Input() placeholder = 'اختر...';
  @Input() value: string | number | null = null;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string | number | null>();

  protected readonly open    = signal(false);
  protected readonly query   = signal('');

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.options.filter((o) => o.label.toLowerCase().includes(q)) : this.options;
  });

  protected get selectedLabel(): string {
    if (this.value == null) return '';
    return this.options.find((o) => o.value === this.value)?.label ?? '';
  }

  constructor(private readonly elRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: HTMLElement): void {
    if (this.open() && !this.elRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) this.query.set('');
  }

  toggle(): void {
    if (this.disabled) return;
    this.open.update((v) => !v);
    if (this.open()) this.query.set('');
  }

  select(opt: SelectOption): void {
    this.valueChange.emit(opt.value);
    this.close();
  }

  clear(e: Event): void {
    e.stopPropagation();
    this.valueChange.emit(null);
  }

  private close(): void {
    this.open.set(false);
    this.query.set('');
  }
}
