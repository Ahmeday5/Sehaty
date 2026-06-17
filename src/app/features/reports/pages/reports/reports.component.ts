import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService } from '../../services/reports.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PrintService } from '../../../../core/services/print.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private readonly svc = inject(ReportsService);
  private readonly toast = inject(ToastService);
  private readonly print = inject(PrintService);

  protected readonly loading = signal(false);
  protected readonly rows = signal<any[]>([]);
  protected readonly lastUpdate = signal<Date | null>(null);

  protected dateFrom = '';
  protected dateTo = '';

  ngOnInit(): void {
    this.load();
  }

  protected refresh(): void {
    this.svc.invalidate();
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    const params: Record<string, unknown> = {};
    if (this.dateFrom) params['from'] = this.dateFrom;
    if (this.dateTo) params['to'] = this.dateTo;
    this.svc.getAppointments(params).subscribe({
      next: (res) => {
        this.rows.set(res?.data ?? res ?? []);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل تحميل التقارير');
        this.loading.set(false);
      },
    });
  }

  protected onPrint(): void {
    this.print.print<any>({
      title: 'تقرير المواعيد',
      columns: [
        { header: 'المريض', key: 'patientName' },
        { header: 'الدكتور', key: 'doctorName' },
        { header: 'التاريخ', key: 'date', format: 'date' },
        { header: 'الحالة', key: 'status' },
      ],
      rows: this.rows(),
    });
  }
}
