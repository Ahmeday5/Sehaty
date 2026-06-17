import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { DoctorsService } from '../../services/doctors.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Doctor } from '../../models/doctor.model';
import { Speciality } from '../../../specialities/models/speciality.model';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-doctor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './doctor-form.component.html',
  styleUrl: './doctor-form.component.scss',
})
export class DoctorFormComponent implements OnInit {
  @Input() doctor?: Doctor;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb    = inject(FormBuilder);
  private readonly svc   = inject(DoctorsService);
  private readonly toast = inject(ToastService);

  protected readonly submitting    = signal(false);
  protected readonly specialities  = signal<Speciality[]>([]);
  protected readonly imagePreview  = signal<string | null>(null);
  protected readonly certPreviewUrl = signal<string | null>(null);
  protected readonly certName      = signal<string | null>(null);
  protected readonly certIsImage   = signal(false);
  protected readonly showCertModal = signal(false);

  private imageFile?: File;
  private certFile?: File;

  protected form!: FormGroup;

  protected get isEdit(): boolean { return !!this.doctor; }

  ngOnInit(): void {
    this.buildForm();
    this.loadSpecialities();
    if (this.doctor) this.patchForm(this.doctor);
  }

  protected onImageChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => this.imagePreview.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  protected onCertChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.certFile = file;
    this.certName.set(file.name);

    const isImg = file.type.startsWith('image/') || this.isImageUrl(file.name);
    this.certIsImage.set(isImg);

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (ev) => this.certPreviewUrl.set(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.certPreviewUrl.set(URL.createObjectURL(file));
    }
  }

  protected openCertModal(): void  { this.showCertModal.set(true);  }
  protected closeCertModal(): void { this.showCertModal.set(false); }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    try {
      const fd = this.buildFormData();
      if (this.isEdit) {
        await firstValueFrom(this.svc.updateDoctor(this.doctor!.id, fd));
        this.toast.success('تم تعديل بيانات الطبيب بنجاح');
      } else {
        await firstValueFrom(this.svc.addDoctor(fd));
        this.toast.success('تم إضافة الطبيب بنجاح');
      }
      this.saved.emit();
    } catch (e: any) {
      this.toast.error(e?.message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      this.submitting.set(false);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:              ['', [Validators.required, Validators.minLength(2)]],
      email:             ['', this.isEdit ? [] : [Validators.required, Validators.email]],
      phone:             ['', [Validators.required, Validators.pattern(/^[0-9+\s]{7,15}$/)]],
      password:          ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      nationalID:        ['', this.isEdit
                              ? [Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^[0-9]+$/)]
                              : [Validators.required, Validators.minLength(10), Validators.maxLength(20), Validators.pattern(/^[0-9]+$/)]],
      specialityId:      [null, [Validators.required]],
      gender:            ['Male', [Validators.required]],
      yearsOfExperience: [0, [Validators.required, Validators.min(0), Validators.max(60)]],
      examenPrice:       [0, [Validators.required, Validators.min(0)]],
      doctorPersentage:  [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      profileInfo:       ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  private patchForm(doctor: Doctor): void {
    this.form.patchValue({
      name:              doctor.name,
      phone:             doctor.phone,
      nationalID:        doctor.nationalID ?? '',
      specialityId:      doctor.specialityId,
      gender:            doctor.gender,
      yearsOfExperience: doctor.yearsOfExperience,
      examenPrice:       doctor.examenPrice,
      doctorPersentage:  doctor.doctorPersentage,
      profileInfo:       doctor.profileInfo,
    });
    if (doctor.doctorImage) {
      this.imagePreview.set(this.resolveUrl(doctor.doctorImage));
    }
    if (doctor.doctorCertificate) {
      const url = this.resolveUrl(doctor.doctorCertificate);
      if (url) {
        this.certPreviewUrl.set(url);
        this.certIsImage.set(this.isImageUrl(url));
        const parts = url.split('/');
        this.certName.set(parts[parts.length - 1] || 'الشهادة');
      }
    }
  }

  private buildFormData(): FormData {
    const fd  = new FormData();
    const val = this.form.value;
    fd.append('name',              val.name);
    fd.append('phone',             val.phone);
    if (val.nationalID) fd.append('nationalID', val.nationalID);
    if (val.specialityId) fd.append('specialityId', String(val.specialityId));
    fd.append('gender',            val.gender);
    fd.append('yearsOfExperience', String(val.yearsOfExperience));
    fd.append('examenPrice',       String(val.examenPrice));
    fd.append('doctorPersentage',  String(val.doctorPersentage));
    fd.append('profileInfo',       val.profileInfo);
    if (!this.isEdit) {
      fd.append('email',    val.email);
      fd.append('password', val.password);
    }
    if (this.imageFile) fd.append('doctorImage',      this.imageFile);
    if (this.certFile)  fd.append('DoctorCertificate', this.certFile);
    return fd;
  }

  private loadSpecialities(): void {
    this.svc.getAllSpecialities().subscribe({
      next: (list) => {
        this.specialities.set(list);
        // When editing, if specialityId came back as 0/null from the API,
        // resolve it by matching the specialization name in the loaded list.
        if (this.isEdit && !this.form.get('specialityId')?.value && this.doctor?.specialization) {
          const match = list.find((s) => s.name === this.doctor!.specialization);
          if (match) this.form.patchValue({ specialityId: match.id });
        }
      },
    });
  }

  private resolveUrl(url: string | null): string | null {
    const BASE = 'https://sehatytheone.runasp.net';
    if (!url || url === `${BASE}/` || url === BASE) return null;
    return url.startsWith('http') ? url : `${BASE}/${url}`;
  }

  private isImageUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif', '.bmp'].some(
      (ext) => lower.includes(ext),
    );
  }
}
