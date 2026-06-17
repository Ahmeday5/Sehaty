import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, ModalComponent, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './all-users.component.html',
  styleUrl:    './all-users.component.scss',
})
export class AllUsersComponent implements OnInit {
  private readonly svc     = inject(UsersService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb      = inject(FormBuilder);
  private readonly search$ = new Subject<string>();

  protected readonly loading      = signal(false);
  protected readonly submitting   = signal(false);
  protected readonly showAddModal = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly selectedRole = signal<string | null>(null);
  protected readonly currentPage  = signal(1);
  protected readonly totalPages   = signal(0);
  protected readonly displayed    = signal<Employee[]>([]);

  protected searchValue = '';
  protected addForm!: FormGroup;

  private imageFile: File | null = null;
  private all:      Employee[] = [];
  private filtered: Employee[] = [];

  readonly ROLES_AR  = ROLES_AR;
  readonly ROLE_KEYS = Object.keys(ROLES_AR);

  protected get totalCount():     number { return this.all.length; }
  protected get adminCount():     number { return this.all.filter((u) => (u.roles as string[])?.includes('Admin')).length; }
  protected get editorCount():    number { return this.all.filter((u) => (u.roles as string[])?.includes('Editor')).length; }
  protected get salesCount():     number { return this.all.filter((u) => (u.roles as string[])?.includes('Sales')).length; }
  protected get marketingCount(): number { return this.all.filter((u) => (u.roles as string[])?.includes('Marketing')).length; }

  ngOnInit(): void {
    this.buildForm();
    this.load();
    this.search$
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((q) => this.applyFilters(q, this.selectedRole()));
  }

  protected onSearch(q: string): void { this.search$.next(q); }

  protected onRoleFilter(role: string | null): void {
    this.selectedRole.set(role);
    this.applyFilters(this.searchValue, role);
  }

  protected openAdd(): void {
    this.buildForm();
    this.imageFile = null;
    this.imagePreview.set(null);
    this.showPassword.set(false);
    this.showAddModal.set(true);
  }
  protected closeAdd(): void { this.showAddModal.set(false); }

  protected togglePassword(): void { this.showPassword.update((v) => !v); }

  protected onImageChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.imageFile = f;
    const reader = new FileReader();
    reader.onload = (ev) => this.imagePreview.set(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

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
      fd.append('Phone',      v.phone);
      fd.append('NationalID', v.nationalID);
      fd.append('Roles',      v.role);
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
        this.applyFilters(this.searchValue, this.selectedRole());
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
        this.applyFilters(this.searchValue, this.selectedRole());
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

  private buildForm(): void {
    this.addForm = this.fb.group({
      firstName:  ['', [Validators.required, Validators.minLength(2)]],
      lastName:   ['', [Validators.required, Validators.minLength(2)]],
      email:      ['', [Validators.required, Validators.email]],
      phone:      ['', [Validators.required, Validators.pattern(/^[0-9+\s]{7,15}$/)]],
      nationalID: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^[0-9]+$/)]],
      password:   ['', [Validators.required, Validators.minLength(6)]],
      role:       ['', [Validators.required]],
    });
  }
}
