import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AdvertisementsService } from '../../services/advertisements.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { Advertisement } from '../../models/advertisement.model';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-advertisements-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    FormErrorComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advertisements-list.component.html',
  styleUrl:    './advertisements-list.component.scss',
})
export class AdvertisementsListComponent implements OnInit {
  private readonly svc     = inject(AdvertisementsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb      = inject(FormBuilder);

  protected readonly loading      = signal(false);
  protected readonly adding       = signal(false);
  protected readonly deleting     = signal<number | null>(null);
  protected readonly showModal    = signal(false);
  protected readonly previewUrl   = signal<string | null>(null);
  protected readonly imageError   = signal(false);
  protected readonly lightboxAd   = signal<Advertisement | null>(null);

  protected readonly items       = signal<Advertisement[]>([]);
  protected readonly totalCount  = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly totalPages  = computed(() => Math.ceil(this.totalCount() / PAGE_SIZE));

  protected addForm!: FormGroup;
  private newFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.buildForm();
    this.loadPage(1);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.lightboxAd()) { this.lightboxAd.set(null); return; }
    if (this.showModal())  { this.closeModal(); }
  }

  protected openLightbox(ad: Advertisement): void  { this.lightboxAd.set(ad); }
  protected closeLightbox(): void                  { this.lightboxAd.set(null); }

  protected openModal(): void {
    this.buildForm();
    this.newFile = null;
    this.previewUrl.set(null);
    this.imageError.set(false);
    this.showModal.set(true);
  }

  protected closeModal(): void { this.showModal.set(false); }

  protected refresh(): void { this.loadPage(this.currentPage()); }

  protected onPageChange(page: number): void { this.loadPage(page); }

  protected triggerFilePicker(): void { this.fileInput?.nativeElement.click(); }

  protected onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('حجم الصورة يتجاوز 5MB');
      return;
    }

    this.newFile = file;
    this.imageError.set(false);
    const reader = new FileReader();
    reader.onload = (ev) => this.previewUrl.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.processFile(file);
  }

  protected onDragOver(e: DragEvent): void { e.preventDefault(); }

  protected async onAdd(): Promise<void> {
    this.addForm.markAllAsTouched();
    if (!this.newFile) { this.imageError.set(true); }
    if (this.addForm.invalid || !this.newFile) return;

    this.adding.set(true);
    try {
      const fd = new FormData();
      fd.append('Title',     this.addForm.value.title.trim());
      fd.append('ImageFile', this.newFile);

      await firstValueFrom(this.svc.add(fd));
      this.toast.success('تم نشر الإعلان بنجاح');
      this.closeModal();
      this.loadPage(1);
    } catch (err: any) {
      this.toast.error(err?.message ?? 'فشل إضافة الإعلان');
    } finally {
      this.adding.set(false);
    }
  }

  protected async onDelete(ad: Advertisement): Promise<void> {
    const ok = await this.confirm.confirm({
      title:       'حذف الإعلان',
      message:     `هل أنت متأكد من حذف إعلان "${ad.title}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;

    this.deleting.set(ad.id);
    try {
      await firstValueFrom(this.svc.delete(ad.id));
      this.toast.success('تم حذف الإعلان بنجاح');
      const newTotal = this.totalCount() - 1;
      const maxPage  = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      this.loadPage(Math.min(this.currentPage(), maxPage));
    } catch (err: any) {
      this.toast.error(err?.message ?? 'فشل حذف الإعلان');
    } finally {
      this.deleting.set(null);
    }
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.currentPage.set(page);
    this.svc.getPage(page, PAGE_SIZE).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.totalCount.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل تحميل الإعلانات');
        this.loading.set(false);
      },
    });
  }

  private buildForm(): void {
    this.addForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    });
  }

  private processFile(file: File): void {
    if (file.size > 5 * 1024 * 1024) { this.toast.error('حجم الصورة يتجاوز 5MB'); return; }
    this.newFile = file;
    this.imageError.set(false);
    const reader = new FileReader();
    reader.onload = (ev) => this.previewUrl.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }
}
