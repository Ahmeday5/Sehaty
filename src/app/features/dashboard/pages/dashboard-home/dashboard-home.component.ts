import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CacheService } from '../../../../core/services/cache.service';
import { DashboardStats } from '../../models/dashboard.model';

interface CardStat {
  label: string;
  value: number;
  valueToday: number;
  icon: string;
  gradient: string;
  isCurrency: boolean;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit {
  private readonly svc   = inject(DashboardService);
  private readonly toast = inject(ToastService);
  readonly cache         = inject(CacheService);

  protected readonly loading    = signal(false);
  protected readonly cardStats  = signal<CardStat[]>([]);
  protected readonly lastUpdate = signal<Date | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getStats().subscribe({
      next: (stats) => {
        this.buildCards(stats);
        this.lastUpdate.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('فشل في جلب بيانات لوحة التحكم');
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.cache.invalidate('Dashboard');
    this.load();
  }

  private buildCards(stats: DashboardStats): void {
    this.cardStats.set([
      {
        label:      'المواعيد',
        value:      stats.totalAppointments,
        valueToday: stats.todayAppointments,
        icon:       'fa-calendar-check',
        gradient:   'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        isCurrency: false,
      },
      {
        label:      'المرضى',
        value:      stats.totalPatients,
        valueToday: stats.todayPatients,
        icon:       'fa-users',
        gradient:   'linear-gradient(135deg, #14c8c7 0%, #0891b2 100%)',
        isCurrency: false,
      },
      {
        label:      'الأرباح',
        value:      stats.totalProfit,
        valueToday: stats.profitToday,
        icon:       'fa-circle-dollar-to-slot',
        gradient:   'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        isCurrency: true,
      },
    ]);
  }
}
