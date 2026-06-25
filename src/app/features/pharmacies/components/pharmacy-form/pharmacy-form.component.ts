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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PharmaciesService } from '../../services/pharmacies.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Pharmacy } from '../../models/pharmacy.model';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';

@Component({
  selector: 'app-pharmacy-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pharmacy-form.component.html',
  styleUrl: './pharmacy-form.component.scss',
})
export class PharmacyFormComponent implements OnInit {
  @Input() pharmacy?: Pharmacy;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb    = inject(FormBuilder);
  private readonly svc   = inject(PharmaciesService);
  private readonly toast = inject(ToastService);

  protected readonly submitting   = signal(false);
  protected readonly imagePreview = signal<string | null>(null);

  private imageFile?: File;
  protected form!: FormGroup;

  protected get isEdit(): boolean { return !!this.pharmacy; }

  ngOnInit(): void {
    this.buildForm();
    if (this.pharmacy) this.patchForm(this.pharmacy);
  }

  protected onImageChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => this.imagePreview.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    try {
      const fd = this.buildFormData();
      if (this.isEdit) {
        await firstValueFrom(this.svc.updatePharmacy(this.pharmacy!.id, fd));
        this.toast.success('تم تعديل بيانات الصيدلية بنجاح');
      } else {
        await firstValueFrom(this.svc.addPharmacy(fd));
        this.toast.success('تم إضافة الصيدلية بنجاح');
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
      name:          ['', [Validators.required, Validators.minLength(2)]],
      ownerName:     ['', [Validators.required, Validators.minLength(2)]],
      email:         ['', this.isEdit ? [] : [Validators.required, Validators.email]],
      phone:         ['', [Validators.required, Validators.pattern(/^[0-9+\s]{7,15}$/)]],
      address:       ['', [Validators.required, Validators.minLength(5)]],
      licenseNumber: ['', [Validators.required, Validators.minLength(3)]],
      password:      ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
    });
  }

  private patchForm(p: Pharmacy): void {
    this.form.patchValue({
      name:          p.name,
      ownerName:     p.ownerName,
      phone:         p.phone,
      address:       p.address,
      licenseNumber: p.licenseNumber,
    });
    if (p.pharmacyImage) this.imagePreview.set(p.pharmacyImage);
  }

  private buildFormData(): FormData {
    const fd  = new FormData();
    const val = this.form.value;
    fd.append('name',          val.name);
    fd.append('ownerName',     val.ownerName);
    fd.append('phone',         val.phone);
    fd.append('address',       val.address);
    fd.append('licenseNumber', val.licenseNumber);
    if (!this.isEdit) {
      fd.append('email',    val.email);
      fd.append('password', val.password);
    }
    if (this.imageFile) fd.append('pharmacyImage', this.imageFile);
    return fd;
  }
}
