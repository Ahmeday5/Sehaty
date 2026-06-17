import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './form-error.component.scss',
  template: `
    @if (control?.invalid && (control?.touched || control?.dirty)) {
      <div class="form-error-msg" role="alert" aria-live="polite">
        @if (control?.errors?.['required'])   { <span>هذا الحقل مطلوب</span> }
        @if (control?.errors?.['email'])      { <span>البريد الإلكتروني غير صحيح</span> }
        @if (control?.errors?.['minlength'])  { <span>لا يقل عن {{ control?.errors?.['minlength']?.requiredLength }} أحرف</span> }
        @if (control?.errors?.['maxlength'])  { <span>لا يزيد عن {{ control?.errors?.['maxlength']?.requiredLength }} أحرف</span> }
        @if (control?.errors?.['min'])        { <span>الحد الأدنى المسموح {{ control?.errors?.['min']?.min }}</span> }
        @if (control?.errors?.['max'])        { <span>الحد الأقصى المسموح {{ control?.errors?.['max']?.max }}</span> }
        @if (control?.errors?.['pattern'])    { <span>{{ patternMsg || 'صيغة غير صحيحة' }}</span> }
        @if (control?.errors?.['custom'])     { <span>{{ control?.errors?.['custom'] }}</span> }
      </div>
    }
  `,
})
export class FormErrorComponent implements OnInit, OnDestroy {
  @Input({ required: true }) control!: AbstractControl | null;
  @Input() patternMsg?: string;

  private readonly cdr  = inject(ChangeDetectorRef);
  private sub?: Subscription;

  ngOnInit(): void {
    // Subscribe to both value and status changes so OnPush CD fires
    // whenever the control's validity or touched state changes.
    if (this.control) {
      this.sub = this.control.events.subscribe(() => this.cdr.markForCheck());
    }
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }
}
