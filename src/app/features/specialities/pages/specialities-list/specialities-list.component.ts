import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SpecialitiesService } from '../../services/specialities.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { Speciality } from '../../models/speciality.model';

const AVATAR_COLORS = [
  '#4b4e9c', '#0284c7', '#059669', '#d97706',
  '#dc2626', '#db2777', '#0891b2', '#7c3aed',
];

@Component({
  selector: 'app-specialities-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './specialities-list.component.html',
  styleUrl: './specialities-list.component.scss',
})
export class SpecialitiesListComponent implements OnInit {
  private readonly svc     = inject(SpecialitiesService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb      = inject(FormBuilder);

  protected readonly loading      = signal(false);
  protected readonly adding       = signal(false);
  protected readonly specialities = signal<Speciality[]>([]);
  protected readonly lastUpdate   = signal<Date | null>(null);
  protected readonly showModal    = signal(false);

  protected addForm!: FormGroup;

  ngOnInit(): void { this.buildForm(); this.load(); }

  protected refresh(): void { this.svc.invalidate(); this.load(); }

  protected openModal(): void {
    this.buildForm();
    this.showModal.set(true);
  }

  protected closeModal(): void { this.showModal.set(false); }

  protected async onAdd(): Promise<void> {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.adding.set(true);
    const v = this.addForm.value;
    try {
      await firstValueFrom(this.svc.add({
        id:       0,
        name:     v.name.trim(),
        imageUrl: (v.imageUrl ?? '').trim(),
      }));
      this.toast.success('تم إضافة التخصص بنجاح');
      this.closeModal();
      this.load();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الإضافة');
    } finally {
      this.adding.set(false);
    }
  }

  protected async onDelete(id: number, name: string): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف تخصص',
      message:     `هل أنت متأكد من حذف تخصص "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.svc.delete(id));
      this.toast.success('تم حذف التخصص بنجاح');
      this.load();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الحذف');
    }
  }

  protected initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() ?? '?';
  }

  protected iconColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }

  private buildForm(): void {
    this.addForm = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      imageUrl: ['', [Validators.pattern(/^(https?:\/\/.+)?$/)]], // optional, but must be valid URL if provided
    });
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (res) => {
        this.specialities.set(res ?? []);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => { this.toast.error('فشل تحميل التخصصات'); this.loading.set(false); },
    });
  }
}
