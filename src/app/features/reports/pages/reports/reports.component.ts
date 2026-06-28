import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../services/reports.service';
import { ToastService } from '../../../../core/services/toast.service';
import { KpiStripComponent } from '../../../../shared/components/kpi-strip/kpi-strip.component';
import { KpiItem } from '../../../../shared/components/kpi-strip/kpi-strip.model';
import {
  ReportsKpiSummary,
  QuickReport,
  ExportHistoryItem,
  ScheduledReport,
  CustomReportConfig,
  ExportFormat,
  ReportDataType,
  REPORT_FIELDS,
  PREVIEW_DATA,
} from '../../models/report.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiStripComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private readonly svc   = inject(ReportsService);
  private readonly toast = inject(ToastService);

  // ── Loading ──────────────────────────────────────────────────────────────
  protected readonly loadingKpi        = signal(true);
  protected readonly loadingQuick      = signal(true);
  protected readonly loadingHistory    = signal(true);
  protected readonly loadingScheduled  = signal(true);
  protected readonly exporting         = signal(false);
  protected readonly exportingQuickId  = signal<string | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  protected readonly kpiSummary   = signal<ReportsKpiSummary | null>(null);
  protected readonly quickReports = signal<QuickReport[]>([]);
  protected readonly history      = signal<ExportHistoryItem[]>([]);
  protected readonly scheduled    = signal<ScheduledReport[]>([]);

  // ── Custom report config ──────────────────────────────────────────────────
  protected config: CustomReportConfig = {
    dataType: 'bookings',
    dateFrom: '',
    dateTo:   '',
    fields:   [],
    format:   'excel',
  };

  // ── Available fields for selected data type ───────────────────────────────
  protected readonly availableFields = signal<string[]>([]);
  protected readonly checkedFields   = signal<Set<string>>(new Set());

  // ── Preview table ─────────────────────────────────────────────────────────
  protected readonly previewHeaders = signal<string[]>([]);
  protected readonly previewRows    = signal<string[][]>([]);

  // ── KPI strip ─────────────────────────────────────────────────────────────
  protected readonly kpiItems = computed<KpiItem[]>(() => {
    const s = this.kpiSummary();
    return [
      { icon: 'fa-file-export',  value: s ? String(s.exportedCount)  : '—', label: 'تقرير مُصدَّر',       variant: 'primary' },
      { icon: 'fa-clock-rotate-left', value: s ? String(s.scheduledCount) : '—', label: 'تقارير مجدولة', variant: 'green'   },
      { icon: 'fa-clock',        value: s ? s.lastExportLabel         : '—', label: 'تصدير منذ ساعتين',  variant: 'amber'   },
      { icon: 'fa-table-columns', value: s ? String(s.exportFormats)  : '—', label: 'أنواع التصدير',     variant: 'purple'  },
    ];
  });

  ngOnInit(): void {
    this.loadAll();
    this.updateFieldsForType('bookings');
    this.refreshPreview();
  }

  // ── Quick export ──────────────────────────────────────────────────────────
  protected quickExport(report: QuickReport): void {
    this.exportingQuickId.set(report.id);
    this.svc.quickExport(report.type, report.format).subscribe({
      next: (msg) => { this.toast.success(msg); this.exportingQuickId.set(null); },
      error: ()    => { this.toast.error('فشل التصدير'); this.exportingQuickId.set(null); },
    });
  }

  // ── Data type change ───────────────────────────────────────────────────────
  protected onDataTypeChange(type: string): void {
    this.config.dataType = type as ReportDataType;
    this.updateFieldsForType(type as ReportDataType);
    this.refreshPreview();
  }

  // ── Format toggle ─────────────────────────────────────────────────────────
  protected setFormat(fmt: ExportFormat): void {
    this.config.format = fmt;
  }

  // ── Field checkbox ────────────────────────────────────────────────────────
  protected toggleField(field: string, checked: boolean): void {
    const set = new Set(this.checkedFields());
    checked ? set.add(field) : set.delete(field);
    this.checkedFields.set(set);
    this.config.fields = [...set];
  }

  protected isFieldChecked(field: string): boolean {
    return this.checkedFields().has(field);
  }

  // ── Export ────────────────────────────────────────────────────────────────
  protected exportReport(): void {
    this.config.fields = [...this.checkedFields()];
    this.exporting.set(true);
    this.svc.exportReport(this.config).subscribe({
      next: (msg) => { this.toast.success(msg); this.exporting.set(false); },
      error: ()    => { this.toast.error('فشل التصدير'); this.exporting.set(false); },
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────
  private loadAll(): void {
    this.svc.getKpiSummary().subscribe({
      next: (d) => { this.kpiSummary.set(d); this.loadingKpi.set(false); },
      error: ()  => this.loadingKpi.set(false),
    });
    this.svc.getQuickReports().subscribe({
      next: (d) => { this.quickReports.set(d); this.loadingQuick.set(false); },
      error: ()  => this.loadingQuick.set(false),
    });
    this.svc.getExportHistory().subscribe({
      next: (d) => { this.history.set(d); this.loadingHistory.set(false); },
      error: ()  => this.loadingHistory.set(false),
    });
    this.svc.getScheduledReports().subscribe({
      next: (d) => { this.scheduled.set(d); this.loadingScheduled.set(false); },
      error: ()  => this.loadingScheduled.set(false),
    });
  }

  private updateFieldsForType(type: ReportDataType): void {
    const fields = REPORT_FIELDS[type] ?? [];
    this.availableFields.set(fields);
    const defaults = new Set(fields.slice(0, 5));
    this.checkedFields.set(defaults);
    this.config.fields = [...defaults];
  }

  private refreshPreview(): void {
    const data = PREVIEW_DATA[this.config.dataType];
    this.previewHeaders.set(data.headers);
    this.previewRows.set(data.rows);
  }
}
