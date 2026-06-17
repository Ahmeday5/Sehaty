import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdvertisementsService } from '../../services/advertisements.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { Advertisement } from '../../models/advertisement.model';

@Component({
  selector: 'app-advertisements-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advertisements-list.component.html',
  styleUrl: './advertisements-list.component.scss',
})
export class AdvertisementsListComponent implements OnInit {
  private readonly svc     = inject(AdvertisementsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb      = inject(FormBuilder);

  protected readonly loading        = signal(false);
  protected readonly adding         = signal(false);
  protected readonly advertisements = signal<Advertisement[]>([]);
  protected readonly lastUpdate     = signal<Date | null>(null);
  protected readonly showModal      = signal(false);
  protected readonly previewUrl     = signal<string | null>(null);

  protected addForm!: FormGroup;
  private newFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  ngOnInit(): void { this.buildForm(); this.load(); }

  protected refresh(): void { this.svc.invalidate(); this.load(); }

  protected openModal(): void {
    this.buildForm();
    this.newFile = null;
    this.previewUrl.set(null);
    this.showModal.set(true);
  }

  protected closeModal(): void { this.showModal.set(false); }

  protected triggerFilePicker(): void { this.fileInput?.nativeElement.click(); }

  protected onFileChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.newFile = f;
    const reader = new FileReader();
    reader.onload = (ev) => { this.previewUrl.set(ev.target?.result as string); };
    reader.readAsDataURL(f);
  }

  protected async onAdd(): Promise<void> {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.adding.set(true);
    try {
      const fd = new FormData();
      fd.append('Title', this.addForm.value.title.trim());
      if (this.newFile) fd.append('ImageFile', this.newFile);
      await firstValueFrom(this.svc.add(fd));
      this.toast.success('تم إضافة الإعلان بنجاح');
      this.closeModal();
      this.load();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الإضافة');
    } finally {
      this.adding.set(false);
    }
  }

  private buildForm(): void {
    this.addForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    });
  }

  protected async onDelete(ad: Advertisement): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف إعلان',
      message:     `هل أنت متأكد من حذف إعلان "${ad.title}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.svc.delete(ad.id));
      this.toast.success('تم حذف الإعلان بنجاح');
      this.load();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'فشل الحذف');
    }
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (list) => {
        this.advertisements.set(list);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => { this.toast.error('فشل تحميل الإعلانات'); this.loading.set(false); },
    });
  }
}
