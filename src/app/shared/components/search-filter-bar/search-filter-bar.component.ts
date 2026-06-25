import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, NgZone, OnDestroy, ViewChild, effect, inject, input, output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FilterOption } from './search-filter-bar.model';

@Component({
  selector: 'app-search-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-filter-bar.component.html',
  styleUrl: './search-filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFilterBarComponent implements AfterViewInit, OnDestroy {
  placeholder    = input('بحث...');
  filterOptions  = input<FilterOption[]>([]);
  selectedFilter = input<string | null>(null);

  searchChange = output<string>();
  filterChange = output<string | null>();

  @ViewChild('track') trackRef!: ElementRef<HTMLDivElement>;

  protected searchValue   = '';
  protected canScrollPrev = false;
  protected canScrollNext = false;

  private readonly cdr  = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private search$       = new Subject<string>();
  private sub: Subscription;

  private readonly STEP = 240;

  constructor() {
    this.sub = this.search$.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(q => this.searchChange.emit(q));

    // re-check arrows whenever filterOptions signal changes (API data arrives)
    effect(() => {
      const opts = this.filterOptions();
      if (opts.length > 0) this.scheduleArrowUpdate();
    });
  }

  ngAfterViewInit(): void {
    this.scheduleArrowUpdate();
  }

  private scheduleArrowUpdate(): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => { this.updateArrows(); this.cdr.markForCheck(); }, 80);
    });
  }

  protected onSearch(val: string): void { this.search$.next(val); }
  protected clearSearch(): void { this.searchValue = ''; this.search$.next(''); }
  protected onFilter(id: string | null): void { this.filterChange.emit(id); }

  protected scroll(dir: 1 | -1): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    // RTL: scrollLeft is negative in Chrome, positive in FF — use scrollBy with sign flip
    el.scrollBy({ left: -dir * this.STEP, behavior: 'smooth' });
    setTimeout(() => { this.updateArrows(); this.cdr.markForCheck(); }, 320);
  }

  protected onScroll(): void { this.updateArrows(); this.cdr.markForCheck(); }

  private updateArrows(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // RTL scrollLeft can be 0..max (Firefox) or -max..0 (Chrome)
    const scrolled  = Math.abs(el.scrollLeft);
    this.canScrollPrev = scrolled > 4;
    this.canScrollNext = scrolled < maxScroll - 4;
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
