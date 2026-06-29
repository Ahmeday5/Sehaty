import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SearchFilterBarComponent } from '../../../../shared/components/search-filter-bar/search-filter-bar.component';
import { FilterOption } from '../../../../shared/components/search-filter-bar/search-filter-bar.model';
import { Employee } from '../../models/user.model';

const ROLES_AR: Record<string, string> = {
  Admin:     'مدير',
  Editor:    'محرر',
  Sales:     'مبيعات',
  Marketing: 'تسويق',
};

const PER_PAGE = 12;

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
    FormErrorComponent,
    KpiStripComponent,
    EmptyStateComponent,
    SearchFilterBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './all-users.component.html',
  styleUrl:    './all-users.component.scss',
})
export class AllUsersComponent implements OnInit {
  private readonly svc     = inject(UsersService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb      = inject(FormBuilder);

  protected readonly loading       = signal(false);
  protected readonly submitting    = signal(false);
  protected readonly showAddModal  = signal(false);
  protected readonly showEditModal = signal(false);
  protected readonly showPassword  = signal(false);
  protected readonly showEditPassword = signal(false);
  protected readonly imagePreview  = signal<string | null>(null);
  protected readonly editImagePreview = signal<string | null>(null);
  protected readonly selectedRole  = signal<string | null>(null);
  protected readonly currentPage   = signal(1);
  protected readonly totalPages    = signal(0);
  protected readonly displayed     = signal<Employee[]>([]);
  protected readonly editingEmp    = signal<Employee | null>(null);

  protected addForm!: FormGroup;
  protected editForm!: FormGroup;

  private imageFile: File | null     = null;
  private editImageFile: File | null = null;
  private all:      Employee[] = [];
  private filtered: Employee[] = [];
  private currentQuery = '';

  readonly ROLES_AR  = ROLES_AR;
  readonly ROLE_KEYS = Object.keys(ROLES_AR);

  readonly filterOpts: FilterOption[] = [
    { id: null,        label: 'الكل' },
    { id: 'Admin',     label: 'مدير' },
    { id: 'Editor',    label: 'محرر' },
    { id: 'Sales',     label: 'مبيعات' },
    { id: 'Marketing', label: 'تسويق' },
  ];

  protected get totalCount():     number { return this.all.length; }
  protected get adminCount():     number { return this.all.filter((u) => (u.roles as string[])?.includes('Admin')).length; }
  protected get editorCount():    number { return this.all.filter((u) => (u.roles as string[])?.includes('Editor')).length; }
  protected get salesCount():     number { return this.all.filter((u) => (u.roles as string[])?.includes('Sales')).length; }
  protected get marketingCount(): number { return this.all.filter((u) => (u.roles as string[])?.includes('Marketing')).length; }

  protected readonly kpiItems = computed<KpiItem[]>(() => [
    {
      icon:    'fa-users',
      value:   String(this.totalCount),
      label:   'إجمالي المستخدمين',
      variant: 'primary',
      active:  this.selectedRole() === null,
    },
    {
      icon:    'fa-user-shield',
      value:   String(this.adminCount),
      label:   'المديرون',
      variant: 'red',
      active:  this.selectedRole() === 'Admin',
    },
    {
      icon:    'fa-pen-nib',
      value:   String(this.editorCount),
      label:   'المحررون',
      variant: 'blue',
      active:  this.selectedRole() === 'Editor',
    },
    {
      icon:    'fa-chart-line',
      value:   String(this.salesCount),
      label:   'المبيعات',
      variant: 'amber',
      active:  this.selectedRole() === 'Sales',
    },
    {
      icon:    'fa-bullhorn',
      value:   String(this.marketingCount),
      label:   'التسويق',
      variant: 'purple',
      active:  this.selectedRole() === 'Marketing',
    },
  ]);

  ngOnInit(): void {
    this.buildAddForm();
    this.load();
  }

  protected onSearch(q: string): void {
    this.currentQuery = q;
    this.applyFilters(q, this.selectedRole());
  }

  protected onRoleFilter(id: string | null): void {
    this.selectedRole.set(id);
    this.applyFilters(this.currentQuery, id);
  }

  protected onKpiClick(item: KpiItem): void {
    const roleMap: Record<string, string | null> = {
      'إجمالي المستخدمين': null,
      'المديرون':  'Admin',
      'المحررون':  'Editor',
      'المبيعات':  'Sales',
      'التسويق':   'Marketing',
    };
    const role = Object.prototype.hasOwnProperty.call(roleMap, item.label)
      ? roleMap[item.label]
      : null;
    this.onRoleFilter(role);
  }

  /* ── Add modal ── */
  protected openAdd(): void {
    this.buildAddForm();
    this.imageFile = null;
    this.imagePreview.set(null);
    this.showPassword.set(false);
    this.showAddModal.set(true);
  }
  protected closeAdd(): void { this.showAddModal.set(false); }

  /* ── Edit modal ── */
  protected openEdit(emp: Employee): void {
    this.editingEmp.set(emp);
    this.editImageFile = null;
    this.editImagePreview.set(this.avatarUrl(emp));
    this.showEditPassword.set(false);
    this.buildEditForm(emp);
    this.showEditModal.set(true);
  }
  protected closeEdit(): void { this.showEditModal.set(false); this.editingEmp.set(null); }

  protected togglePassword(): void { this.showPassword.update((v) => !v); }
  protected toggleEditPassword(): void { this.showEditPassword.update((v) => !v); }

  protected onImageChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.imageFile = f;
    const reader = new FileReader();
    reader.onload = (ev) => this.imagePreview.set(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  protected onEditImageChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.editImageFile = f;
    const reader = new FileReader();
    reader.onload = (ev) => this.editImagePreview.set(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  /* ── Submit add ── */
  protected async onSubmit(): Promise<void> {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    try {
      const v = this.addForm.value;
      const fd = new FormData();
      fd.append('FirstName',  v.firstName);
      fd.append('LastName',   v.lastName);
      fd.append('Email',      v.email);
      fd.append('Password',   v.password);
      fd.append('NationalID', v.nationalID);
      fd.append('Roles',      v.role);
      if (v.phone)        fd.append('Phone', v.phone);
      if (this.imageFile) fd.append('ProfileImage', this.imageFile);

      const res = await firstValueFrom(this.svc.addUser(fd));
      if (
        res.toLowerCase().includes('added') ||
        res.toLowerCase().includes('success') ||
        res.includes('تم')
      ) {
        this.toast.success('تم إضافة المستخدم بنجاح');
        this.showAddModal.set(false);
        this.refresh();
      } else {
        this.toast.error(res || 'فشل الإضافة');
      }
    } catch (err: any) {
      this.toast.error(err?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      this.submitting.set(false);
    }
  }

  /* ── Submit edit ── */
  protected async onEditSubmit(): Promise<void> {
    const emp = this.editingEmp();
    if (!emp) return;
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    try {
      const v = this.editForm.value;
      const fd = new FormData();
      fd.append('FirstName',  v.firstName);
      fd.append('LastName',   v.lastName);
      fd.append('Email',      v.email);
      fd.append('NationalID', v.nationalID);
      fd.append('Roles',      v.role);
      if (v.phone)             fd.append('Phone',    v.phone);
      if (v.password?.trim())  fd.append('Password', v.password.trim());
      if (this.editImageFile)  fd.append('ProfileImage', this.editImageFile);

      const res = await firstValueFrom(this.svc.updateUser(emp.id, fd));
      if (
        res.toLowerCase().includes('updated') ||
        res.toLowerCase().includes('success') ||
        res.includes('تم')
      ) {
        this.toast.success('تم تعديل المستخدم بنجاح');
        this.showEditModal.set(false);
        this.editingEmp.set(null);
        this.refresh();
      } else {
        this.toast.error(res || 'فشل التعديل');
      }
    } catch (err: any) {
      this.toast.error(err?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async onDelete(emp: Employee): Promise<void> {
    const name = `${emp.firstName} ${emp.lastName}`;
    const ok   = await this.confirm.confirm({
      title:       'حذف المستخدم',
      message:     `هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;
    this.svc.deleteUser(emp.id as any).subscribe({
      next: () => {
        this.toast.success('تم حذف المستخدم بنجاح');
        this.all = this.all.filter((e) => e.id !== emp.id);
        this.applyFilters(this.currentQuery, this.selectedRole());
      },
      error: () => this.toast.error('فشل حذف المستخدم'),
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updateDisplayed();
  }

  protected refresh(): void { this.svc.invalidate(); this.load(); }

  protected roleLabel(roles: any[]): string {
    const first = roles?.[0] as string;
    return ROLES_AR[first] ?? first ?? '—';
  }

  protected roleBadgeClass(roles: any[]): string {
    const map: Record<string, string> = {
      Admin:     'au-badge--admin',
      Editor:    'au-badge--editor',
      Sales:     'au-badge--sales',
      Marketing: 'au-badge--marketing',
    };
    return map[roles?.[0] as string] ?? 'au-badge--default';
  }

  protected roleIconClass(key: string): string {
    const map: Record<string, string> = {
      Admin:     'fa-user-shield',
      Editor:    'fa-pen-nib',
      Sales:     'fa-chart-line',
      Marketing: 'fa-bullhorn',
    };
    return map[key] ?? 'fa-user';
  }

  protected avatarUrl(emp: Employee): string {
    const p = emp.picture;
    if (!p || p === 'N/A' || p === '' || p === 'null') return '/assets/img/user/profile.png';
    if (p.includes('/N/A')) return '/assets/img/user/profile.png';
    return p.startsWith('http') ? p : `https://sehatytheone.runasp.net${p}`;
  }

  protected maskNationalId(id: string): string {
    if (!id || id.length < 8) return id ?? '—';
    return id.slice(0, 4) + ' •••• ' + id.slice(-4);
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (data: any) => {
        this.all = Array.isArray(data) ? data : (data?.employees ?? []);
        this.applyFilters(this.currentQuery, this.selectedRole());
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل في جلب بيانات المستخدمين');
        this.loading.set(false);
      },
    });
  }

  private applyFilters(query: string, role: string | null): void {
    let result = [...this.all];
    if (role) result = result.filter((u) => (u.roles as string[])?.includes(role));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q),
      );
    }
    this.filtered = result;
    this.totalPages.set(Math.ceil(result.length / PER_PAGE));
    this.currentPage.set(1);
    this.updateDisplayed();
  }

  private updateDisplayed(): void {
    const start = (this.currentPage() - 1) * PER_PAGE;
    this.displayed.set(this.filtered.slice(start, start + PER_PAGE));
  }

  private buildAddForm(): void {
    this.addForm = this.fb.group({
      firstName:  ['', [Validators.required, Validators.minLength(2)]],
      lastName:   ['', [Validators.required, Validators.minLength(2)]],
      email:      ['', [Validators.required, Validators.email]],
      phone:      ['', [Validators.pattern(/^[0-9+\s]{7,15}$/)]],
      nationalID: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^[0-9]+$/)]],
      password:   ['', [Validators.required, Validators.minLength(6)]],
      role:       ['', [Validators.required]],
    });
  }

  private buildEditForm(emp: Employee): void {
    this.editForm = this.fb.group({
      firstName:  [emp.firstName, [Validators.required, Validators.minLength(2)]],
      lastName:   [emp.lastName,  [Validators.required, Validators.minLength(2)]],
      email:      [emp.email,     [Validators.required, Validators.email]],
      phone:      [emp.phone ?? '', [Validators.pattern(/^[0-9+\s]{7,15}$/)]],
      nationalID: [emp.nationalID, [Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^[0-9]+$/)]],
      password:   ['', [Validators.minLength(6)]],
      role:       [emp.roles?.[0] ?? '', [Validators.required]],
    });
  }
}
