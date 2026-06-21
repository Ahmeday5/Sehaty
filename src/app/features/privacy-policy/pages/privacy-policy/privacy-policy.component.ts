import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { PrivacyPolicyService } from '../../services/privacy-policy.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, FormsModule, CKEditorModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent implements OnInit {
  private readonly svc       = inject(PrivacyPolicyService);
  private readonly toast     = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr       = inject(ChangeDetectorRef);

  public Editor = ClassicEditor;

  public editorConfig = {
    toolbar: [
      'heading', '|',
      'bold', 'italic', '|',
      'bulletedList', 'numberedList', '|',
      'blockQuote', 'link', '|',
      'undo', 'redo',
    ],
    placeholder: 'اكتب محتوى سياسة الخصوصية هنا...',
  };

  loading      = false;
  saving       = false;
  showModal    = false;
  selectedPage = 1;

  safeContent: SafeHtml = '';
  rawContent            = '';
  editorContent         = '';

  readonly pageOptions = [
    { value: 1, label: 'خصوصية الأطباء',  icon: 'fa-user-doctor' },
    { value: 2, label: 'خصوصية المرضى',   icon: 'fa-user'        },
  ];

  ngOnInit(): void { this.load(); }

  selectPage(type: number): void {
    if (this.selectedPage === type || this.loading) return;
    this.selectedPage = type;
    this.load();
  }

  private load(): void {
    this.loading     = true;
    this.rawContent  = '';
    this.safeContent = '';
    this.cdr.detectChanges();

    this.svc.getPage(this.selectedPage).subscribe({
      next: (html) => {
        this.rawContent  = html ?? '';
        this.safeContent = this.sanitizer.bypassSecurityTrustHtml(this.rawContent);
        this.loading     = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[PrivacyPolicy] load error:', err);
        this.toast.error('فشل تحميل المحتوى');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openEditor(): void {
    this.editorContent           = this.rawContent;
    this.showModal               = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal               = false;
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.editorContent?.trim()) {
      this.toast.warning('المحتوى لا يمكن أن يكون فارغاً');
      return;
    }
    this.saving = true;
    this.cdr.detectChanges();

    this.svc.updatePage(this.selectedPage, this.editorContent).subscribe({
      next: () => {
        this.rawContent  = this.editorContent;
        this.safeContent = this.sanitizer.bypassSecurityTrustHtml(this.rawContent);
        this.toast.success('تم حفظ المحتوى بنجاح');
        this.saving = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('[PrivacyPolicy] save error:', err);
        this.toast.error('فشل حفظ المحتوى');
        this.saving = false;
        this.cdr.detectChanges();
      },
    });
  }

  get currentPageLabel(): string {
    return this.pageOptions.find(p => p.value === this.selectedPage)?.label ?? '';
  }
}
