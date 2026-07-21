import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PageItem {
  type: 'page' | 'ellipsis';
  value?: number;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 12, 25, 50, 100, 200];

/**
 * Self-contained pagination bar: results summary ("عرض X–Y من Z"), a page-size
 * selector, and page navigation (first/prev/numbers/next/last). `totalPages` is
 * derived internally from `totalItems`/`pageSize` — callers never compute it.
 * Renders nothing when `totalItems` is 0; the nav row itself only appears once
 * there's more than one page (the summary + size selector still show for a
 * single page, matching how large SaaS tables behave).
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  currentPage = input(1);
  totalItems = input(0);
  pageSize = input(10);
  pageSizeOptions = input<number[]>(DEFAULT_PAGE_SIZE_OPTIONS);
  showPageSizeSelector = input(true);
  /** How many page numbers to show on each side of the current page before collapsing to an ellipsis. */
  windowSize = input(2);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  protected readonly totalPages = computed(() => {
    const size = this.pageSize();
    return size > 0 ? Math.max(1, Math.ceil(this.totalItems() / size)) : 1;
  });

  protected readonly startItem = computed(() =>
    this.totalItems() === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize() + 1,
  );

  protected readonly endItem = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.totalItems()),
  );

  protected readonly pages = computed<PageItem[]>(() => this.buildPages());

  protected go(page: number): void {
    const tp = this.totalPages();
    if (page >= 1 && page <= tp && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  protected onPageSizeSelect(value: string): void {
    const size = Number(value);
    if (size > 0 && size !== this.pageSize()) {
      this.pageSizeChange.emit(size);
    }
  }

  private buildPages(): PageItem[] {
    const items: PageItem[] = [];
    const cp = this.currentPage();
    const tp = this.totalPages();
    const ws = this.windowSize();

    if (tp <= 2 * ws + 1) {
      for (let i = 1; i <= tp; i++) items.push({ type: 'page', value: i });
      return items;
    }

    items.push({ type: 'page', value: 1 });

    let start = Math.max(2, cp - ws);
    let end = Math.min(tp - 1, cp + ws);
    if (cp <= ws + 1) {
      end = 2 * ws + 1;
    } else if (cp >= tp - ws) {
      start = tp - 2 * ws;
    }

    if (start > 2) items.push({ type: 'ellipsis' });
    for (let i = start; i <= end; i++) items.push({ type: 'page', value: i });
    if (end < tp - 1) items.push({ type: 'ellipsis' });
    items.push({ type: 'page', value: tp });

    return items;
  }
}
