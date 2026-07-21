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
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ItemGroupsService } from '../../services/item-groups.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { itemGroupErrorAr } from '../../utils/item-group-error-ar.util';
import {
  ItemGroup,
  ItemGroupLevel,
  ITEM_GROUP_LEVEL_LABELS,
} from '../../models/item-group.model';

/** Context for the "add" case — pre-fills level/parent when adding a child of a known node. */
export interface ItemGroupFormContext {
  level: ItemGroupLevel;
  parentId: number | null;
}

@Component({
  selector: 'app-item-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-group-form.component.html',
  styleUrl: './item-group-form.component.scss',
})
export class ItemGroupFormComponent implements OnInit {
  @Input() itemGroup?: ItemGroup;
  @Input() context?: ItemGroupFormContext;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb    = inject(FormBuilder);
  private readonly svc   = inject(ItemGroupsService);
  private readonly toast = inject(ToastService);

  protected readonly submitting = signal(false);
  protected readonly levelLabels = ITEM_GROUP_LEVEL_LABELS;
  protected readonly levels = [
    ItemGroupLevel.MainSection,
    ItemGroupLevel.MainGroup,
    ItemGroupLevel.SubGroup,
  ];

  protected form!: FormGroup;

  protected get isEdit(): boolean { return !!this.itemGroup; }

  protected get requiresParent(): boolean {
    return Number(this.form?.get('level')?.value) !== ItemGroupLevel.MainSection;
  }

  ngOnInit(): void {
    this.buildForm();
    if (this.itemGroup) {
      this.form.patchValue({
        code:     this.itemGroup.code,
        nameAr:   this.itemGroup.nameAr,
        nameEn:   this.itemGroup.nameEn,
        level:    this.itemGroup.level,
        parentId: this.itemGroup.parentId,
        isActive: this.itemGroup.isActive,
      });
      // Level/parent are structural — locking them avoids orphaning the subtree via a bad edit.
      this.form.get('level')?.disable();
      this.form.get('parentId')?.disable();
    } else if (this.context) {
      this.form.patchValue({
        level:    this.context.level,
        parentId: this.context.parentId,
      });
      this.form.get('level')?.disable();
      this.form.get('parentId')?.disable();
    }
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const v = this.form.getRawValue();
    const level = Number(v.level) as ItemGroupLevel;
    const parentId = level === ItemGroupLevel.MainSection ? null : Number(v.parentId);

    try {
      if (this.isEdit) {
        await firstValueFrom(this.svc.update(this.itemGroup!.id, {
          code: v.code.trim(),
          nameAr: v.nameAr.trim(),
          nameEn: v.nameEn.trim(),
          level,
          parentId,
          isActive: v.isActive,
        }));
        this.toast.success('تم تعديل المجموعة بنجاح');
      } else {
        await firstValueFrom(this.svc.add({
          code: v.code.trim(),
          nameAr: v.nameAr.trim(),
          nameEn: v.nameEn.trim(),
          level,
          parentId,
        }));
        this.toast.success('تم إضافة المجموعة بنجاح');
      }
      this.saved.emit();
    } catch (e: any) {
      this.toast.error(itemGroupErrorAr(e, 'حدث خطأ، يرجى المحاولة مرة أخرى'));
    } finally {
      this.submitting.set(false);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      code:     ['', [Validators.required, Validators.maxLength(20)]],
      nameAr:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      nameEn:   ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      level:    [ItemGroupLevel.MainSection, [Validators.required]],
      parentId: [null],
      isActive: [true],
    });
  }
}
