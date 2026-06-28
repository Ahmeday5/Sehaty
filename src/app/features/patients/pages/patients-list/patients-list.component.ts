import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PatientsService } from '../../services/patients.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Patient, PatientsListParams } from '../../models/patient.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchFilterBarComponent } from '../../../../shared/components/search-filter-bar/search-filter-bar.component';
import { StatBadgeComponent } from '../../../../shared/components/stat-badge/stat-badge.component';

const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  '#1a9e6e', '#0284c7', '#059669', '#d97706',
  '#dc2626', '#db2777', '#0891b2', '#7c3aed',
];

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, EmptyStateComponent, SearchFilterBarComponent, StatBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './patients-list.component.html',
  styleUrl:    './patients-list.component.scss',
})
export class PatientsListComponent implements OnInit {
  private readonly svc     = inject(PatientsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly loading    = signal(false);
  protected readonly patients   = signal<Patient[]>([]);
  protected readonly total      = signal(0);
  protected readonly page       = signal(1);
  protected readonly lastUpdate = signal<Date | null>(null);

  // ── Search state ──────────────────────────────────────────────────────────
  protected nameValue  = '';
  protected phoneValue = '';

  private readonly nameSearch$  = new Subject<string>();
  private readonly phoneSearch$ = new Subject<string>();

  protected readonly pageSize = PAGE_SIZE;
  protected get totalPages(): number { return Math.ceil(this.total() / PAGE_SIZE); }

  ngOnInit(): void {
    this.load();

    this.nameSearch$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((q) => {
      this.nameValue = q;
      this.page.set(1);
      this.load();
    });

    this.phoneSearch$.pipe(debounceTime(350), distinctUntilChanged()).subscribe((q) => {
      this.phoneValue = q;
      this.page.set(1);
      this.load();
    });
  }

  protected onNameSearch(query: string):  void { this.nameSearch$.next(query);  }
  protected onPhoneSearch(query: string): void { this.phoneSearch$.next(query); }

  protected refresh(): void { this.page.set(1); this.load(); }

  protected onPageChange(p: number): void { this.page.set(p); this.load(); }

  protected getStatusVariant(isActive: boolean): string { return isActive ? 'green' : 'default'; }

  protected async onDelete(patient: Patient): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف المريض',
      message:     `هل أنت متأكد من حذف المريض "${patient.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;
    this.svc.deletePatient(patient.id).subscribe({
      next:  () => { this.toast.success('تم حذف المريض بنجاح'); this.load(); },
      error: () => this.toast.error('فشل حذف المريض'),
    });
  }

  protected rowIndex(i: number): number { return (this.page() - 1) * PAGE_SIZE + i + 1; }

  protected calcAge(birthday: string): number {
    if (!birthday) return 0;
    const today = new Date(), birth = new Date(birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  protected initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0]?.[0]?.toUpperCase() ?? '?';
  }

  protected avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  private load(): void {
    this.loading.set(true);

    const params: PatientsListParams = { page: this.page(), pageSize: PAGE_SIZE };
    if (this.nameValue.trim())  params.name        = this.nameValue.trim();
    if (this.phoneValue.trim()) params.phoneNumber = this.phoneValue.trim();

    this.svc.getPatients(params).subscribe({
      next: (res) => {
        this.patients.set(res?.data ?? []);
        this.total.set(res?.total ?? 0);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.patients.set([]);
        this.total.set(0);
        this.toast.error('فشل تحميل بيانات المرضى');
        this.loading.set(false);
      },
    });
  }
}
