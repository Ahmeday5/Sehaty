import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { DoctorsService } from '../../services/doctors.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-add-doctor',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-doctor.component.html',
  styleUrl: './add-doctor.component.scss',
})
export class AddDoctorComponent {
  @ViewChild('form') form!: NgForm;
  @ViewChild('doctorImage', { static: false }) doctorImageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('certUpload', { static: false }) certUpload!: ElementRef<HTMLInputElement>;

  private readonly svc      = inject(DoctorsService);
  private readonly toast    = inject(ToastService);
  private readonly router   = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly loading      = signal(false);
  protected readonly specialities = signal<any[]>([]);

  doctor = {
    name: '', email: '', phone: '', specializationId: '', nationalId: '',
    password: '', about: '', gender: '', experienceYears: '',
    doctorPercentage: '', examiningPrice: '', followUpPrice: '',
    certificateFile: null as File | null, doctorImageFile: null as File | null,
  };

  // image cropper
  imageChangedEvent: Event | null = null;
  croppedImageBlob: Blob | null = null;
  croppedImageUrl: SafeUrl | null = null;
  showCropper = false;

  constructor() {
    this.svc.getAllSpecialities().subscribe((data) => this.specialities.set(data));
  }

  onFileChange(event: Event): void {
    this.imageChangedEvent = event;
    this.showCropper = true;
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedImageBlob = event.blob ?? null;
    if (event.objectUrl) this.croppedImageUrl = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl);
  }

  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) { this.toast.error('يرجى تعبئة جميع الحقول.'); return; }
    this.loading.set(true);
    try {
      const fd = new FormData();
      Object.entries(this.doctor).forEach(([k, v]) => {
        if (v !== null && v !== undefined && k !== 'doctorImageFile' && k !== 'certificateFile') {
          fd.append(k, String(v));
        }
      });
      if (this.croppedImageBlob) fd.append('doctorImage', this.croppedImageBlob, 'photo.jpg');
      if (this.doctor.certificateFile) fd.append('certificateFile', this.doctor.certificateFile);

      const res = await firstValueFrom(this.svc.addDoctor(fd));
      if (res.includes('Added Successfully') || res.includes('تم')) {
        this.toast.success('تم إضافة الطبيب بنجاح');
        this.router.navigate(['/doctors']);
      } else {
        this.toast.error(res || 'فشل إضافة الطبيب');
      }
    } catch (err: any) {
      this.toast.error(err?.message ?? 'حدث خطأ أثناء الإرسال');
    } finally {
      this.loading.set(false);
    }
  }
}
