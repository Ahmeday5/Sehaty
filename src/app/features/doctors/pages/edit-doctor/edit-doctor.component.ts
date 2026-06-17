import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DoctorsService } from '../../services/doctors.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-edit-doctor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-doctor.component.html',
  styleUrl: './edit-doctor.component.scss',
})
export class EditDoctorComponent implements OnInit {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc    = inject(DoctorsService);
  private readonly toast  = inject(ToastService);

  protected readonly loading      = signal(false);
  protected readonly specialities = signal<any[]>([]);
  protected doctorId = 0;

  doctor = {
    name: '', email: '', phone: '', specializationId: '', nationalId: '',
    about: '', gender: '', experienceYears: '', doctorPercentage: '',
    examiningPrice: '', followUpPrice: '',
    doctorImageFile: null as File | null,
  };

  ngOnInit(): void {
    this.doctorId = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getAllSpecialities().subscribe((data) => this.specialities.set(data));
    if (this.doctorId) {
      this.loading.set(true);
      this.svc.getDoctorById(this.doctorId).subscribe({
        next: (d) => {
          Object.assign(this.doctor, d);
          this.loading.set(false);
        },
        error: () => { this.toast.error('فشل في جلب بيانات الطبيب'); this.loading.set(false); },
      });
    }
  }

  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) { this.toast.error('يرجى تعبئة جميع الحقول.'); return; }
    this.loading.set(true);
    try {
      const fd = new FormData();
      Object.entries(this.doctor).forEach(([k, v]) => {
        if (v !== null && v !== undefined && k !== 'doctorImageFile') fd.append(k, String(v));
      });
      if (this.doctor.doctorImageFile) fd.append('doctorImage', this.doctor.doctorImageFile);
      const res = await firstValueFrom(this.svc.updateDoctor(this.doctorId, fd));
      if (res.toLowerCase().includes('updated successfully')) {
        this.toast.success('تم تحديث بيانات الطبيب');
        this.router.navigate(['/doctors', this.doctorId, 'details']);
      } else {
        this.toast.error(res || 'فشل التحديث');
      }
    } catch (err: any) {
      this.toast.error(err?.message ?? 'حدث خطأ');
    } finally {
      this.loading.set(false);
    }
  }
}
