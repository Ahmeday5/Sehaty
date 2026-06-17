import {
  ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface PageItem { type: 'page' | 'ellipsis'; value?: number; }

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages > 1) {
      <nav class="pg-nav" aria-label="التنقل بين الصفحات">
        <button class="pg-btn" [disabled]="currentPage === 1" (click)="go(currentPage - 1)" aria-label="الصفحة السابقة">
          <i class="fa-solid fa-chevron-right"></i>
        </button>

        @for (item of pages; track $index) {
          @if (item.type === 'page') {
            <button
              class="pg-btn"
              [class.pg-btn--active]="item.value === currentPage"
              (click)="go(item.value!)"
              [attr.aria-current]="item.value === currentPage ? 'page' : null"
            >{{ item.value }}</button>
          } @else {
            <span class="pg-ellipsis">…</span>
          }
        }

        <button class="pg-btn" [disabled]="currentPage === totalPages" (click)="go(currentPage + 1)" aria-label="الصفحة التالية">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
      </nav>
    }
  `,
  styles: [`
    .pg-nav { display:flex; align-items:center; gap:4px; justify-content:center; }
    .pg-btn {
      min-width:34px; height:34px; padding:0 6px; border-radius:8px;
      border:1px solid var(--brd, #e5e7eb); background:var(--bg2,#fff);
      color:var(--txt2,#374151); font-size:13px; cursor:pointer;
      transition:background .12s, color .12s; display:flex; align-items:center; justify-content:center;
      &:hover:not(:disabled) { background:var(--bg3,#f3f4f6); }
      &--active { background:var(--main-color,#14c8c7); color:#fff; border-color:var(--main-color,#14c8c7); font-weight:700; }
      &:disabled { opacity:.4; cursor:not-allowed; }
    }
    .pg-ellipsis { padding:0 6px; color:var(--txt3,#9ca3af); font-size:14px; }
  `],
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalPages  = 0;
  @Input() windowSize  = 2;
  @Output() pageChange = new EventEmitter<number>();

  pages: PageItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage'] || changes['totalPages']) {
      this.pages = this.buildPages();
    }
  }

  go(page: number | undefined): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  private buildPages(): PageItem[] {
    const items: PageItem[] = [];
    const { currentPage: cp, totalPages: tp, windowSize: ws } = this;

    if (tp <= 2 * ws + 1) {
      for (let i = 1; i <= tp; i++) items.push({ type: 'page', value: i });
      return items;
    }

    items.push({ type: 'page', value: 1 });

    let start = Math.max(2, cp - ws);
    let end   = Math.min(tp - 1, cp + ws);
    if (cp <= ws + 1) { end = 2 * ws + 1; }
    else if (cp >= tp - ws) { start = tp - 2 * ws; }

    if (start > 2) items.push({ type: 'ellipsis' });
    for (let i = start; i <= end; i++) items.push({ type: 'page', value: i });
    if (end < tp - 1) items.push({ type: 'ellipsis' });
    if (tp > 1) items.push({ type: 'page', value: tp });

    return items;
  }
}
