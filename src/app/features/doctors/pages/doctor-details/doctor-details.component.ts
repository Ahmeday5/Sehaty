import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DoctorsService } from '../../services/doctors.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Doctor } from '../../models/doctor.model';
import { DoctorFormComponent } from '../../components/doctor-form/doctor-form.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-doctor-details',
  standalone: true,
  imports: [CommonModule, RouterModule, DoctorFormComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-details.component.html',
  styleUrl: './doctor-details.component.scss',
})
export class DoctorDetailsComponent implements OnInit {
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly svc     = inject(DoctorsService);
  private readonly toast   = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly loading         = signal(false);
  protected readonly doctor          = signal<Doctor | null>(null);
  protected readonly showEdit        = signal(false);
  protected readonly toggling        = signal(false);
  protected readonly showCertPreview = signal(false);

  private readonly BASE = 'https://sehatytheone.runasp.net';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/doctors']); return; }
    this.load(id);
  }

  protected get imageUrl(): string {
    const img = this.doctor()?.doctorImage;
    if (!img || img === `${this.BASE}/` || img === this.BASE) {
      return '/assets/img/logo-login.png';
    }
    return img.startsWith('http') ? img : `${this.BASE}/${img}`;
  }

  protected get certUrl(): string | null {
    const url = this.doctor()?.doctorCertificate;
    if (!url || url === `${this.BASE}/` || url === this.BASE) return null;
    return url.startsWith('http') ? url : `${this.BASE}/${url}`;
  }

  protected get certIsImage(): boolean {
    const url = this.certUrl;
    if (!url) return false;
    const lower = url.toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif', '.bmp'].some(
      (ext) => lower.includes(ext),
    );
  }

  protected openEdit(): void  { this.showEdit.set(true);  }
  protected closeEdit(): void { this.showEdit.set(false); }

  protected onEditSaved(): void {
    this.showEdit.set(false);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.load(id);
  }

  protected async toggleStatus(): Promise<void> {
    const d = this.doctor();
    if (!d) return;
    const action = d.isActive ? 'تعطيل' : 'تفعيل';
    const ok = await this.confirm.confirm({
      title:       `${action} الطبيب`,
      message:     `هل أنت متأكد من ${action} الطبيب "${d.name}"؟`,
      confirmText: action,
      type:        d.isActive ? 'danger' : 'info',
    });
    if (!ok) return;
    this.toggling.set(true);
    const call$ = d.isActive ? this.svc.deactivateDoctor(d.id) : this.svc.activateDoctor(d.id);
    call$.subscribe({
      next: () => {
        this.toast.success(`تم ${action} الطبيب بنجاح`);
        this.doctor.update((x) => x ? { ...x, isActive: !x.isActive } : x);
        this.toggling.set(false);
      },
      error: () => {
        this.toast.error(`فشل ${action} الطبيب`);
        this.toggling.set(false);
      },
    });
  }

  protected async deleteDoctor(): Promise<void> {
    const d = this.doctor();
    if (!d) return;
    const ok = await this.confirm.confirm({
      title:       'حذف الطبيب',
      message:     `هل أنت متأكد من حذف الطبيب "${d.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف نهائي',
      type:        'danger',
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.svc.deleteDoctor(d.id));
      this.toast.success('تم حذف الطبيب بنجاح');
      this.router.navigate(['/doctors']);
    } catch {
      this.toast.error('فشل حذف الطبيب');
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.svc.getDoctorById(id).subscribe({
      next:  (d) => { this.doctor.set(d); this.loading.set(false); },
      error: ()  => {
        this.toast.error('فشل في جلب بيانات الطبيب');
        this.loading.set(false);
      },
    });
  }
}
