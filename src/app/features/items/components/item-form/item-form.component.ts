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
import { distinctUntilChanged } from 'rxjs/operators';
import { ItemsService } from '../../services/items.service';
import { ItemGroupsService } from '../../../item-groups/services/item-groups.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FormErrorComponent } from '../../../../shared/components/form-error/form-error.component';
import { environment } from '../../../../../environments/environment';
import { itemErrorAr } from '../../utils/item-error-ar.util';
import { Item } from '../../models/item.model';
import { ItemGroup, ItemGroupLevel } from '../../../item-groups/models/item-group.model';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-form.component.html',
  styleUrl: './item-form.component.scss',
})
export class ItemFormComponent implements OnInit {
  @Input() item?: Item;
  /** Pre-selected SubGroup id when opening the form from within a specific group's items page. */
  @Input() presetItemGroupId?: number;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(ItemsService);
  private readonly groups  = inject(ItemGroupsService);
  private readonly toast   = inject(ToastService);
  private readonly base    = environment.apiUrl.replace(/\/+$/, '');

  protected readonly submitting   = signal(false);
  protected readonly imagePreview = signal<string | null>(null);

  protected readonly mainSections = signal<ItemGroup[]>([]);
  protected readonly mainGroups   = signal<ItemGroup[]>([]);
  protected readonly subGroups    = signal<ItemGroup[]>([]);

  private imageFile?: File;

  protected form!: FormGroup;

  protected get isEdit(): boolean { return !!this.item; }

  ngOnInit(): void {
    this.buildForm();
    this.watchGroupChain();
    this.loadMainSections();

    if (this.item) {
      this.form.patchValue({
        code:                  this.item.code,
        nameAr:                this.item.nameAr,
        nameEn:                this.item.nameEn,
        unitFirst:             this.item.unitFirst ?? '',
        unitDefault:           this.item.unitDefault,
        barcode:               this.item.barcode ?? '',
        defaultConsumerPrice:  this.item.defaultConsumerPrice,
        isActive:              this.item.isActive,
      });
      if (this.item.imageUrl) this.imagePreview.set(this.resolveUrl(this.item.imageUrl));
      this.preselectGroupChain(this.item.itemGroupId);
    } else if (this.presetItemGroupId) {
      this.preselectGroupChain(this.presetItemGroupId);
    }
  }

  /**
   * Drives the cascade off the form's own value stream instead of the native (change) event.
   * With [ngValue] bindings the DOM <option> value is an Angular-internal index token, not the
   * real id, so reading $event.target.value directly (the previous approach) silently parsed
   * garbage and the dependent selects never populated correctly.
   */
  private watchGroupChain(): void {
    this.form.get('mainSectionId')!.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((id: number | null) => {
        this.mainGroups.set([]);
        this.subGroups.set([]);
        this.form.patchValue({ mainGroupId: null, subGroupId: null }, { emitEvent: false });
        if (id === null || id === undefined) return;
        this.groups.getItemGroups({ parentId: id, level: ItemGroupLevel.MainGroup, page: 1, pageSize: 10000 })
          .subscribe((res) => this.mainGroups.set(res.data ?? []));
      });

    this.form.get('mainGroupId')!.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((id: number | null) => {
        this.subGroups.set([]);
        this.form.patchValue({ subGroupId: null }, { emitEvent: false });
        if (id === null || id === undefined) return;
        this.groups.getItemGroups({ parentId: id, level: ItemGroupLevel.SubGroup, page: 1, pageSize: 10000 })
          .subscribe((res) => this.subGroups.set(res.data ?? []));
      });
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
        await firstValueFrom(this.svc.updateItem(this.item!.id, fd));
        this.toast.success('تم تعديل الصنف بنجاح');
      } else {
        await firstValueFrom(this.svc.addItem(fd));
        this.toast.success('تم إضافة الصنف بنجاح');
      }
      this.saved.emit();
    } catch (e: any) {
      this.toast.error(itemErrorAr(e, 'حدث خطأ، يرجى المحاولة مرة أخرى'));
    } finally {
      this.submitting.set(false);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      mainSectionId:        [null, [Validators.required]],
      mainGroupId:          [null, [Validators.required]],
      subGroupId:           [null, [Validators.required]],
      code:                 ['', [Validators.required, Validators.maxLength(30)]],
      nameAr:               ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      nameEn:               ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      unitFirst:            [''],
      unitDefault:          ['', [Validators.required, Validators.maxLength(30)]],
      barcode:              [''],
      defaultConsumerPrice: [0, [Validators.required, Validators.min(0)]],
      isActive:             [true],
    });
  }

  private buildFormData(): FormData {
    const fd  = new FormData();
    const v   = this.form.value;
    fd.append('Code',                  v.code.trim());
    fd.append('NameAr',                v.nameAr.trim());
    fd.append('NameEn',                v.nameEn.trim());
    fd.append('ItemGroupId',           String(v.subGroupId));
    if (v.unitFirst) fd.append('UnitFirst', v.unitFirst.trim());
    fd.append('UnitDefault',           v.unitDefault.trim());
    if (v.barcode) fd.append('Barcode', v.barcode.trim());
    fd.append('DefaultConsumerPrice',  String(v.defaultConsumerPrice));
    if (this.isEdit) fd.append('IsActive', String(v.isActive));
    if (this.imageFile) fd.append('Image', this.imageFile);
    return fd;
  }

  private loadMainSections(): void {
    this.groups.getMainSections().subscribe((res) => this.mainSections.set(res.data ?? []));
  }

  /**
   * Walks parentId up from the SubGroup to reconstruct the full MainSection→MainGroup→SubGroup
   * chain, loading each level's option list before selecting its id. All patches use
   * `emitEvent: false` — the cascade in watchGroupChain() only exists to react to the *user*
   * changing a select; replaying it here would just clear the very values we're restoring.
   */
  private preselectGroupChain(subGroupId: number): void {
    this.groups.getItemGroups({ level: ItemGroupLevel.SubGroup, page: 1, pageSize: 10000 }).subscribe((subRes) => {
      const sub = subRes.data.find((g) => g.id === subGroupId);
      if (!sub || sub.parentId === null) return;

      this.groups.getItemGroups({ level: ItemGroupLevel.MainGroup, page: 1, pageSize: 10000 }).subscribe((mgRes) => {
        const mainGroup = mgRes.data.find((g) => g.id === sub.parentId);
        if (!mainGroup || mainGroup.parentId === null) return;

        this.form.patchValue({ mainSectionId: mainGroup.parentId }, { emitEvent: false });
        this.groups.getItemGroups({ parentId: mainGroup.parentId, level: ItemGroupLevel.MainGroup, page: 1, pageSize: 10000 })
          .subscribe((res) => {
            this.mainGroups.set(res.data ?? []);
            this.form.patchValue({ mainGroupId: mainGroup.id }, { emitEvent: false });
            this.groups.getItemGroups({ parentId: mainGroup.id, level: ItemGroupLevel.SubGroup, page: 1, pageSize: 10000 })
              .subscribe((subChildren) => {
                this.subGroups.set(subChildren.data ?? []);
                this.form.patchValue({ subGroupId: sub.id }, { emitEvent: false });
              });
          });
      });
    });
  }

  private resolveUrl(url: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${this.base}/${url.replace(/^\//, '')}`;
  }
}
